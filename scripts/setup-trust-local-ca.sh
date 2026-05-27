#!/usr/bin/env bash
# scripts/setup-trust-local-ca.sh
#
# Run ONCE on your HOST machine (not inside the container) after the
# devcontainer has been created. Installs the mkcert root CA into the
# system / browser trust store so *.dev.cfxdevkit.org certificates are trusted.
#
# Usage:
#   pnpm run setup:trust-local-ca
#
# What it does:
#   1. Copies the mkcert CA from the container's cert directory (bind-mounted
#      or volume) into the host's mkcert CAROOT.
#   2. Runs `mkcert -install` on the host to register it.
#
# After this, restart your browser and navigate to:
#   https://showcase.dev.cfxdevkit.org
#
# You only need to run this once per host machine. If you rebuild the container,
# a new CA is NOT generated (the CAROOT directory is stable within the volume).

set -euo pipefail

# The container stores certs here (accessible via the workspace bind mount)
CONTAINER_CAROOT="$HOME/.local/share/mkcert/ca"

if [ ! -f "$CONTAINER_CAROOT/rootCA.pem" ]; then
  echo "❌ mkcert root CA not found at $CONTAINER_CAROOT"
  echo "   Ensure the devcontainer has been created and setup-local.sh has run."
  echo "   Then retry: pnpm run setup:trust-local-ca"
  exit 1
fi

# Install mkcert on the host if not present
if ! command -v mkcert &>/dev/null; then
  echo "Installing mkcert on host..."
  if command -v brew &>/dev/null; then
    brew install mkcert nss
  elif command -v apt-get &>/dev/null; then
    sudo apt-get install -y mkcert
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y mkcert
  else
    echo "Please install mkcert manually: https://github.com/FiloSottile/mkcert#installation"
    exit 1
  fi
fi

# Point mkcert at the container's CA root so it installs the same cert
export CAROOT="$CONTAINER_CAROOT"
mkcert -install

echo ""
echo "✓ Root CA installed. Restart your browser."
echo "  https://showcase.dev.cfxdevkit.org  should now show a green padlock."
echo ""
echo "DNS reminder (one-time in Cloudflare, then works for all developers):"
echo "  A  *.dev   127.0.0.1   proxied: OFF"
echo "  A  dev     127.0.0.1   proxied: OFF"
