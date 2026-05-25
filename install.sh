#!/usr/bin/env bash
set -euo pipefail

# ─── 9RouterS Quick Installer ────────────────────
# Usage: curl -fsSL https://raw.githubusercontent.com/davidduoan89/9routerS/clean-main/install.sh | bash

REPO="https://github.com/davidduoan89/9routerS.git"
BRANCH="clean-main"
DIR="9routerS"
PORT="${PORT:-20128}"

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

# ─── Build ────────────────────────────────────────
info "Building production bundle..."
npm run build 2>&1 | tail -5
ok "Build completed"

# ─── Done ─────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Installation Complete!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Start server:${NC}"
echo -e "    cd $DIR"
echo -e "    PORT=$PORT npm run start"
echo ""
echo -e "  ${CYAN}Or dev mode:${NC}"
echo -e "    cd $DIR"
echo -e "    PORT=$PORT npm run dev -- --webpack"
echo ""
echo -e "  ${CYAN}Dashboard:${NC}  http://localhost:$PORT"
echo -e "  ${CYAN}API:${NC}        http://localhost:$PORT/v1"
echo -e "  ${CYAN}Password:${NC}   123456 (change in Settings)"
echo ""
echo -e "  ${YELLOW}Tip:${NC} Use '--webpack' flag with dev mode for full compatibility."
echo ""
