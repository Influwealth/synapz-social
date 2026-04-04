/**
 * SynapZ-Social API
 * ─────────────────────────────────────────────────────────────
 * Sovereign Social Network Platform
 * InfluWealth Quantum Labs | WealthBridge OS | SAP v1.0
 *
 * Bridges: ICP Canisters ↔ SynapZ-Core ↔ Web/Wix
 * ─────────────────────────────────────────────────────────────
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { v4 as uuid } from 'uuid'

import { postsRouter    } from './routes/posts'
import { profilesRouter } from './routes/profiles'
import { feedRouter     } from './routes/feed'
import { actionsRouter  } from './routes/actions'
import { creatorRouter  } from './routes/creator'
import { pipelineRouter } from './routes/pipeline'

const app  = express()
const PORT = process.env.API_PORT || 4001

// ── Security ───────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '2mb' }))
app.use(rateLimit({ windowMs: 60_000, max: 120,
  message: { error: 'Rate limit exceeded. Sovereign node throttled.' } }))

// ── SAP Trace Stamping ─────────────────────────────────────────
app.use((req: any, res, next) => {
  req.sapTrace = uuid()
  res.setHeader('x-sap-trace-id', req.sapTrace)
  res.setHeader('x-sap-node',     'synapz-social-api')
  res.setHeader('x-sap-version',  '1.0')
  next()
})

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/v1/posts',    postsRouter)
app.use('/api/v1/profiles', profilesRouter)
app.use('/api/v1/feed',     feedRouter)
app.use('/api/v1/actions',  actionsRouter)
app.use('/api/v1/creator',  creatorRouter)
app.use('/api/v1/pipeline', pipelineRouter)

// ── Health ─────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status           : 'operational',
  node             : 'synapz-social-api',
  sapVersion       : '1.0',
  icpConnected     : !!process.env.ICP_HOST,
  synapzCoreUrl    : process.env.SYNAPZ_CORE_URL || 'not configured',
  wealthbridgeAligned: true,
  ts               : new Date().toISOString(),
}))

// ── Boot ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () =>
    console.log(`[SynapZ-Social] API online → port ${PORT}`)
  )
}

export default app
