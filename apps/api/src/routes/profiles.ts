/**
 * Profiles Router — SynapZ-Social
 * GET  /profiles/:principal     → social_graph.get_profile
 * POST /profiles/create         → social_graph.create_profile
 * PUT  /profiles/update         → social_graph.update_profile
 * GET  /profiles/:principal/followers
 * GET  /profiles/:principal/following
 */

import { Router, Request, Response } from 'express'
import { z }            from 'zod'
import { authGuard }    from '../middleware/authGuard'
import { writeLimit }   from '../middleware/rateLimit'
import { socialGraph }  from '../services/icpClient'

export const profilesRouter = Router()

const profileSchema = z.object({
  handle      : z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric + underscore only'),
  displayName : z.string().min(1).max(64),
  bio         : z.string().max(500).default(''),
  avatarUri   : z.string().url().optional().default(''),
  links       : z.array(z.string().url()).max(5).default([]),
  role        : z.enum(['Member', 'Creator', 'Youth', 'Business']).default('Member'),
  sovereignId : z.string().default(''),
})

// GET /profiles/:principal
profilesRouter.get('/:principal', async (req: Request, res: Response) => {
  try {
    const profile = await socialGraph.getProfile(req.params.principal)
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    return res.json(profile)
  } catch {
    return res.status(400).json({ error: 'Invalid principal' })
  }
})

// POST /profiles/create
profilesRouter.post('/create', authGuard, writeLimit, async (req: Request, res: Response) => {
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile data', details: parsed.error.flatten() })

  const result = await socialGraph.createProfile({
    ...parsed.data,
    sovereignId: parsed.data.sovereignId || req.user!.sovereignId,
    role       : { [parsed.data.role]: null },
  })
  return res.status(201).json({ result, sapTrace: req.sapTrace })
})

// PUT /profiles/update
profilesRouter.put('/update', authGuard, async (req: Request, res: Response) => {
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile data' })
  const result = await socialGraph.updateProfile({ ...parsed.data, role: { [parsed.data.role]: null } })
  return res.json({ result, sapTrace: req.sapTrace })
})

// GET /profiles/:principal/followers
profilesRouter.get('/:principal/followers', async (req: Request, res: Response) => {
  try {
    const followers = await socialGraph.getFollowers(req.params.principal)
    return res.json({ followers, count: (followers as any[]).length })
  } catch {
    return res.status(400).json({ error: 'Invalid principal' })
  }
})

// GET /profiles/:principal/following
profilesRouter.get('/:principal/following', async (req: Request, res: Response) => {
  try {
    const following = await socialGraph.getFollowing(req.params.principal)
    return res.json({ following, count: (following as any[]).length })
  } catch {
    return res.status(400).json({ error: 'Invalid principal' })
  }
})
