#!/usr/bin/env bash
set -euo pipefail

workspace="${containerWorkspaceFolder:-/workspaces/root}"
cd "$workspace"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not available; skipping GitNexus registration."
  exit 0
fi

if command -v sudo >/dev/null 2>&1; then
  sudo mkdir -p "$HOME/.local/share/gitnexus"
  sudo chown -R "${USER:-node}:${USER:-node}" "$HOME/.local/share/gitnexus"
else
  mkdir -p "$HOME/.local/share/gitnexus"
fi

if [[ -d .gitnexus ]]; then
  pnpm exec gitnexus index . >/dev/null || true
fi

if ! pnpm exec gitnexus list 2>/dev/null | grep -q "Path:    $workspace"; then
  pnpm exec gitnexus analyze >/dev/null || true
  pnpm exec gitnexus index . >/dev/null || true
fi

if pnpm exec gitnexus list 2>/dev/null | grep -q "Path:    $workspace"; then
  echo "GitNexus registered for $workspace"
else
  echo "GitNexus registration unavailable; run 'pnpm exec gitnexus analyze' manually if needed."
fi