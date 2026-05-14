## Context

The CAS project has two `.env` files that must be created before the app can run: `apps/backend/.env` and `apps/frontend/.env.local`. The README documents the required variables, but there is no automated path from a blank checkout to a running instance. Users must manually cross-reference contract addresses, choose a network, optionally configure keeper mode, and launch two separate processes.

The wizard package lives at `projects/cas/packages/setup/` as `@cfxdevkit/cas-setup`. It is a Node.js CLI built with TypeScript, compiled to CJS with `tsup`, and run with `node`. No compilation step is required at runtime — the package ships compiled JS. The wizard is invoked via `pnpm setup` from `projects/cas/` or via the `bin` entry.

The wizard state flows linearly through phases. Each phase is a pure function `(state: WizardState) => Promise<WizardState>` that reads prompts, performs checks, and returns an updated state. This makes each phase independently unit-testable with mocked prompts and mocked chain reads.

Key external dependencies (resolved at runtime from the monorepo):
- `@inquirer/prompts` — interactive CLI prompts (input, select, confirm, password)
- `viem` — already in the monorepo, used for contract reads/writes
- `@cfxdevkit/contracts/deploy` — `deployContract()` for fresh local devnode deploys
- `@cfxdevkit/contracts/write` — `sendWrite()` / `waitForReceipt()` for `setKeeper()`
- `@cfxdevkit/protocol` — `automationManagerBytecode`, `automationManagerAbi`, `automationManagerAddress`, etc.
- `commander` — CLI argument parsing

## Goals / Non-Goals

**Goals:**
- Interactive wizard that writes both `.env` files correctly in one pass
- Network selection: testnet, mainnet, local devnode
- Contract mode: use canonical addresses (default) or deploy fresh (local only)
- Keeper configuration: optional, with on-chain verification before enabling
- Single-command launch after env files are written
- Each wizard phase is a pure, unit-testable function
- Never overwrite existing `.env` files without explicit confirmation

**Non-Goals:**
- Docker / Docker Compose orchestration (separate concern)
- Production deployment to remote servers (infrastructure is in `infrastructure/ansible/`)
- Upgrading or migrating existing SQLite databases
- Multi-tenant or multi-user setup (personal instance only)
- Installing Node / pnpm / system dependencies (wizard checks and errors if missing)

## Decisions

### D1: Package location — `projects/cas/packages/setup/`

**Decision**: New package at `projects/cas/packages/setup/` as `@cfxdevkit/cas-setup`.

**Rationale**: The wizard is CAS-specific. It reads paths relative to the `projects/cas/` root and it depends on `@cfxdevkit/protocol` and `@cfxdevkit/contracts`. Placing it inside the CAS project tree keeps it co-located with the apps it configures. Following the existing pattern (`packages/shared/`).

**Alternative considered**: Standalone package in `tools/`. Rejected — would require path resolution from outside the project and adds unnecessary abstraction.

### D2: Deploy via `@cfxdevkit/contracts/deploy` — no forge

**Decision**: Fresh contract deployment (local devnode only) uses `deployContract({ client, signer, abi, bytecode })` from `@cfxdevkit/contracts/deploy` with bytecode sourced from `@cfxdevkit/protocol`.

**Rationale**: The monorepo explicitly does not use forge or hardhat at runtime. `@cfxdevkit/contracts/deploy` is the framework-canonical deploy path. The bytecode is already compiled and embedded in `@cfxdevkit/protocol/dist/generated.ts` — no compilation step needed.

### D3: Keeper registration via `sendWrite` — no cast

**Decision**: `setKeeper(address, true)` is called programmatically using `sendWrite()` from `@cfxdevkit/contracts/write` with the AutomationManager ABI. The user provides the owner's private key at the prompt (masked); it is used only for this transaction and never written to disk.

**Rationale**: `cast send` is not available in the monorepo environment. The framework's write path handles the full sign → broadcast → receipt cycle.

**Security note**: The owner private key is read via `password()` prompt, stored only in memory during the wizard session, and discarded after the transaction. It is never persisted.

### D4: `.env` write with confirmation guard

**Decision**: Before writing, the wizard checks whether the target file exists. If it does, it prompts "Overwrite existing .env? [y/N]". A `--force` flag skips the prompt for CI/scripted use.

**Rationale**: Prevents accidental loss of a hand-crafted `.env` containing production secrets.

### D5: Launch as child process supervisor (not pm2)

**Decision**: The wizard spawns `pnpm --filter @cfxdevkit/cas-backend start` and `pnpm --filter @cfxdevkit/cas-frontend start` as Node `child_process.spawn()` calls. Log lines are prefixed `[backend]` / `[frontend]` and streamed to stdout. The wizard process stays alive until Ctrl+C.

**Rationale**: Using `pm2` or similar requires an additional global install. A simple subprocess supervisor is self-contained, transparent, and sufficient for a personal instance. VPS operators who want persistent background processes can layer pm2 or systemd on top.

### D6: WizardState is a typed plain object

**Decision**: `WizardState` is a `type` (not a class), passed immutably through each phase. Each step returns a new partial state merged with spread.

**Rationale**: Pure functions are easy to test. No shared mutable state between phases.

## Risks / Trade-offs

- **[Private key in memory]** → The owner private key for `setKeeper()` is held in process memory during the wizard. For personal use this is acceptable. Mitigation: key is discarded immediately after the transaction receipt is confirmed; not logged.
- **[Local devnode addresses]** → Deployed contract addresses on a local devnode are non-deterministic. Mitigation: wizard captures addresses from deploy receipts and writes them directly into `.env`.
- **[pnpm workspace resolution]** → `@cfxdevkit/contracts` and `@cfxdevkit/protocol` must be resolvable from `packages/setup/`. Mitigation: add them as `devDependencies` with workspace protocol (`workspace:*`).
- **[TTY requirement]** → `@inquirer/prompts` requires a TTY. Running the wizard non-interactively (e.g., inside a Docker build) fails. Mitigation: document this; `--force` flag + environment variable overrides can be added in a later change for fully headless setup.

## Migration Plan

1. Create `projects/cas/packages/setup/` with `package.json`, `tsconfig.json`, `tsup.config.ts`
2. Implement wizard phases in dependency order: env-check → network-select → contract-mode → keeper-config → env-write → launch
3. Add `setup` script to `projects/cas/package.json`
4. Register `packages/setup` in the workspace
5. No migration of existing `.env` files needed — wizard generates fresh ones; existing files are guarded by the overwrite confirmation.
