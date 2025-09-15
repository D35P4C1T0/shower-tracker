#!/usr/bin/env bash
set -euo pipefail

echo "[local-ci] Using Node $(node -v) and pnpm $(pnpm -v)"

echo "[local-ci] Installing dependencies"
pnpm install --frozen-lockfile

echo "[local-ci] Installing Playwright browsers"
# Avoid installing OS deps on non-Debian systems
pnpm exec playwright install chromium firefox || true

echo "[local-ci] Running unit tests"
pnpm run test

echo "[local-ci] Running e2e tests (CI mode)"
CI=true pnpm run test:e2e --workers=4

echo "[local-ci] Building for GitHub Pages"
GITHUB_PAGES=true pnpm run build:github

echo "[local-ci] Success. Artifact in ./dist"


