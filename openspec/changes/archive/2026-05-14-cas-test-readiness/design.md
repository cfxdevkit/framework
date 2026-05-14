## Context

CAS is a fully implemented DeFi automation system with a working Express backend, Next.js frontend, embedded keeper worker, and contracts deployed on both Conflux eSpace testnet (chain 71) and mainnet (chain 1030). The code is complete but has no configuration files and outdated documentation, making it impossible to start without reading source code. One critical undocumented prerequisite exists: the keeper's signer address must be registered with the `AutomationManager` contract before executions are processed.

**Deployed contract addresses (from `@cfxdevkit/automation` and `@cfxdevkit/protocol`):**

| Contract | Testnet (71) | Mainnet (1030) |
|---|---|---|
| AutomationManager | `0x33e5E5B262e5d8eBC443E1c6c9F14215b020554d` | `0x9D5B131e5bA37A238cd1C485E2D9d7c2A68E1d0F` |
| PermitHandler | `0x4240882f2d9d70cdb9fbcc859cdd4d3e59f5d137` | `0x0D566aC9Dd1e20Fc63990bEEf6e8abBA876c896B` |
| SwappiPriceAdapter | `0x88C48e0E8F76493Bb926131a2BE779cc17ecBEdF` | `0xD2Cc2a7Eb4A5792cE6383CcD0f789C1A9c48ECf9` |
| Swappi Router | `0x62B0873055Bf896Dd869e172119871ac24aeA305` | `0x62B0873055Bf896Dd869e172119871ac24aeA305` |

## Goals / Non-Goals

**Goals:**
- Any developer can `git clone` the project and start both services within 5 minutes by following the README
- All environment variables documented in `.env.example` files with comments
- Keeper prerequisites (signer registration, testnet CFX) documented with concrete commands
- Stale docs (`STRUCTURE.md`, `README.md`, `CHANGELOG.md`) fully corrected

**Non-Goals:**
- UI/UX changes (separate change)
- New features or behavior changes
- Deployment infrastructure (Docker, CI/CD)
- Contract changes or redeployment

## Decisions

### `.env.example` format
Use shell-comment style (`# KEY=value`) for variables that are safe to leave unset (optional/derived from defaults), and `KEY=value` for variables that always need to be provided. This is the most widely recognized convention for dotenv files.

### Backend env file location
Place at `projects/cas/apps/backend/.env.example` — colocated with the app that consumes it. Developers copy to `.env` and `tsx` will auto-load it in dev mode via `dotenv`.

Actually: `tsx watch src/index.ts` does **not** automatically load `.env`. The README must instruct developers to either `export` vars or use `dotenv-cli` / a `.env` loader. The simplest guidance is: copy `.env.example` to `.env` and run `set -a; source .env; set +a` before starting, or use `dotenv -e .env -- pnpm dev`.

### Keeper registration documentation
The `setKeeper(address, bool)` call requires the contract owner's private key. Document this as a one-time setup step that the system operator must perform, and note that without it the keeper will broadcast transactions that revert with `Unauthorized`. Include the cast/viem command to call `setKeeper`.

### STRUCTURE.md approach
Rewrite from scratch matching the actual file tree (`backend/`, `frontend/`, `shared/` — no `worker/`, no `contracts/`, no `e2e/`). The embedded keeper in `backend/src/worker.ts` is noted inline.

## Risks / Trade-offs

- [Risk] `.env.example` contains testnet/mainnet contract addresses — they're already public on-chain, no secret exposure risk
- [Risk] `SIGNER_PRIVATE_KEY` documentation could encourage committing secrets → Mitigation: add `.env` to `.gitignore` note in README and comment in `.env.example`
- [Risk] Keeper registration requires contract owner involvement — developer cannot self-serve → Mitigation: clearly document who must do this and what happens if skipped (worker logs but txs revert)

## Open Questions

- Should the README include a `cast` CLI example for `setKeeper` registration, or just describe it conceptually? → Lean toward including `cast send` example for concreteness.
- Should testnet WCFX address be included in frontend `.env.local.example`? → Yes, it's a public address sourced from `@cfxdevkit/protocol`.
