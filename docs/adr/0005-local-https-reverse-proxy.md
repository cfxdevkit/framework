# ADR 0005 — Local HTTPS Reverse Proxy with Caddy + mkcert

**Status:** Accepted  
**Date:** 2026-05-26

---

## Context

The framework includes a showcase app, devnode server, MCP tools, and future services
(CAS, platform API). Each needs a stable, predictable URL that:

1. Works for any developer without per-machine manual configuration
2. Uses real HTTPS (required for WebUSB hardware wallet access on non-localhost origins)
3. Mirrors the production VPS hostname structure exactly
4. Scales cleanly as new services are added

Cloudflare manages `cfxdevkit.org`.

---

## Decision

Use **Caddy** as a local reverse proxy + **mkcert** for trusted TLS certificates.

- Cloudflare DNS: `A  *.dev.cfxdevkit.org → 127.0.0.1` (DNS only, proxy off)
- Caddy terminates TLS on port 443 inside the devcontainer
- mkcert generates a wildcard cert for `*.dev.cfxdevkit.org`
- One-time developer action: run `pnpm run setup:trust-local-ca` to install the root CA

`infrastructure/local/Caddyfile` is the **source of truth** for local hostname→service routing.
`infrastructure/vps/Caddyfile` mirrors the same structure with Docker service names as upstreams.
Adding a new service = one uncommented block in both files.

---

## Service map

| Subdomain | Local upstream | VPS | Notes |
|---|---|---|---|
| `showcase.dev.cfxdevkit.org` | `:3010` | ✅ `showcase.cfxdevkit.org` | showcase-public |
| `docs.dev.cfxdevkit.org` | `:3012` | ✅ `docs.cfxdevkit.org` | docs-site |
| `mcp.dev.cfxdevkit.org` | `:3020` | ✅ `mcp.cfxdevkit.org` | MCP high-level (user-facing) |
| `cas.dev.cfxdevkit.org` | `:3030` | ✅ `cas.cfxdevkit.org` | CAS automation suite |
| `api.dev.cfxdevkit.org` | `:3001` | ✅ `api.cfxdevkit.org` | Platform API (greenfield) |
| `local.dev.cfxdevkit.org` | `:3011` | ❌ local only | showcase-local |
| `devnode.dev.cfxdevkit.org` | `:52000` | ❌ local only | devnode-server (node control) |
| `devmcp.dev.cfxdevkit.org` | `:3021` | ❌ local only | MCP dev (low-level tooling) |

`devnode` and `devmcp` are intentionally local-only. They expose the Conflux node control
plane and low-level development tooling that should never be publicly accessible.

---

## MCP split: `mcp` vs `devmcp`

Two MCP service endpoints with **non-overlapping tool surfaces**:

- `mcp.cfxdevkit.org` — user-facing, VPS-deployed, high-level operations (wallet actions, contract calls, CAS integration, scheduled blockchain operations)
- `devmcp.dev.cfxdevkit.org` — developer-only, local, low-level (devnode control, contract deployment, keystore management, signing tools)

**Current state:** both point to the same MCP server process. Splitting into two separate
binaries with distinct tool registries is **future work** (tracked separately).
The Caddyfile routes are defined now so the hostname contract is stable.

---

## Rationale for Caddy over alternatives

| Option | Why rejected |
|---|---|
| Each service runs its own HTTPS | Ports in URLs, inconsistent with VPS, cert per service |
| nginx | More config boilerplate, no automatic TLS management |
| Cloudflare Tunnel | Per-developer lock-in, requires running daemon |
| mkcert only (no proxy) | Non-standard ports, no production mirror |
| **Caddy + mkcert** | One config, clean URLs, mirrors VPS, zero ports, portable |

Caddy requires `CAP_NET_BIND_SERVICE` in the devcontainer (port 443 < 1024).
This capability allows binding privileged ports only — it does not escalate to full root.
The capability is documented here as justification for the devcontainer.json entry.

---

## Developer onboarding

1. Open the devcontainer — setup-local.sh runs automatically (mkcert certs + Caddy start)
2. Run once on host: `pnpm run setup:trust-local-ca`
3. Restart browser
4. Access `https://showcase.dev.cfxdevkit.org:8443` on rootless Podman hosts, or `https://showcase.dev.cfxdevkit.org` when the container runtime can publish host port `443`

Cloudflare DNS record is a one-time setup for the whole team.
New developers clone the repo — steps 1-3 are all they need.
