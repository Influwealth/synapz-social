/**
 * SynapZ Client — SynapZ-Social → SynapZ-Core Bridge
 * ─────────────────────────────────────────────────────────────
 * Calls the SynapZ-Core intelligence API (repo: synapz)
 * for all AI-powered operations:
 *
 *   rankFeed         → /agents/feed/rank     (Qudit)
 *   moderateContent  → /agents/moderate      (Qubit)
 *   recommendCreators→ /agents/recommend     (Meta-Unit)
 *   summarizeContent → /agents/summary       (NIM → compliance)
 *   captionVideo     → /agents/caption       (NIM → automation)
 *   scoreCreator     → /agents/creator/score (Qudit + Meta-Unit)
 * ─────────────────────────────────────────────────────────────
 */

const SYNAPZ_CORE_URL = process.env.SYNAPZ_CORE_URL || 'http://localhost:4000'
const SYNAPZ_API_KEY  = process.env.SYNAPZ_CORE_API_KEY || ''

interface CoreRequest {
  endpoint: string
  body    : Record<string, unknown>
  sapTrace: string
}

async function callCore<T>(req: CoreRequest): Promise<T> {
  const url = `${SYNAPZ_CORE_URL}${req.endpoint}`
  try {
    const res = await fetch(url, {
      method : 'POST',
      headers: {
        'Content-Type'    : 'application/json',
        'x-sap-node-id'   : 'synapz-social-api',
        'x-sap-version'   : '1.0',
        'x-sap-trace-id'  : req.sapTrace,
        ...(SYNAPZ_API_KEY ? { 'x-api-key': SYNAPZ_API_KEY } : {}),
      },
      body   : JSON.stringify(req.body),
      signal : AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`SynapZ-Core ${req.endpoint} → ${res.status}`)
    return res.json() as Promise<T>
  } catch (err) {
    console.error(`[SynapZ-Core] ${req.endpoint} failed:`, err)
    // Return safe fallback — never crash the social API over intelligence failures
    return { error: 'SynapZ-Core unavailable', fallback: true } as T
  }
}

// ── Feed Ranking (Qudit) ───────────────────────────────────────
export interface RankedPost {
  postId    : number
  rankScore : number      // 0–1000 (Qudit confidence * 1000)
  label     : string      // REJECT | LOW | NEUTRAL | APPROVE | HIGH_APPROVE
}

export async function rankFeed(
  posts      : Array<{ id: number; content: string; authorRole: string; capsuleTag?: string; likes: number }>,
  userContext: { userId: string; role: string },
  sapTrace   : string
): Promise<RankedPost[]> {
  const result = await callCore<{ ranked: RankedPost[] }>({
    endpoint: '/api/v1/agents/qudit/qudit-feed-rank',
    body    : { input: { posts, userContext } },
    sapTrace,
  })
  return result.ranked ?? posts.map(p => ({ postId: p.id, rankScore: 500, label: 'NEUTRAL' }))
}

// ── Content Moderation (Qubit) ─────────────────────────────────
export interface ModerationResult {
  allow      : boolean
  decision   : 'allow' | 'soft-block' | 'hard-block' | 'review'
  qubitState : number     // 0 or 1
  rationale  : string
}

export async function moderateContent(
  content  : string,
  postId   : number,
  sapTrace : string
): Promise<ModerationResult> {
  const result = await callCore<{ state: number; label: string; payload: ModerationResult }>({
    endpoint: '/api/v1/agents/qubit/qubit-content-policy',
    body    : { input: { content, postId } },
    sapTrace,
  })
  if (result.payload) return result.payload
  return { allow: true, decision: 'allow', qubitState: 1, rationale: 'Fallback — SynapZ-Core unavailable' }
}

// ── Creator Recommendations (Meta-Unit) ───────────────────────
export interface CreatorRecommendation {
  creatorId : string
  score     : number
  reason    : string
}

export async function recommendCreators(
  userId   : string,
  sapTrace : string
): Promise<CreatorRecommendation[]> {
  const result = await callCore<{ recommendations: CreatorRecommendation[] }>({
    endpoint: '/api/v1/agents/meta/meta-agent-invocation',
    body    : { input: { userId, task: 'recommend_creators' } },
    sapTrace,
  })
  return result.recommendations ?? []
}

// ── Content Summary (NIM → compliance lane) ───────────────────
export interface SummaryResult {
  summary  : string
  model    : string
  tokens   : number
}

export async function summarizeContent(
  content  : string,
  sapTrace : string
): Promise<SummaryResult> {
  const result = await callCore<{ content: string; model: string; tokens: number }>({
    endpoint: '/api/v1/agents/nim',
    body    : { target: 'compliance', prompt: `Summarize this content in 2 sentences: ${content}`, maxTokens: 150 },
    sapTrace,
  })
  return { summary: result.content || content.slice(0, 200), model: result.model || 'fallback', tokens: result.tokens || 0 }
}

// ── Creator Scoring (Qudit) ────────────────────────────────────
export interface CreatorScore {
  score     : number      // 0–1000
  label     : string
  nimTarget : string
}

export async function scoreCreator(
  creatorId : string,
  metrics   : Record<string, number>,
  sapTrace  : string
): Promise<CreatorScore> {
  const result = await callCore<{ confidence: number; label: string; nimTarget: string }>({
    endpoint: '/api/v1/agents/qudit/qudit-agent-trust',
    body    : { input: { nodeId: `creator-${creatorId}`, sapVersion: '1.0', knownNode: true, ...metrics } },
    sapTrace,
  })
  return {
    score    : Math.round((result.confidence || 0.5) * 1000),
    label    : result.label || 'NEUTRAL',
    nimTarget: result.nimTarget || 'nvq-mesh',
  }
}
