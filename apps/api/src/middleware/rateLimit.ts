/**
 * Rate Limit Middleware — SynapZ-Social
 * Per-route sovereign throttling. Agents get higher limits via SAP node ID.
 */

import rateLimit from 'express-rate-limit'

const isAgent = (req: any) =>
  String(req.headers['x-sap-node-id'] || '').startsWith('wealthbridge-') ||
  String(req.headers['x-sap-node-id'] || '').startsWith('agent-')

export const feedLimit = rateLimit({
  windowMs: 60_000, max: 60,
  skip    : isAgent,
  message : { error: 'Feed rate limit exceeded.' },
})

export const writeLimit = rateLimit({
  windowMs: 60_000, max: 20,
  skip    : isAgent,
  message : { error: 'Write rate limit exceeded.' },
})

export const actionLimit = rateLimit({
  windowMs: 60_000, max: 100,
  skip    : isAgent,
  message : { error: 'Action rate limit exceeded.' },
})
