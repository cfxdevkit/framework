#!/usr/bin/env bash
# Wire internal workspace dependencies per the documented API contracts.
# Adds dependencies via pnpm so package.json + lockfile stay coherent.
# Idempotent — pnpm add of an existing dep is a no-op upgrade-in-place.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# add_dep <package_filter> <kind: prod|peer> <dep1> [dep2...]
add_dep() {
  local filter="$1"
  local kind="$2"
  shift 2
  local flag="--save-prod"
  if [[ "$kind" == "peer" ]]; then
    flag="--save-peer"
  fi
  echo "==> $filter  ($kind)  +=  $*"
  pnpm --filter "$filter" add "$flag" "$@"
}

# ---------- framework ----------

# core: no internal deps

# services -> core
add_dep "@cfxdevkit/services" prod "@cfxdevkit/cdk@workspace:*"

# wallet -> core, services
add_dep "@cfxdevkit/wallet" prod \
  "@cfxdevkit/cdk@workspace:*" \
  "@cfxdevkit/services@workspace:*"

# compiler -> core
add_dep "@cfxdevkit/compiler" prod "@cfxdevkit/cdk@workspace:*"

# devnode -> core
add_dep "@cfxdevkit/devnode" prod "@cfxdevkit/cdk@workspace:*"

# contracts -> core
add_dep "@cfxdevkit/contracts" prod "@cfxdevkit/cdk@workspace:*"

# protocol -> core
add_dep "@cfxdevkit/protocol" prod "@cfxdevkit/cdk@workspace:*"

# executor -> core (only the error type + types)
add_dep "@cfxdevkit/executor" prod "@cfxdevkit/cdk@workspace:*"

# react -> core (prod) + wallet (peer)
add_dep "@cfxdevkit/react" prod "@cfxdevkit/cdk@workspace:*"
add_dep "@cfxdevkit/react" peer "@cfxdevkit/wallet@workspace:*"

# wallet-connect -> core (prod) + wallet (peer)
add_dep "@cfxdevkit/wallet-connect" prod "@cfxdevkit/cdk@workspace:*"
add_dep "@cfxdevkit/wallet-connect" peer "@cfxdevkit/wallet@workspace:*"

# defi-react -> core, services, react, wallet-connect (prod) + theme (peer)
add_dep "@cfxdevkit/defi-react" prod \
  "@cfxdevkit/cdk@workspace:*" \
  "@cfxdevkit/services@workspace:*" \
  "@cfxdevkit/react@workspace:*" \
  "@cfxdevkit/wallet-connect@workspace:*"
add_dep "@cfxdevkit/defi-react" peer "@cfxdevkit/theme@workspace:*"

# theme: no internal deps

# testing -> core, devnode, contracts
add_dep "@cfxdevkit/testing" prod \
  "@cfxdevkit/cdk@workspace:*" \
  "@cfxdevkit/devnode@workspace:*" \
  "@cfxdevkit/contracts@workspace:*"

# ---------- domains ----------

# game-engine -> core, contracts
add_dep "@cfxdevkit/game-engine" prod \
  "@cfxdevkit/cdk@workspace:*" \
  "@cfxdevkit/contracts@workspace:*"

# automation -> core, services, wallet, executor, contracts
add_dep "@cfxdevkit/automation" prod \
  "@cfxdevkit/cdk@workspace:*" \
  "@cfxdevkit/services@workspace:*" \
  "@cfxdevkit/wallet@workspace:*" \
  "@cfxdevkit/executor@workspace:*" \
  "@cfxdevkit/contracts@workspace:*"

# ---------- platform ----------

# mcp-server -> core, services, wallet, contracts, compiler, devnode
add_dep "@cfxdevkit/mcp-server" prod \
  "@cfxdevkit/cdk@workspace:*" \
  "@cfxdevkit/services@workspace:*" \
  "@cfxdevkit/wallet@workspace:*" \
  "@cfxdevkit/contracts@workspace:*" \
  "@cfxdevkit/compiler@workspace:*" \
  "@cfxdevkit/devnode@workspace:*"

# scaffold-cli: no internal deps (it scaffolds, doesn't consume)

echo
echo "Wiring complete."
