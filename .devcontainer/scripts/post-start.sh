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

sudo mkdir -p "${PNPM_STORE_PATH:-/home/node/.local/share/pnpm/store}" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"
sudo chown -R "${USER:-node}:${USER:-node}" "${PNPM_STORE_PATH:-/home/node/.local/share/pnpm/store}" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"

mkdir -p "$HOME/.cfxdevkit" "${containerWorkspaceFolder:-/workspaces/root}/.cfxdevkit"

cd "${containerWorkspaceFolder:-/workspaces/root}"
.devcontainer/scripts/install-vscode-extension.sh