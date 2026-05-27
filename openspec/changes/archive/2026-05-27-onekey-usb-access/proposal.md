## Why
OneKey Classic S1 was not reachable from the showcase (hd-web-sdk iframe transport blocked
by cross-origin USB permission policy) nor from the CLI (no /dev/bus/usb passthrough in container).
Also, the Cloudflare-controlled cfxdevkit.org domain enables a clean local HTTPS setup
mirroring the VPS service topology — required for WebUSB on non-localhost origins.

## What Changes
- Dockerfile: add Caddy, mkcert, libusb, udev rule for OneKey (1209:53c1)
- devcontainer.json: --device /dev/bus/usb, CAP_NET_BIND_SERVICE, port 443, postCreateCommand
- infrastructure/local/Caddyfile: reverse proxy for all dev.cfxdevkit.org subdomains
- infrastructure/vps/Caddyfile: matching production stub
- scripts/setup-trust-local-ca.sh: one-time host browser trust store install
- showcase-public: hd-web-sdk → hd-common-connect-sdk env:webusb, webpack build, @noble/hashes aliases
- signer-session: createSignerSessionFromConfig for onekey scans USB devices automatically
- ADR 0005: documents the Caddy + mkcert architecture decision and service map

## Capabilities
### New Capabilities
- local-https-infra: *.dev.cfxdevkit.org → Caddy → localhost services, mkcert TLS
- onekey-usb-cli: cdk sign with onekey signer auto-discovers USB device
### Modified Capabilities
- onekey-browser: hd-common-connect-sdk direct WebUSB (no iframe, no CDN dependency)
