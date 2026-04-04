/**
 * ICP Client — SynapZ-Social → ICP Canister Bridge
 * ─────────────────────────────────────────────────────────────
 * Wraps @dfinity/agent calls to the 5 SynapZ-Social canisters.
 * Canister IDs are loaded from env (local) or canister_ids.json (mainnet).
 *
 * Canisters:
 *   social_graph    — profiles, follows, graph
 *   content_feed    — posts, comments, feed
 *   creator_economy — tiers, metrics, payouts
 *   moderation      — flags, decisions, Qubit results
 *   media_registry  — URIs, hashes, ownership
 * ─────────────────────────────────────────────────────────────
 */

import { HttpAgent, Actor } from '@dfinity/agent'
import { Principal }        from '@dfinity/principal'

const ICP_HOST = process.env.ICP_HOST || 'http://127.0.0.1:4943'
const IS_LOCAL = process.env.ICP_NETWORK !== 'ic'

function makeAgent(): HttpAgent {
  const agent = new HttpAgent({ host: ICP_HOST })
  if (IS_LOCAL) {
    // Required for local replica — skips root key verification
    agent.fetchRootKey().catch(console.error)
  }
  return agent
}

// ── Canister ID Registry ───────────────────────────────────────
const CANISTER_IDS = {
  social_graph    : process.env.CANISTER_ID_SOCIAL_GRAPH     || 'PENDING',
  content_feed    : process.env.CANISTER_ID_CONTENT_FEED     || 'PENDING',
  creator_economy : process.env.CANISTER_ID_CREATOR_ECONOMY  || 'PENDING',
  moderation      : process.env.CANISTER_ID_MODERATION       || 'PENDING',
  media_registry  : process.env.CANISTER_ID_MEDIA_REGISTRY   || 'PENDING',
}

// ── Generic Canister Caller ────────────────────────────────────
// In production, replace `any` with generated Candid types from dfx
async function callCanister(
  canisterName: keyof typeof CANISTER_IDS,
  method      : string,
  args        : unknown[] = []
): Promise<unknown> {
  const agent    = makeAgent()
  const idl      = ({ IDL }: any) => IDL.Service({}) // stub — replace with generated IDL
  const canisterId = CANISTER_IDS[canisterName]

  if (canisterId === 'PENDING') {
    throw new Error(`[ICP] Canister ID for ${canisterName} not configured. Set CANISTER_ID_${canisterName.toUpperCase()} in .env`)
  }

  // In production wire real Actor + IDL factory from:
  //   dfx generate → declarations/<canister>/<canister>.did.js
  console.log(`[ICP] ${canisterName}.${method}(${JSON.stringify(args).slice(0, 80)})`)

  // Stub response — replace with real Actor call
  return { ok: true, stub: true, canister: canisterName, method, args }
}

// ── social_graph ───────────────────────────────────────────────
export const socialGraph = {
  createProfile : (input: unknown)                      => callCanister('social_graph', 'create_profile', [input]),
  updateProfile : (input: unknown)                      => callCanister('social_graph', 'update_profile', [input]),
  getProfile    : (principal: string)                   => callCanister('social_graph', 'get_profile',    [Principal.fromText(principal)]),
  follow        : (followee: string)                    => callCanister('social_graph', 'follow',          [Principal.fromText(followee)]),
  unfollow      : (followee: string)                    => callCanister('social_graph', 'unfollow',        [Principal.fromText(followee)]),
  getFollowers  : (principal: string)                   => callCanister('social_graph', 'get_followers',   [Principal.fromText(principal)]),
  getFollowing  : (principal: string)                   => callCanister('social_graph', 'get_following',   [Principal.fromText(principal)]),
  blockUser     : (target: string)                      => callCanister('social_graph', 'block_user',      [Principal.fromText(target)]),
}

// ── content_feed ───────────────────────────────────────────────
export const contentFeed = {
  createPost       : (input: unknown)                   => callCanister('content_feed', 'create_post',          [input]),
  getPost          : (postId: number)                   => callCanister('content_feed', 'get_post',              [postId]),
  listByAuthor     : (author: string, cursor: number, limit: number) =>
                                                           callCanister('content_feed', 'list_posts_by_author',  [Principal.fromText(author), cursor, limit]),
  listFeed         : (cursor: number, limit: number)    => callCanister('content_feed', 'list_feed_for_user',    [cursor, limit]),
  hidePost         : (postId: number)                   => callCanister('content_feed', 'hide_post',             [postId]),
  likePost         : (postId: number)                   => callCanister('content_feed', 'like_post',             [postId]),
}

// ── creator_economy ────────────────────────────────────────────
export const creatorEconomy = {
  setTier         : (tierData: unknown)                 => callCanister('creator_economy', 'set_creator_tier',   [tierData]),
  getTier         : (principal: string)                 => callCanister('creator_economy', 'get_creator_tier',   [Principal.fromText(principal)]),
  recordEngagement: (creator: string, delta: unknown)   => callCanister('creator_economy', 'record_engagement',  [Principal.fromText(creator), delta]),
  getStats        : (principal: string)                 => callCanister('creator_economy', 'get_creator_stats',  [Principal.fromText(principal)]),
  setQuditScore   : (creator: string, score: number)    => callCanister('creator_economy', 'set_qudit_score',    [Principal.fromText(creator), score]),
  recordPayout    : (creator: string, entry: unknown)   => callCanister('creator_economy', 'record_payout',      [Principal.fromText(creator), entry]),
}

// ── moderation ─────────────────────────────────────────────────
export const moderationCanister = {
  submitFlag              : (postId: number, reason: unknown)                                          =>
    callCanister('moderation', 'submit_flag', [postId, reason]),
  recordDecision          : (postId: number, decision: unknown, rationale: string, qubitState: number, quditLabel: string) =>
    callCanister('moderation', 'record_moderation_decision', [postId, decision, rationale, qubitState, quditLabel]),
  getModerationState      : (postId: number)                                                           =>
    callCanister('moderation', 'get_moderation_state', [postId]),
  listFlagged             : (limit: number)                                                            =>
    callCanister('moderation', 'list_flagged_posts', [limit]),
}

// ── media_registry ─────────────────────────────────────────────
export const mediaRegistry = {
  registerMedia    : (input: unknown)               => callCanister('media_registry', 'register_media',       [input]),
  getMedia         : (mediaId: number)              => callCanister('media_registry', 'get_media',            [mediaId]),
  listByOwner      : (owner: string, cursor: number, limit: number) =>
                                                       callCanister('media_registry', 'list_media_by_owner',  [Principal.fromText(owner), cursor, limit]),
  getByHash        : (hash: string)                 => callCanister('media_registry', 'get_by_hash',          [hash]),
}
