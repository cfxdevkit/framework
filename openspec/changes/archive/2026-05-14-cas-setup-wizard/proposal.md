## Why

Setting up a CAS instance requires manually creating two `.env` files, selecting the correct contract addresses for the target network, optionally deploying fresh contracts to a local devnode, and optionally registering a keeper signer — all documented only in README prose. There is no guided path from zero to a running instance. A CLI wizard eliminates setup errors and makes self-hosting accessible for VPS operators and local developers.

## What Changes

- New package `@cfxdevkit/cas-setup` at `projects/cas/packages/setup/`
- CLI entrypoint (`pnpm cas:setup` or `npx @cfxdevkit/cas-setup`) that runs an interactive wizard
- Wizard phases: environment check → network selection → contract mode → keeper config → admin config → write `.env` files → build → launch
- Contract deployment in "local devnode" mode uses `@cfxdevkit/contracts/deploy` with bytecode from `@cfxdevkit/protocol` (no forge, no hardhat, no cast)
- Keeper registration (`setKeeper(address, bool)`) uses `@cfxdevkit/contracts/write` — no external tools
- Single-command launch: after writing env files, the wizard spawns `backend` and `frontend` as child processes, streams their logs, and stays alive as a supervisor
- `projects/cas/package.json` gains a `setup` script wired to the new package's bin entry

## Capabilities

### New Capabilities

- `cas-wizard-env-check`: Phase 1 — verify Node version, pnpm version, and that the target RPC URL is reachable
- `cas-wizard-network-select`: Phase 2 — choose testnet / mainnet / local-devnode; resolves the default RPC URL and canonical contract addresses for the chosen network
- `cas-wizard-contract-mode`: Phase 3 — use canonical deployed contracts (default) or deploy fresh (local devnode only); fresh deploy calls `deployContract()` from `@cfxdevkit/contracts/deploy`
- `cas-wizard-keeper-config`: Phase 4 — optionally enable keeper mode; prompts for `SIGNER_PRIVATE_KEY`, derives address, checks on-chain `isKeeper()`, and calls `setKeeper(address, true)` if needed using the owner's key
- `cas-wizard-env-write`: Phase 5 — writes `apps/backend/.env` and `apps/frontend/.env.local` from collected wizard state; never overwrites without confirmation
- `cas-wizard-launch`: Phase 6 — builds shared package, then spawns backend and frontend as supervised child processes with merged log output

### Modified Capabilities

## Impact

- New: `projects/cas/packages/setup/` — TypeScript CLI package
- New: `projects/cas/packages/setup/src/index.ts` — commander entrypoint
- New: `projects/cas/packages/setup/src/wizard.ts` — state machine orchestrator
- New: `projects/cas/packages/setup/src/steps/` — one module per wizard phase
- New: `projects/cas/packages/setup/src/chain/read.ts` — on-chain reads (isKeeper, balance)
- New: `projects/cas/packages/setup/src/runner.ts` — process supervisor
- `projects/cas/package.json` — add `setup` script
- `projects/cas/pnpm-workspace.yaml` (or monorepo root) — add `packages/setup` to workspace
- Dependencies: `@inquirer/prompts`, `viem`, `@cfxdevkit/contracts`, `@cfxdevkit/protocol`, `commander`
