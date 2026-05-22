## ADDED Requirements

### Requirement: README contains accurate and complete API surface
The `projects/cas/README.md` SHALL list all 18+ backend API routes with their HTTP method, path, and authentication requirement.

#### Scenario: Developer finds the admin safety route
- **WHEN** a developer reads the README API surface section
- **THEN** `GET /admin/safety` and `PATCH /admin/safety` are listed with "requires admin bearer token" noted

#### Scenario: DELETE /jobs/:id is documented
- **WHEN** a developer reads the README
- **THEN** `DELETE /jobs/:id` is listed and distinguished from `POST /jobs/:id/cancel`

### Requirement: README documents all environment variables
The `projects/cas/README.md` SHALL contain a reference table of all backend and frontend environment variables with their type, default value, and description.

#### Scenario: Developer finds ADMIN_ADDRESSES documentation
- **WHEN** a developer reads the README env vars section
- **THEN** `ADMIN_ADDRESSES` is listed with: comma-separated list of lowercase hex addresses, no default (empty = no admins), and a note that the UI will 403 on all admin routes without this set

### Requirement: README documents keeper operational modes
The `projects/cas/README.md` SHALL describe two distinct operational modes: no-keeper mode (default) and keeper mode, with the exact env vars and prerequisite steps for each.

#### Scenario: Developer reads keeper setup section
- **WHEN** a developer wants to enable the keeper
- **THEN** the README lists in order: (1) fund a signer account with testnet CFX, (2) set `KEEPER_ENABLED=true` and `SIGNER_PRIVATE_KEY=0x...`, (3) register the signer with `setKeeper(address, true)` on the contract, and (4) restart the backend

#### Scenario: Keeper registration command is present
- **WHEN** a developer reads the keeper section
- **THEN** a `cast send` or equivalent command is shown for calling `setKeeper(address, true)` on the deployed AutomationManager

### Requirement: STRUCTURE.md reflects actual project structure
The `projects/cas/STRUCTURE.md` SHALL describe only what actually exists: `apps/backend/`, `apps/frontend/`, and `packages/shared/`. References to `apps/worker/`, `contracts/`, and `e2e/` SHALL be removed.

#### Scenario: Developer reads STRUCTURE.md
- **WHEN** a developer reads STRUCTURE.md
- **THEN** every directory and file mentioned exists on disk

#### Scenario: Embedded keeper is noted correctly
- **WHEN** a developer reads STRUCTURE.md
- **THEN** `apps/backend/src/worker.ts` is listed and described as the embedded keeper factory

### Requirement: CHANGELOG documents cas-complete-porting features
The `projects/cas/README.md` SHALL document the features added during the porting work: DELETE job route, safety config API, ApprovalWidget, token display, API proxy.

#### Scenario: Developer reads CHANGELOG to understand recent changes
- **WHEN** a developer reads CHANGELOG.md
- **THEN** an entry dated 2026-05-14 (or similar) lists: hard-delete route, admin safety config endpoints, ApprovalWidget, token symbol/logo in JobsTable, Next.js API proxy
