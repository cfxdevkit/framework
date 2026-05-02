#!/usr/bin/env bash
set -euo pipefail

cd "${containerWorkspaceFolder:-/workspaces/root}"

if [[ "${PNPM_HOME:-}" == /usr/local/* ]]; then
  export PNPM_HOME="$HOME/.local/share/pnpm"
else
  export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
fi
export PNPM_STORE_PATH="${PNPM_STORE_PATH:-$HOME/.local/share/pnpm/store}"
export PATH="$PNPM_HOME:$PATH"

sudo mkdir -p "$PNPM_HOME" "$PNPM_STORE_PATH" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"
sudo chown -R "${USER:-node}:${USER:-node}" "$PNPM_HOME" "$PNPM_STORE_PATH" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"

corepack enable
corepack prepare pnpm@10.33.2 --activate
pnpm config set store-dir "$PNPM_STORE_PATH"

pnpm install --frozen-lockfile

# Build the extension and its framework dependencies so the editor integration,
# dev node, keystore, compiler, and deployment flows are ready after attach.
pnpm --filter cfxdevkit-vscode-extension... build
.devcontainer/scripts/install-vscode-extension.sh --build

pnpm exec moon --version >/dev/null
pnpm exec gitnexus --version >/dev/null || true
.devcontainer/scripts/ensure-gitnexus.sh || true

mkdir -p .cfxdevkit "$HOME/.cfxdevkit"

cat <<'MSG'

Conflux DevKit devcontainer is ready.

Useful commands:
  pnpm build
  pnpm test
  pnpm lint
  pnpm devnode
  pnpm --filter cfxdevkit-vscode-extension build
  pnpm exec gitnexus analyze

MSG
