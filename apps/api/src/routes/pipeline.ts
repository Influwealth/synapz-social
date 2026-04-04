/**
 * Pipeline Router — SynapZ-Social
 * Sovereign learning + business tracks for youth and community builders.
 *
 * GET  /pipeline/my-track         → current user's active track
 * GET  /pipeline/tracks           → list all available tracks
 * POST /pipeline/enroll           → enroll in a track
 * GET  /pipeline/tracks/:id/progress
 *
 * Tracks align with WealthBridge OS community nodes:
 *   youth-financial   → East Flatbush, Greenville, Baltimore
 *   business-builder  → G5 Formation, Marisany LLC
 *   creator-economy   → All nodes
 *   diaspora-wealth   → Senegal/Africa node (2027)
 */

import { Router, Request, Response } from 'express'
import { z }           from 'zod'
import { authGuard }   from '../middleware/authGuard'
import { summarizeContent } from '../services/synapzClient'

export const pipelineRouter = Router()

// ── Track Definitions (static — move to DB/canister in production) ─
const TRACKS = [
  {
    id         : 'youth-financial',
    name       : 'Youth Financial Literacy',
    description: 'Master sovereign money principles — saving, credit, investing, ownership.',
    community  : ['East Flatbush', 'Greenville NC', 'Baltimore MD'],
    capsule    : 'cap-youth-financial',
    stages     : ['Foundations', 'Credit & Banking', 'Investing', 'Ownership', 'Sovereign Wealth'],
    roleRequired: 'Youth',
  },
  {
    id         : 'business-builder',
    name       : 'Sovereign Business Builder',
    description: 'Build and register a sovereign business entity from ground up.',
    community  : ['G5 Formation', 'Marisany LLC'],
    capsule    : 'cap-wealthbridge-genesis',
    stages     : ['Entity Formation', 'Banking', 'Revenue', 'Scaling', 'Exit Strategy'],
    roleRequired: 'Business',
  },
  {
    id         : 'creator-economy',
    name       : 'Creator Economy Track',
    description: 'Monetize your content, build your audience, own your platform.',
    community  : ['All nodes'],
    capsule    : 'cap-synapz-feed',
    stages     : ['Profile', 'Content Strategy', 'Audience', 'Monetization', 'Sovereign Creator'],
    roleRequired: 'Creator',
  },
  {
    id         : 'diaspora-wealth',
    name       : 'Diaspora Wealth Bridge',
    description: 'Connect diaspora capital flows between US nodes and Senegal/Africa (2027).',
    community  : ['Senegal', 'All nodes'],
    capsule    : 'cap-wealthbridge-genesis',
    stages     : ['Identity', 'Cross-border Finance', 'ICP Integration', 'DAO Participation', 'Sovereignty'],
    roleRequired: 'Member',
    launchDate : '2027-01-01',
  },
]

// In-memory enrollment (wire to ICP canister in production)
const enrollments: Record<string, { trackId: string; stage: number; startedAt: string }> = {}

// GET /pipeline/tracks
pipelineRouter.get('/tracks', (_req: Request, res: Response) => {
  res.json({ tracks: TRACKS })
})

// GET /pipeline/my-track
pipelineRouter.get('/my-track', authGuard, (req: Request, res: Response) => {
  const userId    = String(req.user!.userId)
  const enrollment = enrollments[userId]
  if (!enrollment) return res.json({ enrolled: false, tracks: TRACKS })

  const track = TRACKS.find(t => t.id === enrollment.trackId)
  return res.json({
    enrolled   : true,
    track,
    stage      : enrollment.stage,
    stageName  : track?.stages[enrollment.stage] || 'Unknown',
    startedAt  : enrollment.startedAt,
    sapTrace   : req.sapTrace,
  })
})

// POST /pipeline/enroll
const enrollSchema = z.object({ trackId: z.string() })

pipelineRouter.post('/enroll', authGuard, async (req: Request, res: Response) => {
  const parsed = enrollSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'trackId required' })

  const track = TRACKS.find(t => t.id === parsed.data.trackId)
  if (!track) return res.status(404).json({ error: 'Track not found' })

  const userId = String(req.user!.userId)
  enrollments[userId] = { trackId: track.id, stage: 0, startedAt: new Date().toISOString() }

  // Summarize track intro via SynapZ-Core NIM
  const intro = await summarizeContent(track.description, req.sapTrace)

  return res.status(201).json({
    enrolled: true,
    track,
    stage   : 0,
    stageName: track.stages[0],
    intro   : intro.summary,
    sapTrace: req.sapTrace,
  })
})

// GET /pipeline/tracks/:id/progress
pipelineRouter.get('/tracks/:id/progress', authGuard, (req: Request, res: Response) => {
  const userId = String(req.user!.userId)
  const enrollment = enrollments[userId]
  if (!enrollment || enrollment.trackId !== req.params.id) {
    return res.status(404).json({ error: 'Not enrolled in this track' })
  }
  const track = TRACKS.find(t => t.id === req.params.id)
  return res.json({
    trackId   : req.params.id,
    stage     : enrollment.stage,
    stageName : track?.stages[enrollment.stage],
    totalStages: track?.stages.length,
    pct       : Math.round((enrollment.stage / (track?.stages.length || 1)) * 100),
    sapTrace  : req.sapTrace,
  })
})
