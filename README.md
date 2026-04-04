# ⬡ SynapZ Social — Sovereign Social Network Platform

> **InfluWealth Quantum Labs** | WealthBridge OS | SAP v1.0 | ICP-Native
>
> *The sovereign social layer. Creator economy. Community pipelines. Zero extraction.*

---

## What Is SynapZ Social?

SynapZ Social is the **community + creator platform** in the WealthBridge OS ecosystem. It is separate from SynapZ-Core (the intelligence engine) — SynapZ Social is the platform where people actually live: posting, building audiences, enrolling in sovereign financial tracks, and earning through the creator economy.

**This repo is NOT the intelligence engine.** That lives in [github.com/Influwealth/synapz](https://github.com/Influwealth/synapz).

| Layer | Repo | Role |
|-------|------|------|
| Intelligence | `synapz` | Feed ranking, moderation, recommendations, NIM |
| Platform | `synapz-social` | Social graph, posts, creator economy, pipelines |
| Funnel | Wix | Landing pages, onboarding, SEO, marketing |

**Primary communities:** East Flatbush (NYC) · Greenville NC (G5) · Baltimore MD · Senegal/Africa (2027)

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                   SYNAPZ-SOCIAL STACK                           │
├──────────────────────┬─────────────────────────────────────────┤
│  WEB CLIENT          │  API SERVER (Node/TS)                   │
│  React + Vite :5174  │  Express :4001                          │
│  ─────────────       │  ── Routes ──────────────────────────   │
│  HomeFeed            │  /api/v1/posts    → ICP content_feed    │
│  CreatorProfile      │  /api/v1/profiles → ICP social_graph    │
│  PostDetail          │  /api/v1/feed     → ICP + SynapZ-Core   │
│  MyPipeline          │  /api/v1/actions  → ICP (like/follow)   │
│  AdminConsole        │  /api/v1/creator  → ICP creator_economy │
│                      │  /api/v1/pipeline → Sovereign tracks     │
├──────────────────────┴─────────────────────────────────────────┤
│                   ICP CANISTERS (Motoko)                         │
│  social_graph     → profiles, follows, blocks, roles           │
│  content_feed     → posts, comments, threads, tags             │
│  creator_economy  → tiers, metrics, payouts, Qudit scores      │
│  moderation       → flags, decisions, Qubit results            │
│  media_registry   → URIs, hashes, ownership (IPFS/Arweave)    │
├─────────────────────────────────────────────────────────────────┤
│                   SYNAPZ-CORE INTEGRATION                        │
│  synapzClient.ts calls synapz repo (/api/v1/agents):           │
│  rankFeed()        → Qudit (feed-rank)                         │
│  moderateContent() → Qubit (content-policy)                    │
│  recommendCreators()→ Meta-Unit (agent-invocation)             │
│  summarizeContent()→ NIM (compliance lane)                     │
│  scoreCreator()    → Qudit (agent-trust)                       │
├─────────────────────────────────────────────────────────────────┤
│  Wix (funnel only) | Grafana (mission control) | SAP v1.0      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ICP Canisters

### social_graph
Sovereign identity and social graph. All profiles, follows, blocks, and role assignments live here.

**Methods:** `create_profile` · `update_profile` · `get_profile` · `follow` · `unfollow` · `get_followers` · `get_following` · `block_user`

**Roles:** `#Member` · `#Creator` · `#Youth` · `#Business` · `#Admin`

### content_feed
All posts, comments, and threads. Feed assembly returns candidates — ranking is handled by SynapZ-Core Qudit.

**Methods:** `create_post` · `get_post` · `list_posts_by_author` · `list_feed_for_user` · `hide_post` · `like_post`

**Post types:** `#Short` · `#Long` · `#VideoRef` · `#Repost`

### creator_economy
Creator tiers, engagement metrics, payout ledger, and Qudit scores (set by SynapZ-Core).

**Methods:** `set_creator_tier` · `get_creator_tier` · `record_engagement` · `get_creator_stats` · `set_qudit_score` · `record_payout`

**Tiers:** `#Free` · `#Rising` · `#Pro` · `#Sovereign`

### moderation
Stores all flags, reports, and moderation decisions from SynapZ-Core Qubit evaluations.

**Methods:** `submit_flag` · `record_moderation_decision` · `get_moderation_state` · `list_flagged_posts`

**Decisions:** `#Allow` · `#SoftBlock` · `#HardBlock` · `#Review`

### media_registry
Sovereign proof-of-ownership registry for media stored off-chain (IPFS / Arweave / CDN). Deduplicated by content hash.

**Methods:** `register_media` · `get_media` · `list_media_by_owner` · `get_by_hash`

---

## SynapZ-Core Integration

SynapZ-Social never runs AI inference directly. It delegates all intelligence operations to [SynapZ-Core](https://github.com/Influwealth/synapz) via `synapzClient.ts`:

```
Feed Request Flow:
  1. content_feed.list_feed_for_user() → candidate posts from ICP
  2. synapzClient.rankFeed()           → SynapZ-Core /agents/qudit/qudit-feed-rank
  3. Qudit scores returned (0–1000)    → posts sorted by sovereign rank
  4. Ranked feed returned to web/Wix

Moderation Flow:
  1. User creates post
  2. synapzClient.moderateContent()   → SynapZ-Core /agents/qubit/qubit-content-policy
  3. Qubit returns: allow | soft-block | hard-block
  4. Decision stored in moderation canister
  5. If blocked → post hidden before ICP write
```

---

## Sovereign Pipeline Tracks

SynapZ-Social includes built-in community learning tracks aligned with WealthBridge OS nodes:

| Track | Community | Capsule |
|-------|-----------|---------|
| Youth Financial Literacy | East Flatbush, Greenville, Baltimore | `cap-youth-financial` |
| Sovereign Business Builder | G5 Formation, Marisany LLC | `cap-wealthbridge-genesis` |
| Creator Economy Track | All nodes | `cap-synapz-feed` |
| Diaspora Wealth Bridge | Senegal/Africa | `cap-wealthbridge-genesis` |

---

## Wix Integration

Wix is the **public funnel only** — not the app.

Wix calls `synapz-social/apps/api` via Velo (Wix backend JS) for:
- Creator onboarding: `POST /profiles/create`
- Youth/business pipeline signup: `POST /pipeline/enroll`
- Public profile display: `GET /profiles/:principal`
- Public feed embed: `GET /feed/explore`

Wix **never** calls SynapZ-Core directly. All intelligence routes through the social API.

---

## Quick Start

### Prerequisites
- Node.js 20+
- DFX (DFINITY SDK): `sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"`
- Docker + Docker Compose

### 1. Clone & Install
```bash
git clone https://github.com/Influwealth/synapz-social.git
cd synapz-social
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Set JWT_SECRET to match synapz-core .env
# Set SYNAPZ_CORE_URL to synapz-core API URL
```

### 3. Deploy ICP Canisters (Local)
```bash
cd icp
./scripts/deploy_local.sh
# Copy canister IDs from output into .env CANISTER_ID_* vars
```

### 4. Run API + Web
```bash
npm run dev:api   # API on :4001
npm run dev:web   # Web on :5174
```

### 5. Production (ICP Mainnet)
```bash
cd icp
./scripts/deploy_mainnet.sh
# Update .env ICP_NETWORK=ic + CANISTER_IDs
docker-compose -f infrastructure/docker-compose.yml up -d
```

---

## API Reference

### Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/posts/create` | ✅ | Create post (moderation gate) |
| GET | `/api/v1/posts/:id` | None | Get post |
| GET | `/api/v1/posts/author/:principal` | None | Author's posts |

### Profiles
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/profiles/:principal` | None | Get profile |
| POST | `/api/v1/profiles/create` | ✅ | Create profile |
| PUT | `/api/v1/profiles/update` | ✅ | Update profile |
| GET | `/api/v1/profiles/:principal/followers` | None | Followers |
| GET | `/api/v1/profiles/:principal/following` | None | Following |

### Feed
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/feed` | Optional | Ranked feed (SynapZ-Core Qudit) |
| GET | `/api/v1/feed/explore` | None | Public explore feed |

### Actions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/actions/like/:postId` | ✅ | Like post |
| POST | `/api/v1/actions/follow/:principal` | ✅ | Follow user |
| POST | `/api/v1/actions/unfollow/:principal` | ✅ | Unfollow |
| POST | `/api/v1/actions/block/:principal` | ✅ | Block user |
| POST | `/api/v1/actions/flag/:postId` | ✅ | Flag content |

### Creator
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/creator/set-tier` | ✅ | Set creator tier |
| GET | `/api/v1/creator/stats/:principal` | None | Creator stats + Qudit score |
| POST | `/api/v1/creator/record-engagement` | Admin | Record engagement |
| GET | `/api/v1/creator/recommendations` | ✅ | Recommended creators |

### Pipeline
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/pipeline/tracks` | None | All tracks |
| GET | `/api/v1/pipeline/my-track` | ✅ | Current enrollment |
| POST | `/api/v1/pipeline/enroll` | ✅ | Enroll in track |
| GET | `/api/v1/pipeline/tracks/:id/progress` | ✅ | Track progress |

---

## File Structure

```
synapz-social/
├── .env.example
├── .gitignore
├── package.json                     ← root monorepo
│
├── icp/
│   ├── dfx.json                     ← canister config
│   ├── canisters/
│   │   ├── social_graph/src/social_graph.mo
│   │   ├── content_feed/src/content_feed.mo
│   │   ├── creator_economy/src/creator_economy.mo
│   │   ├── moderation/src/moderation.mo
│   │   └── media_registry/src/media_registry.mo
│   └── scripts/
│       ├── deploy_local.sh
│       └── deploy_mainnet.sh
│
├── apps/
│   ├── api/
│   │   ├── package.json + tsconfig.json
│   │   └── src/
│   │       ├── index.ts             ← Express entry + SAP trace
│   │       ├── routes/              ← posts, profiles, feed, actions, creator, pipeline
│   │       ├── services/            ← icpClient, synapzClient, auth
│   │       └── middleware/          ← authGuard, rateLimit
│   └── web/
│       ├── index.html + package.json + vite.config.ts
│       └── src/
│           ├── App.tsx              ← HomeFeed, CreatorProfile, PostDetail, MyPipeline, AdminConsole
│           ├── main.tsx
│           └── lib/apiClient.ts
│
└── infrastructure/
    ├── docker-compose.yml
    ├── github-actions.yml
    └── grafana/datasources.yml
```

---

## Community Nodes

| Node | Location | Status |
|------|---------|--------|
| East Flatbush | Brooklyn, NY (E. 94th / E. 95th) | Active |
| Greenville (G5) | Pitt County, NC | Activating |
| Baltimore | MD (Marisany LLC) | Pending contact |
| Senegal | West Africa | 2027 (Diaspora Wealth Bridge) |

---

## Related Repos

- **SynapZ-Core (Intelligence Engine):** [github.com/Influwealth/synapz](https://github.com/Influwealth/synapz)
- **NVQ Mesh Fabric:** [github.com/Influwealth/nvq-mesh-fabric](https://github.com/Influwealth/nvq-mesh-fabric)
- **Sovereign Stack:** [github.com/Influwealth/sovereign-stack](https://github.com/Influwealth/sovereign-stack)

---

*InfluWealth Quantum Labs · WealthBridge OS · SAP v1.0 · ICP-Native*
*Sovereign Social. Creator Economy. Community Pipelines. Architecture as Infinite Collateral.*
