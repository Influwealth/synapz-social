/**
 * Feed Router — SynapZ-Social
 * GET /feed         → ICP list_feed_for_user → SynapZ-Core rankFeed (Qudit)
 * GET /feed/explore → public exploration feed
 */

import { Router, Request, Response } from 'express'
import { feedLimit }      from '../middleware/rateLimit'
import { contentFeed }    from '../services/icpClient'
import { rankFeed }       from '../services/synapzClient'

export const feedRouter = Router()

// GET /feed — personalized ranked feed
feedRouter.get('/', feedLimit, async (req: Request, res: Response) => {
  const cursor = Number(req.query.cursor) || 0
  const limit  = Math.min(Number(req.query.limit) || 20, 50)

  // ── 1. Pull candidate posts from ICP ───────────────────────
  const rawPosts = await contentFeed.listFeed(cursor, limit * 2) as any[]  // fetch 2x for ranking headroom

  // ── 2. Rank via SynapZ-Core Qudit ──────────────────────────
  const userContext = {
    userId: req.user?.userId ? String(req.user.userId) : 'anonymous',
    role  : req.user?.role || 'member',
  }

  const rankable = (rawPosts || []).map((p: any) => ({
    id        : p.id || 0,
    content   : p.content || '',
    authorRole: 'member',
    capsuleTag: p.capsuleTag?.[0] || undefined,
    likes     : p.likes || 0,
  }))

  const ranked = await rankFeed(rankable, userContext, req.sapTrace)

  // ── 3. Sort by Qudit score, slice to limit ─────────────────
  const scoreMap = new Map(ranked.map(r => [r.postId, r.rankScore]))
  const sorted   = (rawPosts || [])
    .map((p: any) => ({ ...p, _rankScore: scoreMap.get(p.id) ?? 500 }))
    .sort((a, b) => b._rankScore - a._rankScore)
    .slice(0, limit)

  return res.json({
    posts      : sorted,
    total      : sorted.length,
    cursor     : cursor + limit,
    ranked     : true,
    rankedBy   : 'SynapZ-Core Qudit (feed-rank)',
    sapTrace   : req.sapTrace,
  })
})

// GET /feed/explore — public, no auth needed
feedRouter.get('/explore', feedLimit, async (req: Request, res: Response) => {
  const cursor = Number(req.query.cursor) || 0
  const limit  = Math.min(Number(req.query.limit) || 20, 50)
  const posts  = await contentFeed.listFeed(cursor, limit)
  return res.json({ posts, cursor: cursor + limit, sapTrace: req.sapTrace })
})
