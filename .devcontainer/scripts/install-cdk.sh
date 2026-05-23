#!/usr/bin/env bash
# Install the cdk binary from the tooling-cli dist into the pnpm global bin path.
# Safe to run multiple times (idempotent).
set -euo pipefail

WORKSPACE="${containerWorkspaceFolder:-/workspaces/root}"
CDK_PACKAGE="$WORKSPACE/repos/cfx-tools/infra/tooling-cli"
CDK_DIST="$CDK_PACKAGE/dist/bin.js"
PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"

# Build if dist is missing (first run, or after a clean).
if [[ ! -f "$CDK_DIST" ]]; then
  echo "[cfxdevkit] tooling-cli dist not found — building..."
  (cd "$WORKSPACE" && pnpm --filter @cfxdevkit/tooling-cli run build)
fi

if [[ ! -f "$CDK_DIST" ]]; then
  echo "[cfxdevkit] WARNING: cdk binary not installed (dist/bin.js still missing after build)"
  exit 0
fi

chmod +x "$CDK_DIST"
mkdir -p "$PNPM_HOME"
ln -sf "$CDK_DIST" "$PNPM_HOME/cdk"

echo "[cfxdevkit] cdk binary installed: $PNPM_HOME/cdk → $CDK_DIST"
