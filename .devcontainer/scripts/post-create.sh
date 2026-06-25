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

# ──────────────────────────────────────────────────────────────
# Caddy / mkcert (shared with setup-local.sh — called here so
# both run under the same postCreateCommand without duplication)
# ──────────────────────────────────────────────────────────────
bash .devcontainer/scripts/setup-local.sh

# ──────────────────────────────────────────────────────────────
# PI (Coding Agent) — workspace configuration
#
# The pi-coding-agent binary is already baked into the image
# (installed as root → ~/.npm-global/bin).  This section only
# handles repo-specific config:
#   - pi install (registers local/npm packages into ~/.pi/agent/)
#   - copy skills, prompts, providers.json, dcp.json
# All steps are idempotent and safe to re-run.
# ──────────────────────────────────────────────────────────────

# PI global install is done in the Dockerfile (as root → ~/.npm-global/bin).
# Fallback: install at runtime if the image hasn't been rebuilt yet.
export NPM_GLOBAL_PREFIX="${NPM_GLOBAL_PREFIX:-$HOME/.npm-global}"
mkdir -p "$NPM_GLOBAL_PREFIX/bin" "$NPM_GLOBAL_PREFIX/lib/node_modules"
export PATH="$NPM_GLOBAL_PREFIX/bin:$PATH"
PI_REQUIRED_VERSION="0.80.2"

if ! command -v pi &>/dev/null; then
  echo "→ PI not in image — installing at runtime (npm i -g pi-coding-agent)"
  npm i -g --ignore-scripts "@earendil-works/pi-coding-agent@${PI_REQUIRED_VERSION}" --prefix "$NPM_GLOBAL_PREFIX"
  if ! command -v pi &>/dev/null; then
    echo "✗ PI binary still not found after install — aborting"
    exit 1
  fi
fi

current_pi_version="$(pi --version 2>/dev/null | sed -E 's/[^0-9.].*$//' || true)"
if [[ -n "$current_pi_version" ]] && [[ "$(printf '%s\n' "$PI_REQUIRED_VERSION" "$current_pi_version" | sort -V | head -n1)" != "$PI_REQUIRED_VERSION" ]]; then
  echo "→ PI version $current_pi_version is older than required $PI_REQUIRED_VERSION — upgrading"
  npm i -g --ignore-scripts "@earendil-works/pi-coding-agent@${PI_REQUIRED_VERSION}" --prefix "$NPM_GLOBAL_PREFIX"
fi

echo "PI version: $(pi --version 2>/dev/null || echo 'unknown')"

# Build workspace (includes pi-customization)
pnpm build

# ──────────────────────────────────────────────────────────────
# Retry helper — some npm installs fail on flaky networks
# ──────────────────────────────────────────────────────────────
_retry() {
  local cmd="$1" max="${2:-3}" delay="${3:-5}" i=1
  while (( i <= max )); do
    if eval "$cmd"; then return 0; fi
    (( i++ )) || true
    echo "  ↻ retry $i/$max in ${delay}s…" && sleep "$delay"
  done
  return 1
}

# Install pi-customization as local path → ~/.pi/agent/settings.json
# Local paths are NOT copied — PI references the repo path directly.
_retry "pi install /workspaces/root/repos/cfx-tools/infra/pi-customization"

# Install third-party packages → ~/.pi/agent/npm/
_retry "pi install npm:@davecodes/pi-dcp" 3 10
_retry "pi install npm:pi-web-access" 3 10

# Install pi-gitnexus (GitNexus knowledge graph integration for pi)
_retry "pi install npm:pi-gitnexus" 3 10 || true

# Create ~/.pi/agent/ directory structure
mkdir -p "$HOME/.pi/agent/skills"
mkdir -p "$HOME/.pi/agent/prompts"

# No manual copy of skills/prompts from pi-customization.
# Project-level .pi/skills/ and .pi/prompts/ are the source of truth.
# npm-installed packages are discovered via ~/.pi/agent/npm/
# OpenSpec skills are initialized via CLI below.

# Create ~/.pi/agent/providers.json from template
if [[ -f "$HOME/.pi/agent/providers.json" ]]; then
  echo "✓ ~/.pi/agent/providers.json already exists — skipping"
else
  echo "→ Creating ~/.pi/agent/providers.json from template"
  PROVIDER_TEMPLATE="repos/cfx-tools/infra/pi-customization/config/providers.json"
  if [[ -f "$PROVIDER_TEMPLATE" ]]; then
    cp "$PROVIDER_TEMPLATE" "$HOME/.pi/agent/providers.json"
    echo "✓ providers.json created from template"
  else
    echo "⚠ No providers template found at $PROVIDER_TEMPLATE (create defaults)"
    cat > "$HOME/.pi/agent/providers.json" <<'EOF'
{
  "provider": "openai-compat",
  "baseUrl": "http://localhost:28787/v1/",
  "defaultModel": "Qwen3.6-35B-A3B-MTP-GGUF-Q8_0"
}
EOF
  fi
fi

# Create ~/.pi/agent/dcp.json if not present
if [[ -f "$HOME/.pi/agent/dcp.json" ]]; then
  echo "✓ ~/.pi/agent/dcp.json already exists — skipping"
else
  echo "→ Creating ~/.pi/agent/dcp.json"
  cat > "$HOME/.pi/agent/dcp.json" <<'EOF'
{
  "compress": {
    "minContextLimit": 30000,
    "maxContextLimit": 70000,
    "nudgeForce": "strong"
  },
  "strategies": {
    "deduplication": { "enabled": true },
    "purgeErrors": { "enabled": true, "turns": 2 }
  }
}
EOF
fi

# Configure web-search API keys (moved from .pi/web-search.json)
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

# Initialize OpenSpec skills via CLI (managed by openspec, not templated)
# Runs at project root → creates skills in .pi/skills/openspec-*/
if command -v openspec >/dev/null 2>&1 && [[ -d openspec ]]; then
  echo "→ Initializing OpenSpec skills via CLI"
  openspec init --tools pi --force 2>/dev/null || {
    echo "⚠ OpenSpec init failed — skills may be unavailable"
  }
  # Refresh to latest CLI version
  openspec update --force 2>/dev/null || true
else
  echo "⚠ OpenSpec CLI not found or openspec/ dir missing — skipping skill init"
fi

cat <<'MSG'

Conflux DevKit devcontainer is ready.

PI (Coding Agent):
  Version: baked into image (Dockerfile)
  Binary:  ~/.npm-global/bin/pi
  Config:  ~/.pi/agent/settings.json
  Provider: ~/.pi/agent/providers.json

Useful commands:
  pnpm build
  pnpm test
  pnpm lint
  pnpm devnode
  pnpm --filter cfxdevkit-vscode-extension build

GitNexus:
  gitnexus analyze    # build/rebuild knowledge graph
  gitnexus status     # check index freshness

MSG
