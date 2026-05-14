## ADDED Requirements

### Requirement: Backend environment example file exists
The repository SHALL provide `projects/cas/apps/backend/.env.example` containing every environment variable consumed by `resolveCasBackendConfig()`, with the testnet contract addresses pre-filled as defaults and inline comments explaining each variable.

#### Scenario: Developer copies file and starts backend
- **WHEN** a developer copies `.env.example` to `.env` and sources it before running `pnpm --filter @cfxdevkit/cas-backend dev`
- **THEN** the backend starts without missing-config errors on testnet network with keeper disabled by default

#### Scenario: Keeper variables are present but disabled by default
- **WHEN** a developer opens `.env.example`
- **THEN** `KEEPER_ENABLED` is set to `false` (or commented out) and `SIGNER_PRIVATE_KEY` is present with a placeholder comment warning against committing real keys

#### Scenario: All 16 config variables are documented
- **WHEN** a developer reads `.env.example`
- **THEN** every variable in `CasBackendConfig` has a corresponding entry: `PORT`, `CAS_BACKEND_HOST`, `CAS_SQLITE_PATH`, `CAS_AUTH_SECRET`, `CAS_CORS_ORIGINS`, `NETWORK`, `CONFLUX_ESPACE_RPC`, `AUTOMATION_MANAGER_ADDRESS`, `PRICE_ADAPTER_ADDRESS`, `PERMIT_HANDLER_ADDRESS`, `ADMIN_ADDRESSES`, `KEEPER_ENABLED`, `SIGNER_PRIVATE_KEY`, `KEEPER_INTERVAL_MS`, `KEEPER_CONCURRENCY`, `PRICE_SOURCE`, `MAX_GAS_PRICE_GWEI`

### Requirement: Frontend environment example file exists
The repository SHALL provide `projects/cas/apps/frontend/.env.local.example` containing every `NEXT_PUBLIC_*` variable consumed by the frontend, with testnet values pre-filled.

#### Scenario: Developer copies file and starts frontend
- **WHEN** a developer copies `.env.local.example` to `.env.local` and runs `pnpm --filter @cfxdevkit/cas-frontend dev`
- **THEN** the frontend connects to the backend and uses the correct testnet contract addresses without manual editing

#### Scenario: All frontend env vars documented
- **WHEN** a developer opens `.env.local.example`
- **THEN** all variables are present: `NEXT_PUBLIC_CAS_API_URL`, `NEXT_PUBLIC_AUTOMATION_MANAGER_ADDRESS`, `NEXT_PUBLIC_WCFX_ADDRESS`, `NEXT_PUBLIC_CONFLUX_ESPACE_RPC`

### Requirement: .gitignore excludes .env files
The repository SHALL ensure `.env` and `.env.local` are listed in the CAS app `.gitignore` files so real secrets cannot be accidentally committed.

#### Scenario: Real env files are gitignored
- **WHEN** a developer creates `apps/backend/.env` or `apps/frontend/.env.local`
- **THEN** `git status` does not show those files as untracked
