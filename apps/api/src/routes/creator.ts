/**
 * Creator Router — SynapZ-Social
 * POST /creator/set-tier
 * GET  /creator/stats/:principal
 * POST /creator/record-engagement
 * GET  /creator/recommendations  → SynapZ-Core Meta-Unit
 */

import { Router, Request, Response } from 'express'
import { z }              from 'zod'
import { authGuard }      from '../middleware/authGuard'
import { requireRole }    from '../middleware/authGuard'
import { creatorEconomy } from '../services/icpClient'
import { recommendCreators, scoreCreator } from '../services/synapzClient'

export const creatorRouter = Router()

const tierSchema = z.object({
  tier         : z.enum(['Free','Rising','Pro','Sovereign']),
  monthlyTarget: z.number().min(0).default(0),
  revenueShare : z.number().min(0).max(10000).default(7000),
  capsuleAccess: z.array(z.string()).default([]),
})

// POST /creator/set-tier
creatorRouter.post('/set-tier', authGuard, async (req: Request, res: Response) => {
  const parsed = tierSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid tier data' })

  const tierData = {
    tier          : { [parsed.data.tier]: null },
    monthlyTarget : parsed.data.monthlyTarget,
    revenueShare  : parsed.data.revenueShare,
    capsuleAccess : parsed.data.capsuleAccess,
    verifiedAt    : BigInt(Date.now()),
  }

  const result = await creatorEconomy.setTier(tierData)
  return res.json({ result, sapTrace: req.sapTrace })
})

// GET /creator/stats/:principal
creatorRouter.get('/stats/:principal', async (req: Request, res: Response) => {
  try {
    const stats = await creatorEconomy.getStats(req.params.principal)

    // Augment with SynapZ-Core Qudit score
    const score = await scoreCreator(req.params.principal, {}, req.sapTrace)

    return res.json({ stats, quditScore: score, sapTrace: req.sapTrace })
  } catch {
    return res.status(400).json({ error: 'Invalid principal or stats unavailable' })
  }
})

// POST /creator/record-engagement
const engagementSchema = z.object({
  creator    : z.string(),
  views      : z.number().default(0),
  watchTimeMs: z.number().default(0),
  likes      : z.number().default(0),
  comments   : z.number().default(0),
  shares     : z.number().default(0),
  followers  : z.number().default(0),
})

creatorRouter.post('/record-engagement', authGuard, requireRole('admin', 'sovereign'), async (req: Request, res: Response) => {
  const parsed = engagementSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid engagement data' })

  const { creator, ...delta } = parsed.data
  const result = await creatorEconomy.recordEngagement(creator, { ...delta, updatedAt: BigInt(Date.now()) })
  return res.json({ result, sapTrace: req.sapTrace })
})

// GET /creator/recommendations — SynapZ-Core Meta-Unit
creatorRouter.get('/recommendations', authGuard, async (req: Request, res: Response) => {
  const recs = await recommendCreators(String(req.user!.userId), req.sapTrace)
  return res.json({ recommendations: recs, sapTrace: req.sapTrace })
})
