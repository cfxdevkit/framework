#!/usr/bin/env bash
# .devcontainer/scripts/start-headroom.sh
#
# Starts the Headroom compression proxy between devcontainer and local LLM.
# All LLM traffic from the devcontainer flows through this proxy,
# which compresses tool outputs, logs, and RAG chunks before they reach
# the local model (60–95% token savings, same answers).
#
# Usage: start-headroom.sh [--foreground]
#
# When run with --foreground, the proxy blocks in the foreground.
# When run without (default), it starts as a background daemon.

set -euo pipefail

# Ensure the headroom binary is discoverable even if PATH was modified
# (e.g., by post-start.sh which prepends PNPM_HOME to PATH).
if [[ -z "$(command -v headroom 2>/dev/null)" ]] && [[ -x /opt/headroom/bin/headroom ]]; then
  export PATH="/opt/headroom/bin:${PATH}"
fi

HEADROOM_PROXY_PORT="${HEADROOM_PROXY_PORT:-28787}"
HEADROOM_UPSTREAM="${HEADROOM_UPSTREAM:-http://host.containers.internal:13305/}"
HEADROOM_PID_FILE="${HOME}/.cache/headroom/proxy.pid"
HEADROOM_LOG_DIR="${HOME}/.cache/headroom/logs"
HEADROOM_CACHE_DIR="${HEADROOM_UPSTREAM%/}"

mkdir -p "$(dirname "$HEADROOM_PID_FILE")" "$HEADROOM_LOG_DIR"

# Verify headroom is installed (including the code extra for AST-based analysis)
if ! command -v headroom &>/dev/null; then
  echo "✗ headroom CLI not found on PATH"
  echo "  Ensure headroom-ai[code] is installed in the devcontainer"
  exit 1
fi

# Validate that the code extra is installed (tree-sitter for code-aware features)
if ! /opt/headroom/bin/pip show tree-sitter-language-pack &>/dev/null 2>&1; then
  echo "⚠ Code-Aware features DISABLED: install headroom-ai[code] to enable"
  echo "  Run: /opt/headroom/bin/pip install headroom-ai[code]"
fi
# Note: we don't exit here — the proxy still works without code features

run_proxy() {
  echo "=== Headroom compression proxy ==="
  echo "  Upstream:    $HEADROOM_UPSTREAM"
  echo "  Listening:   localhost:$HEADROOM_PROXY_PORT"
  echo "  Cache dir:   $HEADROOM_CACHE_DIR"
  echo ""

  headroom proxy \
    --port "$HEADROOM_PROXY_PORT" \
    --openai-api-url "$HEADROOM_UPSTREAM" \
    --anthropic-api-url "$HEADROOM_UPSTREAM" \
    --log-file "$HEADROOM_LOG_DIR/headroom.jsonl" &

  local pid=$!
  echo "$pid" > "$HEADROOM_PID_FILE"

  # Wait briefly and verify the proxy is actually listening
  local retries=0
  local max_retries=10
  while [[ $retries -lt $max_retries ]]; do
    if ss -tlnp 2>/dev/null | grep -q ":$HEADROOM_PROXY_PORT " || \
       curl -s -o /dev/null -w "" "http://localhost:$HEADROOM_PROXY_PORT/" 2>/dev/null; then
      echo "✓ Headroom proxy started (PID $pid, port $HEADROOM_PROXY_PORT)"
      return 0
    fi
    retries=$((retries + 1))
    sleep 0.5
  done

  echo "⚠ Headroom proxy started (PID $pid) but may not be listening on port $HEADROOM_PROXY_PORT"
  echo "  Check logs: $HEADROOM_LOG_DIR/headroom.jsonl"
  return 1
}

stop_proxy() {
  if [ -f "$HEADROOM_PID_FILE" ]; then
    local pid
    pid=$(cat "$HEADROOM_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      echo "  Headroom proxy stopped (PID $pid)"
    else
      echo "  Cleaning up stale PID file (PID $pid no longer running)"
      rm -f "$HEADROOM_PID_FILE"
    fi
  fi
}

case "${1:-}" in
  start)
    # Check if already running
    if [ -f "$HEADROOM_PID_FILE" ] && kill -0 "$(cat "$HEADROOM_PID_FILE")" 2>/dev/null; then
      echo "  Headroom proxy already running (PID $(cat "$HEADROOM_PID_FILE"))"
    else
      run_proxy
    fi
    ;;
  stop)
    stop_proxy
    ;;
  restart)
    stop_proxy
    sleep 1
    run_proxy
    ;;
  status)
    if [ -f "$HEADROOM_PID_FILE" ] && kill -0 "$(cat "$HEADROOM_PID_FILE")" 2>/dev/null; then
      echo "Headroom proxy running (PID $(cat "$HEADROOM_PID_FILE"), port $HEADROOM_PROXY_PORT)"
    else
      echo "Headroom proxy not running"
      [ -f "$HEADROOM_PID_FILE" ] && rm -f "$HEADROOM_PID_FILE"
    fi
    ;;
  *)
    # Default: start as background daemon
    if [ -f "$HEADROOM_PID_FILE" ] && kill -0 "$(cat "$HEADROOM_PID_FILE")" 2>/dev/null; then
      echo "  Headroom proxy already running (PID $(cat "$HEADROOM_PID_FILE"))"
    else
      run_proxy
    fi
    ;;
esac
