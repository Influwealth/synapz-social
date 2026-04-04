/**
 * API Client — SynapZ-Social Web
 * Typed fetch wrapper with SAP headers on every request.
 */

const BASE = '/api/v1'

export interface ApiOptions extends RequestInit {
  token?: string | null
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, ...fetchOpts } = opts
  const headers: Record<string, string> = {
    'Content-Type'  : 'application/json',
    'x-sap-node-id' : 'synapz-social-web',
    'x-sap-version' : '1.0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...fetchOpts, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Typed endpoints ────────────────────────────────────────────
export const socialApi = {
  feed        : (cursor = 0, token?: string)   => api<any>(`/feed?cursor=${cursor}`, { token }),
  explore     : (cursor = 0)                   => api<any>(`/feed/explore?cursor=${cursor}`),
  getPost     : (id: number)                   => api<any>(`/posts/${id}`),
  createPost  : (body: object, token: string)  => api<any>('/posts/create', { method: 'POST', body: JSON.stringify(body), token }),
  getProfile  : (principal: string)            => api<any>(`/profiles/${principal}`),
  getFollowers: (principal: string)            => api<any>(`/profiles/${principal}/followers`),
  getFollowing: (principal: string)            => api<any>(`/profiles/${principal}/following`),
  follow      : (principal: string, token: string) => api<any>(`/actions/follow/${principal}`, { method: 'POST', token }),
  unfollow    : (principal: string, token: string) => api<any>(`/actions/unfollow/${principal}`, { method: 'POST', token }),
  likePost    : (postId: number, token: string)    => api<any>(`/actions/like/${postId}`, { method: 'POST', token }),
  flagPost    : (postId: number, reason: string, token: string) =>
    api<any>(`/actions/flag/${postId}`, { method: 'POST', body: JSON.stringify({ reason }), token }),
  creatorStats: (principal: string)            => api<any>(`/creator/stats/${principal}`),
  myTrack     : (token: string)               => api<any>('/pipeline/my-track', { token }),
  allTracks   : ()                            => api<any>('/pipeline/tracks'),
  enroll      : (trackId: string, token: string) => api<any>('/pipeline/enroll', { method: 'POST', body: JSON.stringify({ trackId }), token }),
}
