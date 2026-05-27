#!/usr/bin/env bash

set -euo pipefail

PUBLIC_PORT=3010
LOCAL_PORT=3011

listener_pid() {
  local port="$1"
  ss -ltnp "( sport = :$port )" 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -n 1
}

parent_pid() {
  local pid="$1"
  ps -p "$pid" -o ppid= 2>/dev/null | tr -d ' '
}

process_args() {
  local pid="$1"
  ps -p "$pid" -o args= 2>/dev/null || true
}

is_showcase_process() {
  local pid="$1"
  local depth=0
  while [ -n "$pid" ] && [ "$pid" != "0" ] && [ "$depth" -lt 8 ]; do
    local args
    args="$(process_args "$pid")"
    if echo "$args" | grep -E '/projects/examples/apps/showcase-(local|public)/' >/dev/null 2>&1; then
      return 0
    fi
    pid="$(parent_pid "$pid")"
    depth=$((depth + 1))
  done
  return 1
}

public_pid="$(listener_pid "$PUBLIC_PORT")"
local_pid="$(listener_pid "$LOCAL_PORT")"

if [ -n "$public_pid" ] && [ -n "$local_pid" ] && is_showcase_process "$public_pid" && is_showcase_process "$local_pid"; then
  echo "Showcase is already running on ports $PUBLIC_PORT and $LOCAL_PORT."
  echo "Use 'pnpm run showcase:stop' to stop it first if you want a clean restart."
  exit 0
fi

if [ -n "$public_pid" ] || [ -n "$local_pid" ]; then
  echo "❌ Port conflict detected."
  [ -n "$public_pid" ] && echo "   Port $PUBLIC_PORT is in use by PID $public_pid"
  [ -n "$local_pid" ] && echo "   Port $LOCAL_PORT is in use by PID $local_pid"
  echo "   Run 'pnpm run showcase:stop' or free those ports, then retry."
  exit 1
fi

pnpm --parallel --filter @cfxdevkit/example-showcase-local --filter @cfxdevkit/example-showcase-public dev