#!/usr/bin/env bash
# Install the cdk binary from the tooling-cli dist into the pnpm global bin path.
# Rebuilds automatically when source files are newer than the dist.
# Safe to run multiple times (idempotent).
set -euo pipefail

WORKSPACE="${containerWorkspaceFolder:-/workspaces/root}"
CDK_PACKAGE="$WORKSPACE/repos/cfx-tools/infra/tooling-cli"
CDK_DIST="$CDK_PACKAGE/dist/bin.js"
CDK_SRC="$CDK_PACKAGE/src"
PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"

# Build if dist is missing OR any source file is newer than the dist.
needs_build=false
if [[ ! -f "$CDK_DIST" ]]; then
  echo "[cfxdevkit] tooling-cli dist not found — building..."
  needs_build=true
elif [[ -d "$CDK_SRC" ]] && find "$CDK_SRC" -name '*.ts' -newer "$CDK_DIST" -print -quit 2>/dev/null | grep -q .; then
  echo "[cfxdevkit] tooling-cli source changed — rebuilding..."
  needs_build=true
fi

if [[ "$needs_build" == "true" ]]; then
  (cd "$CDK_PACKAGE" && pnpm exec vite build)
fi

if [[ ! -f "$CDK_DIST" ]]; then
  echo "[cfxdevkit] WARNING: cdk binary not installed (dist/bin.js still missing after build)"
  exit 0
fi

chmod +x "$CDK_DIST"
mkdir -p "$PNPM_HOME"
ln -sf "$CDK_DIST" "$PNPM_HOME/cdk"

echo "[cfxdevkit] cdk binary installed: $PNPM_HOME/cdk → $CDK_DIST"
