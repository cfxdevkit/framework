#!/usr/bin/env bash

set -euo pipefail

PORTS=(3010 3011)
PIDS=()

for port in "${PORTS[@]}"; do
  pid="$(ss -ltnp "( sport = :$port )" 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -n 1)"
  if [ -n "$pid" ]; then
    PIDS+=("$pid")
  fi
done

if [ "${#PIDS[@]}" -eq 0 ]; then
  echo "No showcase listeners found on ports 3010/3011."
  exit 0
fi

echo "Stopping showcase-related listeners: ${PIDS[*]}"
kill "${PIDS[@]}" 2>/dev/null || true

echo "Done."