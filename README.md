<div align="center">

# 9RouterS — Optimized AI Router

**Fork tối ưu của [9Router](https://github.com/decolua/9router) với giao diện WindsurfAPI-inspired, hiệu suất cực nhanh.**

One endpoint for all AI providers · 40+ providers · 100+ models · ~3-17ms API response

</div>

---

## Tổng Quan

**9RouterS** là bản fork tối ưu hiệu suất và giao diện từ 9Router v0.4.59, với các cải tiến:

| Thành phần | Nguyên bản | 9RouterS |
|---|---|---|
| **Giao diện** | Orange accent, provider logos | WindsurfAPI style: indigo accent, text-only cards |
| **Font** | Google Fonts (Inter) — tải từ CDN | System font stack — zero network requests |
| **API Response** | ~50-200ms (cold) | **~3-17ms** (warm, in-memory cache) |
| **Bundle JS** | ~476KB largest chunk | **~332KB** (lazy loading + code splitting) |
| **Modal/Overlay** | Backdrop-blur (GPU heavy) | Simple opacity overlay |
| **Shadows** | Complex multi-layer | Minimal/none |

---

## Tính Năng Chính

- **Smart Router** — Auto fallback: Subscription → Cheap → Free, zero downtime
- **RTK Token Saver** — Auto-compress tool_result, tiết kiệm 20-40% tokens
- **40+ AI Providers** — Claude Code, Cursor, Copilot, Codex, Gemini, DeepSeek, Groq...
- **100+ Models** — Tất cả models từ mọi provider trong 1 endpoint
- **Quota Tracking** — Theo dõi usage, tự chuyển khi hết quota
- **Format Translation** — Tự động convert OpenAI ↔ Claude ↔ Gemini
- **Multi-Account** — Round-robin giữa nhiều account/key
- **MITM Proxy** — Intercept native CLI traffic
- **Combo System** — Nhóm providers thành priority chains
- **Media Providers** — TTS, STT, Image, Embedding, Web Search

---

## Cài Đặt Nhanh

### Cách 1: Script tự động (khuyến nghị)

```bash
# Full (server + UI monolith)
curl -fsSL https://raw.githubusercontent.com/davidduoan89/9routerS/clean-main/install.sh | bash

# Server only (cho VPS/Coolify)
curl -fsSL https://raw.githubusercontent.com/davidduoan89/9routerS/clean-main/install.sh | bash -s -- --server

# UI only (cho Vercel local dev)
NEXT_PUBLIC_API_URL=https://your-server.com curl -fsSL .../install.sh | bash -s -- --ui
```

### Cách 2: Thủ công

```bash
# Clone repo
git clone https://github.com/davidduoan89/9routerS.git
cd 9routerS

# Cài dependencies
npm install

# Chạy dev mode
cp .env.example .env
PORT=20128 npm run dev
```

### Cách 3: Docker

```bash
docker run -d \
  --name 9routers \
  -p 20128:20128 \
  -v 9routers-data:/root/.9router \
  --restart unless-stopped \
  $(docker build -q https://github.com/davidduoan89/9routerS.git#clean-main)
```

### Cách 4: Production mode

```bash
git clone https://github.com/davidduoan89/9routerS.git
cd 9routerS
npm install
npm run build
PORT=20128 HOSTNAME=0.0.0.0 npm run start
```

### Cách 5: Split Deployment — Server (Coolify/DigitalOcean) + UI (Vercel)

Tách server API và dashboard UI thành 2 service riêng biệt:

```
┌─────────────────────────┐      ┌──────────────────────────┐
│   Server (DigitalOcean)  │      │      UI (Vercel)         │
│   Coolify / Docker       │      │      Free hosting        │
│                          │      │                          │
│   /v1/*  LLM proxy       │◄─────│  Dashboard pages         │
│   /api/* management      │      │  fetch() proxied qua     │
│   open-sse engine        │      │  Vercel rewrites         │
│   SQLite DB              │      │  CDN edge delivery       │
│   MITM proxy             │      │                          │
│   ~80MB RAM              │      │  $0/month                │
└─────────────────────────┘      └──────────────────────────┘
```

#### 5a. Server — DigitalOcean + Coolify (Docker)

```bash
# Build image
docker build -f Dockerfile.server -t 9routers-server .

# Run server
docker run -d \
  --name 9routers-server \
  -p 20128:20128 \
  -e ALLOWED_ORIGINS="https://your-ui.vercel.app" \
  -e AUTH_COOKIE_SECURE=true \
  -v 9routers-data:/app/data \
  --restart unless-stopped \
  9routers-server
```

Hoặc **không dùng Docker** (trực tiếp trên VPS):

```bash
# Clone + install
git clone -b clean-main https://github.com/davidduoan89/9routerS.git
cd 9routerS && npm install

# Build + run server
npm run build
ALLOWED_ORIGINS="https://your-ui.vercel.app" PORT=20128 npm run start
```

**Environment variables cho Server:**

| Biến | Giá trị | Mô tả |
|---|---|---|
| `PORT` | `20128` | Port API server |
| `ALLOWED_ORIGINS` | `https://your-ui.vercel.app` | Cho phép UI cross-origin (phân cách bằng dấu `,`) |
| `AUTH_COOKIE_SECURE` | `true` | Bắt buộc khi dùng HTTPS |
| `DATA_DIR` | `/app/data` | Thư mục lưu SQLite + config |

#### 5b. UI — Vercel (Free)

**Cách 1: Deploy trực tiếp từ GitHub**

1. Vào [vercel.com](https://vercel.com) → New Project → Import `davidduoan89/9routerS`
2. Trong **Environment Variables**, thêm:
   - `API_URL` = `https://your-server.example.com` (chỉ server-side, cho rewrites proxy)
3. Click **Deploy** — Vercel tự detect Next.js và build

**Cách 2: Local dev (UI tách biệt)**

```bash
git clone -b clean-main https://github.com/davidduoan89/9routerS.git
cd 9routerS && npm install

# Đổi config sang UI mode
cp next.config.ui.mjs next.config.mjs

# Chạy UI dev với API trỏ đến server
API_URL=https://your-server.com npx next dev -p 3000 --webpack
```

**Cách hoạt động:**
- `next.config.ui.mjs` chứa rewrites rule: `/api/*` → `${API_URL}/api/*`
- Browser gọi `/api/providers` → Vercel/Next.js proxy đến server → trả kết quả
- Không cần CORS (same-origin từ góc browser)
- Cookie auth hoạt động bình thường qua proxy

**Environment variables cho UI:**

| Biến | Mô tả |
|---|---|
| `API_URL` | URL server API (server-side only, dùng cho rewrites proxy). **Khuyến nghị** |
| `NEXT_PUBLIC_API_URL` | Giống API_URL nhưng exposed ra client JS. Chỉ cần khi muốn browser gọi thẳng server (cần CORS) |

> **Backward compatible**: Nếu không set `NEXT_PUBLIC_API_URL`, app chạy như monolith bình thường.

---

## Sử Dụng

### 1. Mở Dashboard

Sau khi chạy, mở trình duyệt:

```
http://localhost:20128
```

Password mặc định: `123456` (đổi trong Settings)

### 2. Kết nối Provider

**Free (không cần đăng ký):**
- Dashboard → Providers → **OpenCode Free** → Ready ngay (no auth)
- Dashboard → Providers → **Kiro AI** → Đăng nhập OAuth

**API Key:**
- Dashboard → Providers → chọn provider (DeepSeek, Groq, Anthropic...) → nhập API key

**OAuth (Subscription):**
- Dashboard → Providers → Claude Code / Cursor / Copilot → Đăng nhập OAuth

### 3. Sử dụng trong CLI tools

Cấu hình trong Claude Code, Codex, Cursor, Cline, hoặc bất kỳ tool nào:

```
Endpoint:  http://localhost:20128/v1
API Key:   [copy từ Dashboard → Endpoint]
Model:     kr/claude-sonnet-4.5  (hoặc bất kỳ model nào)
```

### 4. Combo (Auto-fallback)

Dashboard → Combos → Tạo combo ví dụ:

```
Subscription: claude (Claude Code OAuth)
     ↓ hết quota
Cheap: deepseek (DeepSeek API, ~$0.14/1M tokens)
     ↓ hết budget
Free: opencode (OpenCode Free, miễn phí)
```

Dùng combo name làm model: `combo/my-combo`

---

## Cấu Trúc Dự Án

```
9routerS/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Dashboard pages (18+ pages)
│   │   ├── login/              # Login page
│   │   ├── globals.css         # Design system (WindsurfAPI palette)
│   │   └── layout.js           # Root layout (system fonts)
│   ├── shared/
│   │   ├── components/         # 22+ shared UI components
│   │   ├── constants/          # Providers, models, config
│   │   ├── hooks/              # React hooks
│   │   └── utils/              # Utilities
│   ├── lib/
│   │   ├── db/                 # SQLite database + cached repos
│   │   ├── proxy/              # AI proxy pipeline
│   │   ├── oauth/              # OAuth flows
│   │   └── translator/         # Format translators
│   └── store/                  # Zustand stores
├── cli/                        # CLI tool + system tray
├── open-sse/                   # SSE proxy server
├── docs/                       # Architecture docs
└── install.sh                  # Quick install script
```

---

## Tối Ưu Hiệu Suất (Chi Tiết)

### Server-side Caching

| Cache | TTL | Mục đích |
|---|---|---|
| `getSettings()` | 2s | Giảm 3 DB reads/request |
| `validateApiKey()` | 5s | Bỏ DB hit mỗi API call |
| `getProviderConnections()` | 3s | Cache credentials |
| `getProviderNodes()` | 5s | Bỏ 3 queries/request cho model resolution |
| `getComboByName()` | 5s | Cache model aliases, combos |
| KV Store | 5s | Generic key-value cache |

Tất cả cache **tự invalidate khi write** (create/update/delete) — không lo stale data.

### Client-side Optimization

- **Lazy loading**: Modals (OAuth, ModelSelect), Charts (recharts), Flow diagrams (@xyflow)
- **Code splitting**: React.lazy + Suspense cho heavy components
- **React.memo**: ProviderCard (40+ instances), performance-critical components
- **No Google Fonts**: System font stack = zero font network requests
- **No backdrop-blur**: Simple opacity overlay cho modals/drawers
- **Gzip compression**: Enabled trong next.config.mjs

---

## Design System

### Colors (Dark Mode — WindsurfAPI palette)

```css
--bg:        #09090b    /* Background */
--surface:   #111114    /* Card background */
--surface-2: #17171c    /* Input background */
--surface-3: #1c1c22    /* Active state */
--border:    #26262e    /* Borders */
--accent:    #6366f1    /* Indigo primary */
--text:      #f4f4f5    /* Primary text */
--text-muted: #a1a1aa   /* Secondary text */
--success:   #22c55e    /* Status green */
--danger:    #ef4444    /* Status red */
```

### Typography

```css
/* System font — zero loading time */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
  'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
  system-ui, sans-serif;

/* Monospace */
font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code',
  'Consolas', monospace;
```

---

## API Endpoints

### Proxy (OpenAI-compatible)

```
POST /v1/chat/completions     # Chat completions
POST /v1/responses            # OpenAI Responses API
POST /v1/embeddings           # Embeddings
POST /v1/images/generations   # Image generation
POST /v1/audio/speech         # Text-to-speech
POST /v1/audio/transcriptions # Speech-to-text
GET  /v1/models               # List available models
```

### Management API

```
GET  /api/settings             # Server settings
GET  /api/providers            # List providers + status
GET  /api/providers/:id        # Provider details
GET  /api/models               # All available models
GET  /api/keys                 # API keys
GET  /api/combos               # Combos list
GET  /api/usage                # Usage statistics
```

---

## Environment Variables

| Variable | Default | Mô tả |
|---|---|---|
| `PORT` | `20128` | Server port |
| `HOSTNAME` | `localhost` | Bind address |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:20128` | Public URL |
| `PASSWORD` | `123456` | Dashboard password |
| `DB_PATH` | `~/.9router/db/data.sqlite` | Database path |
| `LOG_LEVEL` | `info` | Log level |

Xem `.env.example` để biết đầy đủ.

---

## Yêu Cầu Hệ Thống

- **Node.js** >= 18.17
- **npm** >= 9
- **RAM** >= 512MB
- **Disk** >= 200MB
- Hỗ trợ: Linux, macOS, Windows

---

## Credits

- Dựa trên [9Router](https://github.com/decolua/9router) by [decolua](https://github.com/decolua)
- Thiết kế lấy cảm hứng từ [WindsurfAPI](https://github.com/dwgx/WindsurfAPI)
- License: [ISC](./LICENSE)

---

<div align="center">

**9RouterS** — Lightweight · Fast · Beautiful

</div>
