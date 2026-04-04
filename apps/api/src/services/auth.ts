/**
 * Auth Service — SynapZ-Social
 * JWT verification aligned with SynapZ-Core sovereign identity.
 * Token payload mirrors SynapZ-Core: userId, sovereignId, role, capsuleAccess
 */

import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export interface SocialUser {
  userId        : number
  email         : string
  sovereignId   : string
  role          : string
  capsuleAccess : string[]
  icpPrincipal ?: string
}

declare global {
  namespace Express {
    interface Request {
      user    ?: SocialUser
      sapTrace : string
    }
  }
}

export function verifyToken(token: string): SocialUser | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as SocialUser
  } catch {
    return null
  }
}

export function issueToken(user: Omit<SocialUser, never>): string {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '7d' })
}
