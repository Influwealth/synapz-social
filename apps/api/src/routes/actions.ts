/**
 * Actions Router — SynapZ-Social
 * POST /actions/like/:postId
 * POST /actions/follow/:principal
 * POST /actions/unfollow/:principal
 * POST /actions/flag/:postId
 * POST /actions/block/:principal
 */

import { Router, Request, Response } from 'express'
import { z }               from 'zod'
import { authGuard }       from '../middleware/authGuard'
import { actionLimit }     from '../middleware/rateLimit'
import { contentFeed, socialGraph, moderationCanister } from '../services/icpClient'

export const actionsRouter = Router()

// POST /actions/like/:postId
actionsRouter.post('/like/:postId', authGuard, actionLimit, async (req: Request, res: Response) => {
  const postId = Number(req.params.postId)
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID' })
  const result = await contentFeed.likePost(postId)
  return res.json({ result, sapTrace: req.sapTrace })
})

// POST /actions/follow/:principal
actionsRouter.post('/follow/:principal', authGuard, actionLimit, async (req: Request, res: Response) => {
  try {
    const result = await socialGraph.follow(req.params.principal)
    return res.json({ result, sapTrace: req.sapTrace })
  } catch {
    return res.status(400).json({ error: 'Invalid principal' })
  }
})

// POST /actions/unfollow/:principal
actionsRouter.post('/unfollow/:principal', authGuard, actionLimit, async (req: Request, res: Response) => {
  try {
    const result = await socialGraph.unfollow(req.params.principal)
    return res.json({ result, sapTrace: req.sapTrace })
  } catch {
    return res.status(400).json({ error: 'Invalid principal' })
  }
})

// POST /actions/block/:principal
actionsRouter.post('/block/:principal', authGuard, actionLimit, async (req: Request, res: Response) => {
  try {
    const result = await socialGraph.blockUser(req.params.principal)
    return res.json({ result, sapTrace: req.sapTrace })
  } catch {
    return res.status(400).json({ error: 'Invalid principal' })
  }
})

// POST /actions/flag/:postId
const flagSchema = z.object({
  reason: z.enum(['Spam','Harassment','Misinformation','InappropriateContent','CopyrightViolation','Other']),
  detail: z.string().max(200).optional(),
})

actionsRouter.post('/flag/:postId', authGuard, actionLimit, async (req: Request, res: Response) => {
  const postId = Number(req.params.postId)
  if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID' })

  const parsed = flagSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid flag reason' })

  const reason = parsed.data.reason === 'Other'
    ? { Other: parsed.data.detail || '' }
    : { [parsed.data.reason]: null }

  const result = await moderationCanister.submitFlag(postId, reason)
  return res.status(201).json({ result, sapTrace: req.sapTrace })
})
