#!/usr/bin/env bash
# Install the cdk, cfx, and repo binaries into the pnpm global bin path.
# Rebuilds automatically when source files are newer than the dist.
# Safe to run multiple times (idempotent).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_WORKSPACE="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE="${containerWorkspaceFolder:-$DEFAULT_WORKSPACE}"
CLI_PACKAGE="$WORKSPACE/repos/cfx-tools/packages/cli"
CLI_DIST="$CLI_PACKAGE/dist"
CLI_SRC="$CLI_PACKAGE/src"
TOOLING_PACKAGE="$WORKSPACE/repos/cfx-tools/infra/tooling-cli"
TOOLING_DIST="$TOOLING_PACKAGE/dist/bin.js"
TOOLING_SRC="$TOOLING_PACKAGE/src"
PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"

# Build @cfxdevkit/cli if needed
cli_needs_build=false
if [[ ! -f "$CLI_DIST/cdk.js" ]]; then
  echo "[cfxdevkit] cli cdk dist not found — building..."
  cli_needs_build=true
elif [[ -d "$CLI_SRC" ]] && find "$CLI_SRC" -name '*.ts' -newer "$CLI_DIST/cdk.js" -print -quit 2>/dev/null | grep -q .; then
  echo "[cfxdevkit] cli source changed — rebuilding..."
  cli_needs_build=true
fi
if [[ "$cli_needs_build" == "true" ]]; then
  (cd "$CLI_PACKAGE" && pnpm exec vite build)
fi

# Install cdk binary
if [[ -f "$CLI_DIST/cdk.js" ]]; then
  chmod +x "$CLI_DIST/cdk.js"
  mkdir -p "$PNPM_HOME"
  ln -sf "$CLI_DIST/cdk.js" "$PNPM_HOME/cdk"
  echo "[cfxdevkit] cdk binary installed: $PNPM_HOME/cdk → $CLI_DIST/cdk.js"
else
  echo "[cfxdevkit] WARNING: cdk binary not installed"
fi

# Install cfx binary
if [[ -f "$CLI_DIST/bin.js" ]]; then
  chmod +x "$CLI_DIST/bin.js"
  ln -sf "$CLI_DIST/bin.js" "$PNPM_HOME/cfx"
  echo "[cfxdevkit] cfx binary installed: $PNPM_HOME/cfx → $CLI_DIST/bin.js"
else
  echo "[cfxdevkit] WARNING: cfx binary not installed"
fi

# Install repo binary
if [[ -f "$TOOLING_DIST" ]]; then
  chmod +x "$TOOLING_DIST"
  ln -sf "$TOOLING_DIST" "$PNPM_HOME/repo"
  echo "[cfxdevkit] repo binary installed: $PNPM_HOME/repo → $TOOLING_DIST"
else
  echo "[cfxdevkit] WARNING: repo binary not installed"
fi
