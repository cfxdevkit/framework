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

# Ensure PI (baked into image as root → ~/.npm-global) is on PATH.
export NPM_GLOBAL_PREFIX="${NPM_GLOBAL_PREFIX:-$HOME/.npm-global}"
export PATH="$NPM_GLOBAL_PREFIX/bin:$PATH"

sudo mkdir -p "$PNPM_HOME" "$PNPM_STORE_PATH" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"
sudo chown -R "${USER:-node}:${USER:-node}" "$PNPM_HOME" "$PNPM_STORE_PATH" "$HOME/.cache/moon" "$HOME/.local/share/gitnexus"

mkdir -p "$HOME/.cfxdevkit" "${containerWorkspaceFolder:-/workspaces/root}/.cfxdevkit"

cd "${containerWorkspaceFolder:-/workspaces/root}"
.devcontainer/scripts/ensure-gitnexus.sh || true
.devcontainer/scripts/check-lemonade.sh || true
.devcontainer/scripts/install-vscode-extension.sh
.devcontainer/scripts/install-cdk.sh

# Configure web-search API keys (idempotent — only created if missing)
mkdir -p "$HOME/.pi"
if [[ ! -f "$HOME/.pi/web-search.json" ]]; then
  cat > "$HOME/.pi/web-search.json" <<EOF
{
  "exaApiKey": "${EXA_API_KEY:-}",
  "perplexityApiKey": "${PERPLEXITY_API_KEY:-}",
  "geminiApiKey": "${GEMINI_API_KEY:-}"
}
EOF
fi

# Start Headroom compression proxy (if installed)
if command -v headroom &>/dev/null; then
  .devcontainer/scripts/start-headroom.sh restart
else
  echo "ℹ Headroom proxy not installed (skip by installing headroom-ai[proxy,mcp,ml,code])"
fi
