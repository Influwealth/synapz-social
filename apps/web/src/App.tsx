/**
 * SynapZ Social — Web App
 * ─────────────────────────────────────────────────────────────
 * InfluWealth Quantum Labs | WealthBridge OS | SAP v1.0
 * ICP-native sovereign social platform
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, createContext, useContext } from 'react'
import { socialApi } from './lib/apiClient'

// ── Types ──────────────────────────────────────────────────────
type Page = 'feed' | 'explore' | 'profile' | 'post' | 'pipeline' | 'admin' | 'login'
type Auth  = { token: string; sovereignId: string; role: string; userId: number } | null

// ── Auth Context ───────────────────────────────────────────────
const AuthCtx = createContext<{ auth: Auth; setAuth: (a: Auth) => void }>({ auth: null, setAuth: () => {} })
const useAuth = () => useContext(AuthCtx)

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg      : '#08090f',
  surface1: '#0f1117',
  surface2: '#161a24',
  border  : '#1e2433',
  gold    : '#f0c14b',
  teal    : '#2dd4bf',
  violet  : '#7c3aed',
  text    : '#e8eaf0',
  sub     : '#8892a4',
  err     : '#f87171',
  green   : '#34d399',
}
const font = "'Space Grotesk', system-ui, sans-serif"
const mono = "'DM Mono', monospace"

const s: Record<string, React.CSSProperties> = {
  root   : { minHeight:'100vh', background:C.bg, color:C.text, fontFamily:font, display:'flex', flexDirection:'column' },
  header : { background:C.surface1, borderBottom:`1px solid ${C.border}`, padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky' as any, top:0, zIndex:100 },
  logo   : { display:'flex', alignItems:'center', gap:8 },
  logoHex: { fontSize:20, color:C.gold },
  logoTxt: { fontSize:17, fontWeight:700, letterSpacing:'.04em' },
  logoSub: { fontSize:10, color:C.sub, marginLeft:4, letterSpacing:'.1em', textTransform:'uppercase' as any },
  nav    : { display:'flex', gap:6, alignItems:'center' },
  navBtn : { background:'transparent', border:`1px solid ${C.border}`, color:C.text, padding:'5px 12px', borderRadius:6, cursor:'pointer', fontSize:12, fontFamily:font },
  navAct : { background:C.violet, borderColor:C.violet, color:'#fff' },
  sapBar : { background:'#060810', borderBottom:`1px solid ${C.border}`, padding:'3px 24px', fontSize:10, color:C.sub, display:'flex', gap:12, fontFamily:mono },
  main   : { flex:1, maxWidth:700, width:'100%', margin:'0 auto', padding:'20px 16px' },
  card   : { background:C.surface1, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:12 },
  postMeta: { display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' as any },
  sId    : { fontSize:10, color:C.teal, background:`${C.teal}18`, padding:'2px 8px', borderRadius:10, fontFamily:mono },
  tag    : { fontSize:10, color:C.sub, background:C.border, padding:'2px 8px', borderRadius:10 },
  time   : { fontSize:10, color:C.sub, marginLeft:'auto' },
  content: { margin:0, fontSize:14, lineHeight:1.7 },
  actions: { display:'flex', gap:8, marginTop:10 },
  actBtn : { background:'transparent', border:`1px solid ${C.border}`, color:C.sub, padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:11, fontFamily:font },
  input  : { background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 14px', color:C.text, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' as any, fontFamily:font },
  textarea: { background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 14px', color:C.text, fontSize:13, resize:'none' as any, outline:'none', width:'100%', boxSizing:'border-box' as any, fontFamily:font },
  btn    : { background:C.violet, color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:font },
  btnGold: { background:C.gold, color:'#000', border:'none', borderRadius:8, padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:font },
  section: { marginBottom:20 },
  h2     : { fontSize:16, fontWeight:600, marginBottom:12, color:C.gold },
  badge  : { fontSize:10, padding:'2px 8px', borderRadius:10, border:`1px solid ${C.violet}44`, background:`${C.violet}18`, color:C.teal, fontFamily:mono },
  track  : { background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:10, cursor:'pointer' as any },
  footer : { background:C.surface1, borderTop:`1px solid ${C.border}`, padding:'10px 24px', fontSize:10, color:C.sub, display:'flex', gap:12, justifyContent:'center', fontFamily:mono },
}

// ── Shared Components ──────────────────────────────────────────
function PostCard({ post, token }: { post: any; token?: string | null }) {
  const [liked, setLiked] = useState(false)
  async function like() {
    if (!token || liked) return
    await socialApi.likePost(post.id, token)
    setLiked(true)
  }
  return (
    <div style={s.card}>
      <div style={s.postMeta}>
        <span style={s.sId}>⬡ {String(post.sovereignId || post.author || 'anon').slice(0, 18)}</span>
        {post.capsuleTag?.[0] && <span style={s.tag}>📦 {post.capsuleTag[0]}</span>}
        {post._rankScore && <span style={s.tag}>⬡ rank:{post._rankScore}</span>}
        <span style={s.time}>{post.createdAt ? new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString() : ''}</span>
      </div>
      <p style={s.content}>{post.content}</p>
      <div style={s.actions}>
        <button style={{ ...s.actBtn, ...(liked ? { color: C.gold, borderColor: C.gold } : {}) }} onClick={like}>
          ♡ {(post.likes || 0) + (liked ? 1 : 0)}
        </button>
        <button style={s.actBtn}>💬 Reply</button>
        <button style={s.actBtn}>↗ Share</button>
      </div>
    </div>
  )
}

function ComposeBox({ token, onPost }: { token: string; onPost: () => void }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit() {
    if (!content.trim()) return
    setLoading(true)
    try { await socialApi.createPost({ content, postType: 'Short', tags: [], capsuleTag: null }, token) }
    finally { setLoading(false); setContent(''); onPost() }
  }
  return (
    <div style={{ ...s.card, marginBottom:16 }}>
      <textarea style={s.textarea} rows={3} placeholder="Speak to the sovereign network…" value={content} onChange={e => setContent(e.target.value)} />
      <button style={{ ...s.btn, marginTop:8, opacity: loading ? .6 : 1 }} onClick={submit} disabled={loading || !content.trim()}>
        {loading ? 'Broadcasting…' : 'Broadcast'}
      </button>
    </div>
  )
}

// ── Pages ──────────────────────────────────────────────────────
function HomeFeed() {
  const { auth } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [cursor, setCursor] = useState(0)
  const [loading, setLoading] = useState(false)

  async function load(reset = false) {
    setLoading(true)
    const cur = reset ? 0 : cursor
    const data = await (auth?.token ? socialApi.feed(cur, auth.token) : socialApi.explore(cur)).catch(() => ({ posts: [] })) as any
    setPosts(prev => reset ? (data.posts || []) : [...prev, ...(data.posts || [])])
    setCursor((data.cursor || cur) + 20)
    setLoading(false)
  }

  useEffect(() => { load(true) }, [auth?.token])

  return (
    <div>
      {auth?.token && <ComposeBox token={auth.token} onPost={() => load(true)} />}
      {posts.map((p, i) => <PostCard key={p.id || i} post={p} token={auth?.token} />)}
      {posts.length === 0 && !loading && <p style={{ color: C.sub, textAlign: 'center' }}>No posts yet. Be the first to broadcast.</p>}
      <button style={{ ...s.navBtn, width: '100%', marginTop: 8 }} onClick={() => load()} disabled={loading}>
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  )
}

function CreatorProfile({ principal }: { principal?: string }) {
  const { auth } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const p = principal || auth?.sovereignId || ''

  useEffect(() => {
    if (!p) return
    socialApi.getProfile(p).then(setProfile).catch(() => null)
    socialApi.creatorStats(p).then(setStats).catch(() => null)
  }, [p])

  if (!p) return <p style={{ color: C.sub }}>No profile selected.</p>

  return (
    <div>
      <div style={s.card}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⬡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{profile?.displayName || 'Sovereign User'}</div>
            <div style={{ color: C.sub, fontSize: 12, fontFamily: mono }}>@{profile?.handle || p.slice(0, 16)}</div>
          </div>
          <span style={{ ...s.badge, marginLeft: 'auto' }}>{profile?.role ? Object.keys(profile.role)[0] : 'Member'}</span>
        </div>
        <p style={{ ...s.content, color: C.sub }}>{profile?.bio || 'No bio yet.'}</p>
        {stats?.quditScore && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: C.surface2, borderRadius: 8, fontSize: 11, fontFamily: mono }}>
            Qudit Score: {stats.quditScore.score} · {stats.quditScore.label}
          </div>
        )}
      </div>
    </div>
  )
}

function PostDetail({ postId }: { postId?: number }) {
  const { auth } = useAuth()
  const [post, setPost] = useState<any>(null)
  useEffect(() => {
    if (postId) socialApi.getPost(postId).then(setPost).catch(() => null)
  }, [postId])
  if (!postId) return <p style={{ color: C.sub }}>Select a post to view.</p>
  if (!post) return <p style={{ color: C.sub }}>Loading…</p>
  return <PostCard post={post} token={auth?.token} />
}

function MyPipeline() {
  const { auth } = useAuth()
  const [trackInfo, setTrackInfo] = useState<any>(null)
  const [allTracks, setAllTracks] = useState<any[]>([])

  useEffect(() => {
    socialApi.allTracks().then((d: any) => setAllTracks(d.tracks || [])).catch(() => null)
    if (auth?.token) socialApi.myTrack(auth.token).then(setTrackInfo).catch(() => null)
  }, [auth?.token])

  async function enroll(trackId: string) {
    if (!auth?.token) return
    const res = await socialApi.enroll(trackId, auth.token).catch(() => null) as any
    if (res) setTrackInfo(res)
  }

  return (
    <div>
      {trackInfo?.enrolled ? (
        <div style={s.card}>
          <h3 style={{ ...s.h2, marginBottom: 4 }}>{trackInfo.track?.name}</h3>
          <p style={{ color: C.sub, fontSize: 13, marginBottom: 12 }}>{trackInfo.intro || trackInfo.track?.description}</p>
          <div style={{ background: C.surface2, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ background: C.violet, height: 4, width: `${Math.round((trackInfo.stage / (trackInfo.track?.stages?.length || 1)) * 100)}%`, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 12, color: C.sub, fontFamily: mono }}>
            Stage {trackInfo.stage + 1}/{trackInfo.track?.stages?.length}: <span style={{ color: C.gold }}>{trackInfo.stageName}</span>
          </div>
        </div>
      ) : (
        <p style={{ color: C.sub, marginBottom: 16 }}>You are not enrolled in a track yet. Choose one below.</p>
      )}

      <h3 style={s.h2}>Available Tracks</h3>
      {allTracks.map(t => (
        <div key={t.id} style={s.track} onClick={() => enroll(t.id)}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>{t.description}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as any }}>
            {t.community.map((c: string) => <span key={c} style={{ ...s.tag, fontSize: 10 }}>{c}</span>)}
          </div>
          {t.launchDate && <div style={{ fontSize: 10, color: C.gold, marginTop: 6 }}>🚀 Launching {t.launchDate}</div>}
        </div>
      ))}
    </div>
  )
}

function AdminConsole() {
  const { auth } = useAuth()
  if (!auth || !['admin', 'sovereign'].includes(auth.role)) {
    return <div style={s.card}><p style={{ color: C.err }}>⚠ Admin access required.</p></div>
  }
  return (
    <div>
      <div style={s.card}>
        <h3 style={s.h2}>Mission Control</h3>
        <p style={{ color: C.sub, fontSize: 13 }}>Moderation queue, AGI logs, and node status are available via the Grafana dashboard.</p>
        <a href="http://localhost:3001" target="_blank" rel="noreferrer"
           style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', background: C.teal, color: '#000', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          Open Grafana →
        </a>
      </div>
      <div style={s.card}>
        <h3 style={s.h2}>Node Status</h3>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.sub, lineHeight: 2 }}>
          <div>⬡ synapz-social-api <span style={{ color: C.green }}>● online</span></div>
          <div>⬡ synapz-core <span style={{ color: C.teal }}>● connected</span></div>
          <div>⬡ ICP canisters <span style={{ color: C.gold }}>● local replica</span></div>
          <div>⬡ NVQ Mesh Fabric <span style={{ color: C.green }}>● active</span></div>
          <div>SAP v1.0 · WealthBridge OS Aligned</div>
        </div>
      </div>
    </div>
  )
}

function LoginPage() {
  const { setAuth } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  async function login() {
    try {
      // Call SynapZ-Core auth (synapz repo handles identity)
      const res = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAuth({ token: data.token, sovereignId: data.sovereignId, role: data.role, userId: data.userId })
      setError('')
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div style={{ ...s.card, maxWidth: 400, margin: '40px auto' }}>
      <h2 style={s.h2}>Enter Sovereign Network</h2>
      {error && <p style={{ color: C.err, fontSize: 12, marginBottom: 8 }}>⚠ {error}</p>}
      <input style={{ ...s.input, marginBottom: 10 }} type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      <input style={{ ...s.input, marginBottom: 12 }} type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
      <button style={s.btn} onClick={login}>Login via SynapZ-Core</button>
      <p style={{ color: C.sub, fontSize: 11, marginTop: 10 }}>Identity managed by SynapZ-Core (sovereign-stack repo).</p>
    </div>
  )
}

// ── Root App ───────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>('feed')
  const [auth, setAuth] = useState<Auth>(null)

  const navItems: { id: Page; label: string }[] = [
    { id: 'feed', label: 'Feed' }, { id: 'explore', label: 'Explore' },
    { id: 'profile', label: 'Profile' }, { id: 'pipeline', label: 'Pipeline' },
    { id: 'admin', label: 'Admin' },
  ]

  return (
    <AuthCtx.Provider value={{ auth, setAuth }}>
      <div style={s.root}>
        <header style={s.header}>
          <div style={s.logo}>
            <span style={s.logoHex}>⬡</span>
            <span style={s.logoTxt}>SynapZ Social</span>
            <span style={s.logoSub}>Sovereign Network</span>
          </div>
          <nav style={s.nav}>
            {navItems.map(n => (
              <button key={n.id} style={{ ...s.navBtn, ...(page === n.id ? s.navAct : {}) }} onClick={() => setPage(n.id)}>
                {n.label}
              </button>
            ))}
            {!auth
              ? <button style={{ ...s.navBtn, borderColor: C.gold, color: C.gold }} onClick={() => setPage('login')}>Login</button>
              : <span style={{ ...s.badge, marginLeft: 4 }}>⬡ {auth.role}</span>
            }
          </nav>
        </header>

        <div style={s.sapBar}>
          <span>SAP v1.0</span><span>·</span>
          <span style={{ color: C.green }}>● Node Online</span><span>·</span>
          <span>ICP Canisters</span><span>·</span>
          <span>WealthBridge OS</span><span>·</span>
          <span>Zero Marginal Cost</span>
        </div>

        <main style={s.main}>
          {page === 'feed'    && <HomeFeed />}
          {page === 'explore' && <HomeFeed />}
          {page === 'profile' && <CreatorProfile />}
          {page === 'pipeline'&& <MyPipeline />}
          {page === 'admin'   && <AdminConsole />}
          {page === 'login'   && <LoginPage />}
        </main>

        <footer style={s.footer}>
          <span>InfluWealth Quantum Labs</span><span>·</span>
          <span>SynapZ Social v1.0</span><span>·</span>
          <span>ICP-Native</span><span>·</span>
          <span>Architecture as Infinite Collateral</span>
        </footer>
      </div>
    </AuthCtx.Provider>
  )
}
