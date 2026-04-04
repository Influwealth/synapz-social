/**
 * authGuard — Sovereign JWT Middleware
 * SynapZ-Social | InfluWealth Quantum Labs | SAP v1.0
 */

import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/auth'

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sovereign identity required', sapTrace: req.sapTrace })
    return
  }
  const user = verifyToken(header.slice(7))
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired sovereign token', sapTrace: req.sapTrace })
    return
  }
  req.user = user
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: `Role required: ${roles.join(' | ')}`, sapTrace: req.sapTrace })
      return
    }
    next()
  }
}
