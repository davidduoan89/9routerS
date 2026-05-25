#!/usr/bin/env bash
set -euo pipefail

# ─── 9RouterS Quick Installer ────────────────────
# Usage:
#   Full (server + UI):  curl -fsSL .../install.sh | bash
#   Server only:         curl -fsSL .../install.sh | bash -s -- --server
#   UI only (Vercel):    curl -fsSL .../install.sh | bash -s -- --ui

REPO="https://github.com/davidduoan89/9routerS.git"
BRANCH="clean-main"
DIR="9routerS"
PORT="${PORT:-20128}"
MODE="full"  # full | server | ui

# Parse args
for arg in "$@"; do
  case "$arg" in
    --server) MODE="server" ;;
    --ui)     MODE="ui" ;;
    --full)   MODE="full" ;;
    *)        ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       9RouterS — Quick Installer         ║${NC}"
echo -e "${CYAN}║  Optimized AI Router (WindsurfAPI UI)    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
info "Mode: ${MODE}"
echo ""

# ─── Check Node.js ────────────────────────────────
if ! command -v node &>/dev/null; then
  fail "Node.js not found. Install Node.js >= 18.17 first: https://nodejs.org"
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  fail "Node.js >= 18.17 required (found v$(node -v)). Update: https://nodejs.org"
fi
ok "Node.js $(node -v)"

# ─── Check npm ────────────────────────────────────
if ! command -v npm &>/dev/null; then
  fail "npm not found. Install npm >= 9."
fi
ok "npm $(npm -v)"

# ─── Check git ────────────────────────────────────
if ! command -v git &>/dev/null; then
  fail "git not found. Install git first."
fi
ok "git $(git --version | awk '{print $3}')"

# ─── Clone ────────────────────────────────────────
if [ -d "$DIR" ]; then
  warn "Directory '$DIR' already exists."
  read -p "  Overwrite? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$DIR"
  else
    info "Skipping clone, using existing directory."
  fi
fi

if [ ! -d "$DIR" ]; then
  info "Cloning 9routerS..."
  git clone --depth 1 -b "$BRANCH" "$REPO" "$DIR"
  ok "Cloned successfully"
fi

cd "$DIR"

# ─── Install dependencies ─────────────────────────
info "Installing dependencies (this may take 1-2 minutes)..."
npm install --production=false 2>&1 | tail -3
ok "Dependencies installed"

# ─── Setup env ────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true
  ok "Created .env from template"
fi

# ─── Build based on mode ──────────────────────────
if [ "$MODE" = "ui" ]; then
  # UI-only build — requires API_URL for rewrites proxy
  if [ -z "${API_URL:-}" ]; then
    warn "API_URL not set!"
    echo ""
    read -p "  Enter your 9Router server URL (e.g. https://api.example.com): " INPUT_URL
    export API_URL="$INPUT_URL"
    echo "API_URL=$INPUT_URL" >> .env
    ok "Set API_URL=$INPUT_URL"
  fi
  # Switch to UI config
  info "Switching to UI-only config..."
  cp next.config.mjs next.config.server.mjs
  cp next.config.ui.mjs next.config.mjs
  info "Building UI-only bundle..."
  npm run build 2>&1 | tail -5
  # Restore server config
  mv next.config.server.mjs next.config.mjs
  ok "UI build completed"
else
  # Full or Server build
  info "Building production bundle..."
  npm run build 2>&1 | tail -5
  ok "Build completed"
fi

# ─── Done ─────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Installation Complete!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

if [ "$MODE" = "server" ]; then
  echo -e "  ${CYAN}━━━ Server Mode ━━━${NC}"
  echo ""
  echo -e "  ${CYAN}Start API server:${NC}"
  echo -e "    cd $DIR"
  echo -e "    PORT=$PORT npm run start"
  echo ""
  echo -e "  ${CYAN}API Endpoint:${NC}   http://localhost:$PORT/v1"
  echo -e "  ${CYAN}Health Check:${NC}   http://localhost:$PORT/api/health"
  echo -e "  ${CYAN}Dashboard:${NC}      http://localhost:$PORT (built-in UI)"
  echo ""
  echo -e "  ${YELLOW}Cross-origin UI:${NC}"
  echo -e "    Set ALLOWED_ORIGINS=https://your-ui.vercel.app"
  echo -e "    to allow remote dashboard access."
  echo ""

elif [ "$MODE" = "ui" ]; then
  echo -e "  ${CYAN}━━━ UI Mode ━━━${NC}"
  echo ""
  echo -e "  ${CYAN}Start UI dev:${NC}"
  echo -e "    cd $DIR"
  echo -e "    cp next.config.ui.mjs next.config.mjs"
  echo -e "    API_URL=${API_URL:-https://your-server.com} npx next dev -p 3000 --webpack"
  echo ""
  echo -e "  ${CYAN}Deploy to Vercel:${NC}"
  echo -e "    1. Push to GitHub"
  echo -e "    2. Import repo in Vercel"
  echo -e "    3. Set env: API_URL=https://your-server.com"
  echo -e "    4. Deploy"
  echo ""
  echo -e "  ${CYAN}API Server:${NC}  ${API_URL:-not set}"
  echo ""

else
  echo -e "  ${CYAN}━━━ Full Mode (Server + UI) ━━━${NC}"
  echo ""
  echo -e "  ${CYAN}Start server:${NC}"
  echo -e "    cd $DIR"
  echo -e "    PORT=$PORT npm run start"
  echo ""
  echo -e "  ${CYAN}Or dev mode:${NC}"
  echo -e "    cd $DIR"
  echo -e "    PORT=$PORT npm run dev"
  echo ""
  echo -e "  ${CYAN}Dashboard:${NC}  http://localhost:$PORT"
  echo -e "  ${CYAN}API:${NC}        http://localhost:$PORT/v1"
  echo -e "  ${CYAN}Password:${NC}   123456 (change in Settings)"
  echo ""
fi

echo -e "  ${YELLOW}Tip:${NC} See README.md for detailed deployment guides."
echo ""
