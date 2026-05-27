## P1 — Dockerfile
- [x] Add libusb, mkcert, Caddy, udev rule for 1209:53c1

## P2 — devcontainer.json
- [x] --device /dev/bus/usb, CAP_NET_BIND_SERVICE, port 443, postCreateCommand

## P3 — Infrastructure
- [x] infrastructure/local/Caddyfile (all dev.cfxdevkit.org routes)
- [x] infrastructure/vps/Caddyfile (production stub)
- [x] .devcontainer/scripts/setup-local.sh (mkcert + Caddy start)
- [x] scripts/setup-trust-local-ca.sh (host trust store)
- [x] docs/adr/0005-local-https-reverse-proxy.md

## P4 — Showcase SDK fix
- [x] Remove hd-web-sdk, add hd-common-connect-sdk
- [x] next.config.ts: @noble/hashes aliases + Node.js fallbacks
- [x] moon.yml: next build --webpack
- [x] onekey-panel.tsx: hd-common-connect-sdk env:'webusb'

## P5 — signer-session onekey auto-discovery
- [x] createSignerSessionFromConfig: dynamically load SDK, searchDevices(), auto-connect

## P6 — nonce route fix
- [x] Move nonces Map to nonce-store.ts (Next.js 16 route export constraint)

## Validate
- [x] cdk repo precommit passes (status: passed)
- [x] showcase-public builds with webpack (no Turbopack errors)
- [x] Container has USB device access in sysfs
