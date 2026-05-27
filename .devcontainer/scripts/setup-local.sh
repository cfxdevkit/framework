#!/usr/bin/env bash
# .devcontainer/scripts/setup-local.sh
#
# Runs once after container creation (postCreateCommand).
# Sets up mkcert certs for *.dev.cfxdevkit.org and starts Caddy.
#
# After this script completes, run on your HOST machine (once per machine):
#   pnpm run setup:trust-local-ca
# This installs the mkcert root CA into your host browser's trust store.

set -euo pipefail

DOMAIN="dev.cfxdevkit.org"
CERT_DIR="$HOME/.local/share/mkcert"
CADDY_PID_FILE="/tmp/caddy.pid"

echo "=== Local HTTPS setup for *.${DOMAIN} ==="

# 1. Generate mkcert root CA and cert for wildcard + apex
mkdir -p "$CERT_DIR"
export CAROOT="$CERT_DIR/ca"
mkdir -p "$CAROOT"

mkcert -install 2>/dev/null || true   # Install CA into container trust store
mkcert \
  -cert-file "$CERT_DIR/${DOMAIN}.pem" \
  -key-file  "$CERT_DIR/${DOMAIN}-key.pem" \
  "*.${DOMAIN}" "${DOMAIN}" "localhost" 2>&1 | grep -v "^The certificate" || true

echo "✓ Certificates generated at $CERT_DIR"

# 2. Start Caddy (if not already running)
if [ -f "$CADDY_PID_FILE" ] && kill -0 "$(cat "$CADDY_PID_FILE")" 2>/dev/null; then
  echo "  Caddy already running (PID $(cat "$CADDY_PID_FILE"))"
else
  CAROOT="$CAROOT" caddy start \
    --config /workspaces/root/infrastructure/local/Caddyfile \
    --pidfile "$CADDY_PID_FILE" \
    --adapter caddyfile 2>&1 | head -5 || echo "  ⚠ Caddy start failed — run manually: caddy start --config infrastructure/local/Caddyfile"
  echo "✓ Caddy started"
fi

echo ""
echo "=== Next step (one-time on your HOST machine) ==="
echo "Run: pnpm run setup:trust-local-ca"
echo "This installs the mkcert root CA so your browser trusts *.${DOMAIN}."
echo ""
echo "DNS (one-time in Cloudflare):"
echo "  A  *.dev   127.0.0.1   DNS only (orange cloud OFF)"
echo "  A  dev     127.0.0.1   DNS only"
