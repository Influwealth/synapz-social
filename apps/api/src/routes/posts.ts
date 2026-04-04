/**
 * Posts Router — SynapZ-Social
 * POST /posts/create  → ICP content_feed + SynapZ-Core moderation gate
 * GET  /posts/:id     → ICP content_feed
 * GET  /posts/author/:principal → paginated author posts
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authGuard }    from '../middleware/authGuard'
import { writeLimit }   from '../middleware/rateLimit'
import { contentFeed, moderationCanister } from '../services/icpClient'
import { moderateContent } from '../services/synapzClient'

export const postsRouter = Router()

const createSchema = z.object({
  content   : z.string().min(1).max(5_000),
  mediaRef  : z.string().optional(),
  postType  : z.enum(['Short','Long','VideoRef','Repost']).default('Short'),
  tags      : z.array(z.string()).max(10).default([]),
  capsuleTag: z.string().optional(),
  parentId  : z.number().optional(),
})

// POST /posts/create
postsRouter.post('/create', authGuard, writeLimit, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid post data', details: parsed.error.flatten() })

  // ── SynapZ-Core moderation gate (Qubit) ────────────────────
  const modResult = await moderateContent(parsed.data.content, 0, req.sapTrace)
  if (!modResult.allow && modResult.decision === 'hard-block') {
    return res.status(422).json({
      error   : 'Content blocked by sovereign moderation',
      decision: modResult.decision,
      sapTrace: req.sapTrace,
    })
  }

  // ── Write to ICP content_feed canister ──────────────────────
  const result = await contentFeed.createPost({
    content   : parsed.data.content,
    mediaRef  : parsed.data.mediaRef ? [parsed.data.mediaRef] : [],
    postType  : { [parsed.data.postType]: null },
    tags      : parsed.data.tags,
    capsuleTag: parsed.data.capsuleTag ? [parsed.data.capsuleTag] : [],
    parentId  : parsed.data.parentId !== undefined ? [parsed.data.parentId] : [],
  }) as any

  // ── Store decision in moderation canister ───────────────────
  if (result?.postId?.[0]) {
    await moderationCanister.recordDecision(
      result.postId[0], { Allow: null },
      modResult.rationale, modResult.qubitState, 'NEUTRAL'
    )
  }

  return res.status(201).json({
    post      : result,
    moderation: { decision: modResult.decision, qubitState: modResult.qubitState },
    sapTrace  : req.sapTrace,
  })
})

// GET /posts/:id
postsRouter.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' })
  const post = await contentFeed.getPost(id)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  return res.json(post)
})

// GET /posts/author/:principal
postsRouter.get('/author/:principal', async (req: Request, res: Response) => {
  const cursor = Number(req.query.cursor) || 0
  const limit  = Math.min(Number(req.query.limit) || 20, 50)
  const posts  = await contentFeed.listByAuthor(req.params.principal, cursor, limit)
  return res.json({ posts, cursor, limit, sapTrace: req.sapTrace })
})
