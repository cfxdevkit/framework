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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TMP_CAROOT=""

find_container_engine() {
  if command -v docker &>/dev/null; then
    echo "docker"
    return 0
  fi
  if command -v podman &>/dev/null; then
    echo "podman"
    return 0
  fi
  return 1
}

import_ca_to_nss_db() {
  local db_path="$1"
  local db_spec=""

  if [ -f "$db_path/cert9.db" ]; then
    db_spec="sql:$db_path"
  elif [ -f "$db_path/cert8.db" ]; then
    db_spec="$db_path"
  else
    return 0
  fi

  certutil -D -d "$db_spec" -n "cfxdevkit-local-mkcert" >/dev/null 2>&1 || true
  certutil -A -d "$db_spec" -n "cfxdevkit-local-mkcert" -t "C,," -i "$CONTAINER_CAROOT/rootCA.pem" >/dev/null
  echo "  • Imported CA into NSS DB: $db_path"
}

import_ca_to_firefox_profiles() {
  local profiles_root="$HOME/.mozilla/firefox"
  [ -d "$profiles_root" ] || return 0

  local imported_any="0"
  local profile
  for profile in "$profiles_root"/*.default* "$profiles_root"/*.dev-edition*; do
    [ -d "$profile" ] || continue
    import_ca_to_nss_db "$profile"
    imported_any="1"
  done

  if [ "$imported_any" = "0" ]; then
    echo "  • No Firefox profiles found to update."
  fi
}

detect_container_caroot() {
  local engine
  if engine="$(find_container_engine)"; then
    local container_ids
    container_ids="$($engine ps --filter "label=devcontainer.local_folder=$WORKSPACE_DIR" --format '{{.ID}}' 2>/dev/null || true)"

    local cid
    while IFS= read -r cid; do
      [ -n "$cid" ] || continue
      if $engine exec "$cid" test -f /home/node/.local/share/mkcert/ca/rootCA.pem 2>/dev/null; then
        TMP_CAROOT="$(mktemp -d)"
        $engine cp "$cid:/home/node/.local/share/mkcert/ca/rootCA.pem" "$TMP_CAROOT/rootCA.pem" >/dev/null
        if $engine exec "$cid" test -f /home/node/.local/share/mkcert/ca/rootCA-key.pem 2>/dev/null; then
          $engine cp "$cid:/home/node/.local/share/mkcert/ca/rootCA-key.pem" "$TMP_CAROOT/rootCA-key.pem" >/dev/null
        fi
        echo "$TMP_CAROOT"
        return 0
      fi
    done <<< "$container_ids"
  fi

  local candidate
  for candidate in \
    "$HOME/.local/share/mkcert/ca" \
    "$WORKSPACE_DIR/.devcontainer/mkcert/ca"; do
    if [ -f "$candidate/rootCA.pem" ]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

cleanup() {
  if [ -n "$TMP_CAROOT" ] && [ -d "$TMP_CAROOT" ]; then
    rm -rf "$TMP_CAROOT"
  fi
}

trap cleanup EXIT

CONTAINER_CAROOT="$(detect_container_caroot || true)"

if [ -z "$CONTAINER_CAROOT" ] || [ ! -f "$CONTAINER_CAROOT/rootCA.pem" ]; then
  echo "❌ mkcert root CA not found from host or running devcontainer"
  echo "   Ensure the devcontainer has been created and setup-local.sh has run."
  echo "   If the container is running, verify this path exists inside it:"
  echo "   /home/node/.local/share/mkcert/ca/rootCA.pem"
  echo "   Then retry: pnpm run setup:trust-local-ca"
  exit 1
fi

# Install mkcert on the host if not present
if ! command -v mkcert &>/dev/null; then
  echo "Installing mkcert on host..."
  if command -v brew &>/dev/null; then
    brew install mkcert nss
  elif command -v apt-get &>/dev/null; then
    sudo apt-get install -y mkcert libnss3-tools
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y mkcert nss-tools
  else
    echo "Please install mkcert manually: https://github.com/FiloSottile/mkcert#installation"
    exit 1
  fi
fi

if ! command -v certutil &>/dev/null; then
  echo "⚠️  'certutil' not found. Browser trust (especially Firefox) may still fail."
  echo "   Install NSS tools and re-run this command."
fi

# Point mkcert at the container's CA root so it installs the same cert
export CAROOT="$CONTAINER_CAROOT"
mkcert -install

if command -v certutil &>/dev/null; then
  echo "Importing CA into NSS databases..."
  mkdir -p "$HOME/.pki/nssdb"
  if [ ! -f "$HOME/.pki/nssdb/cert9.db" ] && [ ! -f "$HOME/.pki/nssdb/cert8.db" ]; then
    certutil -N -d "sql:$HOME/.pki/nssdb" --empty-password >/dev/null 2>&1 || true
  fi
  import_ca_to_nss_db "$HOME/.pki/nssdb"
  import_ca_to_firefox_profiles
fi

echo ""
echo "✓ Root CA installed. Restart your browser."
echo "  https://showcase.dev.cfxdevkit.org  should now show a green padlock."
echo ""
echo "DNS reminder (one-time in Cloudflare, then works for all developers):"
echo "  A  *.dev   127.0.0.1   proxied: OFF"
echo "  A  dev     127.0.0.1   proxied: OFF"
