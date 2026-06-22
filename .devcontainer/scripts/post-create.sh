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
.devcontainer/scripts/install-cdk.sh

if command -v openspec >/dev/null 2>&1 \
  && [[ -d openspec ]] \
  && [[ ! -f .pi/skills/openspec-propose/SKILL.md ]]; then
  openspec init --tools pi || true
fi

# Install and link pi-web-access (web search, fetch, librarian skill)
if command -v pi >/dev/null 2>&1; then
  pi install npm:pi-web-access 2>&1 || true
  # Ensure the librarian skill is symlinked into project .pi/skills/
  SKILL_SRC="$HOME/.pi/agent/npm/node_modules/pi-web-access/skills/librarian"
  SKILL_DST=".pi/skills/librarian"
  if [[ -d "$SKILL_SRC" ]]; then
    rm -f "$SKILL_DST"
    ln -sf "$SKILL_SRC" "$SKILL_DST"
    echo "✓ pi-web-access linked: $SKILL_DST -> $SKILL_SRC"
  fi
fi

# Configure pi-web-access if API keys are provided
mkdir -p "$HOME/.pi"
if [[ ! -f "$HOME/.pi/web-search.json" ]]; then
  cat > "$HOME/.pi/web-search.json" <<'EOF'
{
  "exaApiKey": "${EXA_API_KEY:-}",
  "perplexityApiKey": "${PERPLEXITY_API_KEY:-}",
  "geminiApiKey": "${GEMINI_API_KEY:-}"
}
EOF
fi

if command -v pi >/dev/null 2>&1 \
  && [[ "${CFXDEVKIT_INSTALL_PI_GITNEXUS:-0}" == "1" ]]; then
  pi install npm:pi-gitnexus || true
fi

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

Optional PI bootstrap:
  CFXDEVKIT_INSTALL_PI_GITNEXUS=1 .devcontainer/scripts/post-create.sh

MSG
