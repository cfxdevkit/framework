#!/usr/bin/env bash
set -euo pipefail

if [[ -S /var/run/docker.sock ]]; then
  socket_gid="$(stat -c '%g' /var/run/docker.sock 2>/dev/null || true)"
  if [[ -n "$socket_gid" ]]; then
    sudo groupmod -o -g "$socket_gid" docker 2>/dev/null || true
    sudo usermod -aG docker "${USER:-node}" 2>/dev/null || true
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
  fi
  export DOCKER_HOST="${DOCKER_HOST:-unix:///var/run/docker.sock}"
fi

if [[ "${PNPM_HOME:-}" == /usr/local/* ]]; then
  export PNPM_HOME="$HOME/.local/share/pnpm"
else
  export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
fi
export PNPM_STORE_PATH="${PNPM_STORE_PATH:-$HOME/.local/share/pnpm/store}"
export PATH="$PNPM_HOME:$PATH"

sudo mkdir -p "$PNPM_HOME" "$PNPM_STORE_PATH" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"
sudo chown -R "${USER:-node}:${USER:-node}" "$PNPM_HOME" "$PNPM_STORE_PATH" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"

mkdir -p "$HOME/.cfxdevkit" "${containerWorkspaceFolder:-/workspaces/root}/.cfxdevkit"

cd "${containerWorkspaceFolder:-/workspaces/root}"
.devcontainer/scripts/ensure-gitnexus.sh || true
.devcontainer/scripts/check-lemonade.sh || true
.devcontainer/scripts/install-vscode-extension.sh
.devcontainer/scripts/install-cdk.sh

# Start Headroom compression proxy (if installed)
if command -v headroom &>/dev/null; then
  .devcontainer/scripts/start-headroom.sh || echo "⚠ Headroom proxy failed to start (may need container rebuild)"
fi
