#!/usr/bin/env bash
set -euo pipefail

cd "${containerWorkspaceFolder:-/workspaces/root}"

sudo mkdir -p "${PNPM_STORE_PATH:-/home/node/.local/share/pnpm/store}" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"
sudo chown -R "${USER:-node}:${USER:-node}" "${PNPM_STORE_PATH:-/home/node/.local/share/pnpm/store}" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"

corepack enable
corepack prepare pnpm@10.6.0 --activate
pnpm config set store-dir "${PNPM_STORE_PATH:-/home/node/.local/share/pnpm/store}"

pnpm install --frozen-lockfile

# Build the extension and its framework dependencies so the editor integration,
# dev node, keystore, compiler, and deployment flows are ready after attach.
pnpm --filter cfxdevkit-vscode-extension... build
.devcontainer/scripts/install-vscode-extension.sh --build

pnpm exec moon --version >/dev/null
pnpm exec gitnexus --version >/dev/null || true

mkdir -p .cfxdevkit "$HOME/.cfxdevkit"

cat <<'MSG'

Conflux DevKit devcontainer is ready.

Useful commands:
  pnpm build
  pnpm test
  pnpm lint
  pnpm devnode
  pnpm --filter cfxdevkit-vscode-extension build
  pnpm gitnexus analyze

MSG