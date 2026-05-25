# Phase 0 — Legacy Showcase Audit

**Workspace root:** `/workspaces/root`  
**App paths are relative to:** `projects/examples/apps/`  
**See COMPLETION_PLAN.md** for the full monorepo layout reference (package → directory mapping, tier definitions).

**Goal:** Determine exactly what must be ported before deleting each legacy app.  
**Outcome:** A per-feature decision matrix (port / superseded / delete) plus `@cfxdevkit/hardware-bridge` disposition.

### What is showcase-backend?
`projects/examples/apps/showcase-backend/` is the **old legacy Express server** that powered the original `showcase`, `showcase-browser`, and `showcase-stack` apps (ports 5181–5183). It predates `@cfxdevkit/devnode-server` being extracted into a proper package.

**It is NOT a keeper.** Neither `showcase-local` nor `showcase-public` depend on it:
- `showcase-local` has `@cfxdevkit/devnode-server` as a direct dependency and runs the server in-process (`lib/local-runtime.ts` calls `createDevnodeServerApp()` directly; Next.js API routes forward to it via `requestRuntime()`). `next.config.ts` lists `@cfxdevkit/devnode-server` in `serverExternalPackages`.
- `showcase-public` has no `@cfxdevkit/devnode-server` or `@cfxdevkit/client` dependency; it is a fully browser-side app.

`showcase-backend` is scheduled for deletion along with the other legacy apps. Its features (SIWE, session-key, Solidity compilation, devnode control) are all superseded by `showcase-local`'s embedded server or ported to `showcase-public`'s own Next.js API routes.

---

## Apps Scheduled for Deletion

| App | Full path | Decision |
|-----|-----------|----------|
| `showcase` | `projects/examples/apps/showcase/` | Delete after partial port |
| `showcase-browser` | `projects/examples/apps/showcase-browser/` | Delete after partial port |
| `showcase-stack` | `projects/examples/apps/showcase-stack/` | Delete (mostly superseded) |
| `showcase-gateway` | `projects/examples/apps/showcase-gateway/` | Delete (reverse proxy only) |
| `showcase-backend` | `projects/examples/apps/showcase-backend/` | Delete (legacy Express server; all features superseded) |
| `hardware-wallet-showcase` | `projects/examples/apps/hardware-wallet-showcase/` | Dissolve → showcase-public |

---

## Feature Decision Matrix

### From `showcase` (backend showcase)

| Feature | Destination | Decision | Notes |
|---------|-------------|----------|-------|
| Core RPC — address codec, unit helpers | showcase-public | **Superseded** | Already on `/core` page |
| Core RPC — block/tx lookups, chain info | showcase-public | **Port** | Extend existing `/core` page |
| Core RPC — cross-space bridge reads | showcase-public | **Port** | Add to existing `/core` page |
| Solidity compiler panel | showcase-local | **Superseded** | `compose.tsx` panel fully covers this |
| Contract interaction panel | showcase-local | **Superseded** | `contract-context.tsx` panel covers this |
| BIP-39 mnemonic generate/validate | showcase-public | **Superseded** | Already in `/keys` page |
| HD derivation (dual accounts) | showcase-public | **Superseded** | Already in `/keys` page |
| Managed wallet management | showcase-local | **Superseded** | Keystore panel covers this fully |
| Keystore session (list roots, sign) | showcase-local | **Superseded** | Keystore panel covers this |
| Session key delegation | showcase-local | **Superseded** | `custom-operation` panel covers this |
| **SIWE authentication** | showcase-public | **Superseded** | Already on `/siwe`; hardening is optional |
| Contract deployment | showcase-local | **Superseded** | `deploy.tsx` panel covers this |
| Network status / health | showcase-local | **Superseded** | Devnode panel shows this |

**SIWE note:** SIWE (Sign-In with Ethereum, EIP-4361) is already demonstrated in showcase-public at `/siwe`, backed by `app/api/auth/nonce/route.ts` and `app/api/auth/verify/route.ts`. The signing logic lives in `@cfxdevkit/wallet-connect/siwe`. Remaining work, if any, is hardening or polishing the existing demo, not creating the flow from scratch.

### From `showcase-browser` (browser wallet showcase)

| Feature | Destination | Decision | Notes |
|---------|-------------|----------|-------|
| BIP-39 mnemonic | showcase-public | **Superseded** | Already on `/keys` |
| HD derivation | showcase-public | **Superseded** | Already on `/keys` |
| **Fluent wallet connect** | showcase-public | **Superseded** | Already on `/wallet` via `useCoreWallet` |
| **MetaMask / EIP-1193 connect** | showcase-public | **Superseded** | Existing header + wagmi wallet flow |
| **wagmi eSpace wallet** | showcase-public | **Superseded** | Existing `/wallet` page |
| **Account dashboard (balance, gas, epoch)** | showcase-public | **Superseded** | Existing `/wallet` page covers core account state + eSpace balance/chain state |
| **Message signing** — personal_sign, EIP-712 | showcase-public | **Port** | Extend existing `/wallet` page |
| **Message signing** — CIP-23 (Core) | showcase-public | **Port** | Extend existing `/wallet` page |
| **Send transactions** — eSpace CFX (wagmi) | showcase-public | **Port** | Extend existing `/wallet` page |
| **Send transactions** — Core CFX (cfx_sendTransaction) | showcase-public | **Port** | Extend existing `/wallet` page |
| **Dual-space** (Core + eSpace simultaneously) | showcase-public | **Port** | Extend existing `/wallet` page with a combined dashboard/action view |
| Address/units conversion | showcase-public | **Superseded** | On `/core` page |

### From `showcase-stack` (full-stack combined)

| Feature | Destination | Decision | Notes |
|---------|-------------|----------|-------|
| DevNode control (start/stop/mine) | showcase-local | **Superseded** | `devnode.tsx` panel is more complete |
| SIWE authentication | showcase-public | **Superseded** | Existing `/siwe` page + API routes |
| Session key delegation | showcase-local | **Superseded** | `custom-operation` panel covers this |
| Solidity compiler + deploy | showcase-local | **Superseded** | `compose.tsx` + `deploy.tsx` |
| Contract interaction | showcase-local | **Superseded** | `contract-context.tsx` |
| Network status | showcase-local | **Superseded** | Devnode panel |
| "About" explanation page | — | **Delete** | Content will be in README / docs |

### From `hardware-wallet-showcase`

This app has no overlap with showcase-public — everything in it is unique and needs porting.  
Full porting plan is in [phase-2-showcase-public.md](./phase-2-showcase-public.md).

---

## `@cfxdevkit/hardware-bridge` Stub Decision

**Current state:** `repos/cfx-domain/packages/hardware-bridge/` exists as a skeletal placeholder package. It has a tiny `src/index.ts` smoke export (`__packageName`) and a matching test, but no real bridge implementation.

**Finding:** The hardware wallet implementations (Ledger, OneKey, Satochip) are fully present in `@cfxdevkit/wallet` (`repos/cfx-keys/packages/wallet/src/hardware/`). There is no functional gap that `@cfxdevkit/hardware-bridge` would fill.

**Decision:** **Delete the stub entirely.**
- Delete directory: `repos/cfx-domain/packages/hardware-bridge/`
- Remove its entry from `/workspaces/root/pnpm-workspace.yaml`
- Remove from `/workspaces/root/.moon/workspace.yml` or any per-package `moon.yml` that references it
- The hardware wallet demo should reference `@cfxdevkit/wallet` sub-paths directly

---

## Deletion Checklist

All commands run from `/workspaces/root`. Workspace config file: `/workspaces/root/pnpm-workspace.yaml`. Moon workspace config: `/workspaces/root/.moon/workspace.yml`.

### showcase (`projects/examples/apps/showcase/`)
- [ ] Confirm existing `/siwe` page is sufficient, or harden it as needed (see Phase 2)
- [ ] Extend existing `/core` page with any still-missing lookup panels (see Phase 2)
- [ ] All other features confirmed superseded (see matrix above)
- [ ] Remove entry from `/workspaces/root/pnpm-workspace.yaml`
- [ ] Remove from `/workspaces/root/.moon/workspace.yml` (if listed)
- [ ] Delete directory: `projects/examples/apps/showcase/`

### showcase-browser (`projects/examples/apps/showcase-browser/`)
- [ ] Confirm existing `/wallet` page already covers connect/account/chain switch
- [ ] Message signing demo ported
- [ ] Send transaction demo ported
- [ ] Dual-space dashboard/action view ported
- [ ] Remove from `pnpm-workspace.yaml` and Moon config
- [ ] Delete directory

### showcase-stack (`projects/examples/apps/showcase-stack/`)
- [ ] SIWE porting tracked under showcase (same destination)
- [ ] All other features confirmed superseded
- [ ] Remove from `pnpm-workspace.yaml` and Moon config
- [ ] Delete directory

### showcase-gateway (`projects/examples/apps/showcase-gateway/`)
- [ ] Confirm no external systems still point to it
- [ ] Remove from `pnpm-workspace.yaml` and Moon config
- [ ] Remove any nginx/caddy config in `infrastructure/` that routes to it
- [ ] Delete directory

### showcase-backend (`projects/examples/apps/showcase-backend/`)
- [ ] Confirm neither showcase-local nor showcase-public reference it (they do not — both are self-contained)
- [ ] Confirm existing showcase-public SIWE routes are sufficient for release
- [ ] Remove from `pnpm-workspace.yaml` and Moon config
- [ ] Delete directory

### hardware-wallet-showcase (`projects/examples/apps/hardware-wallet-showcase/`)
- [ ] All content ported to showcase-public (tracked in Phase 2)
- [ ] Remove from `pnpm-workspace.yaml` and Moon config
- [ ] Delete directory

### @cfxdevkit/hardware-bridge (`repos/cfx-domain/packages/hardware-bridge/`)
- [ ] Delete directory
- [ ] Remove from `/workspaces/root/pnpm-workspace.yaml`
- [ ] Remove from Moon config
- [ ] Run `pnpm check:unused` — no remaining references should appear

---

## Existing showcase-public Routes To Extend

As a result of this audit, showcase-public does **not** need a new chapter structure. It already has the right top-level routes; the remaining work is to extend them:

| Route | Existing content | Remaining gap | Source |
|-------|------------------|---------------|--------|
| `/wallet` | eSpace/Core connect, account state, chain switch | message signing, send tx, richer dual-space dashboard | showcase-browser |
| `/core` | chain list, live RPC call, codec, units | block/tx lookups, cross-space reads | showcase |
| `/siwe` | nonce → sign → verify demo | optional hardening only | showcase + showcase-stack |
| `/keys` | mnemonic + derivation | hardware wallet section | hardware-wallet-showcase |
