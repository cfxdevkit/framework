# projects/cas — Conflux Automation Site

CAS is a DeFi automation system that lets users create limit-order and DCA strategies on Conflux
eSpace. Contracts are deployed on both testnet (chain 71) and mainnet (chain 1030).

**Apps**
- `apps/backend/` — Express API backed by SQLite: auth, jobs, admin, pools, keeper, SSE.
- `apps/frontend/` — Next.js 16 dashboard: SIWE sign-in, strategy builder, job list, approvals.

**Packages**
- `packages/shared/` — CAS job DTOs, API client, and contract address helpers shared between apps.

**Framework usage**
- `@cfxdevkit/automation` — SQLite schema, job and execution repositories, keeper engine.
- `@cfxdevkit/protocol` — canonical contract addresses (AutomationManager, WCFX, etc.).
- `@cfxdevkit/wallet-connect/siwe` — SIWE nonce generation and signature verification.
- `@cfxdevkit/wallet-connect` — frontend wagmi providers without ConnectKit.

---

## Quick start

### Prerequisites

- Node ≥ 24, pnpm ≥ 10
- A browser wallet (MetaMask, OKX, Fluent) connected to Conflux eSpace Testnet (chain 71)
- A testnet CFX balance — use the [Conflux testnet faucet](https://efaucet.confluxnetwork.org/)

### Guided setup (recommended)

The `cas-setup` wizard handles env file generation and optional keeper registration interactively:

```bash
# 1. Install dependencies (repo root)
pnpm install

# 2. Build the setup wizard
pnpm --filter @cfxdevkit/cas-setup build

# 3. Run the wizard from the projects/cas/ directory
cd projects/cas
pnpm setup
```

The wizard will:
1. Check your Node.js version
2. Let you pick testnet / mainnet / local-devnode — and verifies the RPC is reachable
3. Show (or deploy) contract addresses
4. Optionally configure keeper mode with a funded signer key
5. Write `apps/backend/.env` and `apps/frontend/.env.local`
6. Offer to start both services immediately

Run `pnpm setup -- --force` to overwrite existing env files without prompts.

---

### Manual setup — No-keeper mode (read/create jobs, no automatic execution)

```bash
# 1. Install dependencies (repo root)
pnpm install

# 2. Build the shared package
pnpm --filter @cfxdevkit/cas-shared build

# 3. Configure the backend
cp projects/cas/apps/backend/.env.example projects/cas/apps/backend/.env
# Edit .env if needed (defaults target testnet, keeper disabled)
set -a; source projects/cas/apps/backend/.env; set +a

# 4. Configure the frontend
cp projects/cas/apps/frontend/.env.local.example projects/cas/apps/frontend/.env.local
# Edit .env.local if needed (defaults target testnet)

# 5. Start the backend (http://127.0.0.1:3011)
pnpm --filter @cfxdevkit/cas-backend dev

# 6. Start the frontend (http://127.0.0.1:3010)
pnpm --filter @cfxdevkit/cas-frontend dev

# 7. Open http://127.0.0.1:3010 in your browser
#    → Connect wallet → Create a job → View the dashboard
```

### Keeper mode (automatic job execution)

The keeper worker is embedded in the backend process and is enabled via env vars. The signer
account must be **registered on the AutomationManager contract** before any execution transactions
will be accepted. Without registration, the keeper will silently broadcast transactions that revert
on-chain with `Unauthorized`.

**One-time signer registration** (requires the contract owner's private key):

```bash
# Testnet — replace <signerAddress> and <ownerPrivateKey>
cast send 0x33e5E5B262e5d8eBC443E1c6c9F14215b020554d \
  "setKeeper(address,bool)" <signerAddress> true \
  --rpc-url https://evmtestnet.confluxrpc.com \
  --private-key <ownerPrivateKey>

# Mainnet — replace <signerAddress> and <ownerPrivateKey>
cast send 0x9D5B131e5bA37A238cd1C485E2D9d7c2A68E1d0F \
  "setKeeper(address,bool)" <signerAddress> true \
  --rpc-url https://evm.confluxrpc.com \
  --private-key <ownerPrivateKey>
```

Then enable the keeper in `apps/backend/.env`:

```bash
KEEPER_ENABLED=true
SIGNER_PRIVATE_KEY=0xYOUR_FUNDED_TESTNET_SIGNER_KEY
```

Restart the backend. The keeper polls every 15 seconds (configurable via `KEEPER_INTERVAL_MS`).

---

## Backend API surface

All job routes require a `Bearer <token>` header obtained from `POST /auth/verify`.
Admin routes additionally require the caller's address to be listed in `ADMIN_ADDRESSES`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Liveness probe |
| GET | `/auth/nonce` | — | Get a SIWE nonce for `?address=0x…` |
| POST | `/auth/verify` | — | Verify SIWE message + signature, return session token |
| GET | `/auth/me` | Bearer | Return the authenticated address |
| GET | `/jobs` | Bearer | List jobs for the authenticated user |
| GET | `/jobs/updates` | Bearer | Poll for job updates since a timestamp |
| POST | `/jobs` | Bearer | Create a new automation job |
| GET | `/jobs/:id` | Bearer | Get a single job |
| POST | `/jobs/:id/cancel` | Bearer | Cancel a job (sets status to `cancelled`) |
| DELETE | `/jobs/:id` | Bearer | Hard-delete a job record |
| GET | `/jobs/:id/executions` | Bearer | List execution history for a job |
| GET | `/admin/status` | Bearer + Admin | Keeper status (enabled, running, last tick) |
| POST | `/admin/pause` | Bearer + Admin | Pause keeper execution |
| POST | `/admin/resume` | Bearer + Admin | Resume keeper execution |
| GET | `/admin/jobs` | Bearer + Admin | List all jobs across all users |
| GET | `/admin/safety` | Bearer + Admin | Get safety config (gas cap, concurrency) |
| PATCH | `/admin/safety` | Bearer + Admin | Update safety config |
| GET | `/pools` | — | List tradeable token pairs and metadata |
| POST | `/pools/refresh` | — | Force-refresh the pools cache |
| GET | `/sse/jobs` | Bearer | Server-Sent Events stream for real-time job updates |
| GET | `/system/status` | — | System status: network, contracts, keeper health |

---

## Environment variables

### Backend (`apps/backend/.env`)

Copy `apps/backend/.env.example` to `apps/backend/.env` and source it before running `dev`.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | number | `3011` | TCP port |
| `CAS_BACKEND_HOST` | string | `0.0.0.0` | Bind address |
| `CAS_SQLITE_PATH` | string | `../../.data/cas-dev.sqlite` | SQLite file path |
| `CAS_AUTH_SECRET` | string | `cas-local-dev-secret` | SIWE session signing key |
| `CAS_SESSION_TTL_MS` | number | `86400000` | Session token lifetime (ms) |
| `CAS_NONCE_TTL_MS` | number | `300000` | SIWE nonce expiry (ms) |
| `CAS_CORS_ORIGINS` | string | _(allow all)_ | Comma-separated allowed origins |
| `NETWORK` | `testnet`\|`mainnet` | `mainnet` | Target Conflux eSpace network |
| `CONFLUX_ESPACE_RPC` | string | _(public endpoint)_ | JSON-RPC URL |
| `AUTOMATION_MANAGER_ADDRESS` | address | _(per NETWORK)_ | AutomationManager contract |
| `PRICE_ADAPTER_ADDRESS` | address | _(per NETWORK)_ | SwappiPriceAdapter contract |
| `PERMIT_HANDLER_ADDRESS` | address | _(per NETWORK)_ | PermitHandler contract |
| `SWAPPI_ROUTER_ADDRESS` | address | _(optional)_ | Swappi DEX router |
| `ADMIN_ADDRESSES` | string | _(empty = no admins)_ | Comma-separated admin addresses |
| `POOLS_CACHE_TTL_MS` | number | `1800000` | Pool list cache lifetime (ms) |
| `PRICE_SOURCE` | `swappi`\|`gecko_terminal` | `swappi` | Price feed source |
| `KEEPER_ENABLED` | boolean | `false` | Enable embedded keeper worker |
| `SIGNER_PRIVATE_KEY` | hex | _(none)_ | Keeper signer key — never commit |
| `KEEPER_INTERVAL_MS` | number | `15000` | Keeper poll interval (ms) |
| `KEEPER_CONCURRENCY` | number | `1` | Max concurrent job executions |
| `MAX_GAS_PRICE_GWEI` | number | `500` | Gas price ceiling (Gwei) |

### Frontend (`apps/frontend/.env.local`)

Copy `apps/frontend/.env.local.example` to `apps/frontend/.env.local`.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_CAS_API_URL` | string | `http://127.0.0.1:3011` | Backend base URL |
| `NEXT_PUBLIC_CAS_NETWORK` | `testnet`\|`mainnet`\|`local` | `mainnet` | eSpace network for wallet |
| `NEXT_PUBLIC_AUTOMATION_MANAGER_ADDRESS` | address | _(mainnet)_ | AutomationManager contract |
| `NEXT_PUBLIC_WCFX_ADDRESS` | address | _(mainnet)_ | Wrapped CFX contract |
| `NEXT_PUBLIC_CONFLUX_ESPACE_RPC` | string | _(per network)_ | RPC URL for wallet interactions |

---

## Deployed contract addresses

| Contract | Testnet (71) | Mainnet (1030) |
|----------|-------------|----------------|
| AutomationManager | `0x33e5E5B262e5d8eBC443E1c6c9F14215b020554d` | `0x9D5B131e5bA37A238cd1C485E2D9d7c2A68E1d0F` |
| PermitHandler | `0x4240882f2d9d70cdb9fbcc859cdd4d3e59f5d137` | `0x0D566aC9Dd1e20Fc63990bEEf6e8abBA876c896B` |
| SwappiPriceAdapter | `0x88C48e0E8F76493Bb926131a2BE779cc17ecBEdF` | `0xD2Cc2a7Eb4A5792cE6383CcD0f789C1A9c48ECf9` |
| Swappi Router | `0x62B0873055Bf896Dd869e172119871ac24aeA305` | `0x62B0873055Bf896Dd869e172119871ac24aeA305` |
| WCFX | `0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8` | `0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b` |

---

## Setup wizard — development & testing

The interactive wizard lives in `packages/setup/`. Its unit tests cover the orchestrator, the
Node version / RPC-connectivity checks, and the env-file generation.

```bash
# Run wizard unit tests
pnpm --filter @cfxdevkit/cas-setup test

# Type-check without building
pnpm --filter @cfxdevkit/cas-setup typecheck

# Build the CLI (required before pnpm setup)
pnpm --filter @cfxdevkit/cas-setup build

# Run the wizard (from projects/cas/)
cd projects/cas && pnpm setup
# Or force-overwrite existing env files:
cd projects/cas && pnpm setup -- --force
```

Test files:

| File | What it covers |
|------|----------------|
| `packages/setup/src/wizard.test.ts` | Orchestrator phase order and state accumulation |
| `packages/setup/src/steps/check-env.test.ts` | Node version guard, RPC connectivity with mocked fetch |
| `packages/setup/src/steps/write-env.test.ts` | Generated `.env` content for testnet / mainnet / keeper scenarios |

