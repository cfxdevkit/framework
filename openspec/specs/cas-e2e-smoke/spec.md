## ADDED Requirements

### Requirement: E2E smoke test covers full automation workflow
The backend `app.test.ts` SHALL include an integration test that exercises the complete user workflow: SIWE authentication → job creation → SSE snapshot → job cancellation → job deletion.

#### Scenario: Full workflow passes
- **WHEN** the smoke test runs against an in-memory SQLite CAS backend
- **THEN** all steps SHALL complete without error: nonce issued, SIWE signed, token returned, job created, SSE snapshot received, job cancelled, job deleted

#### Scenario: Auth failures return 401
- **WHEN** a request is made without a valid bearer token
- **THEN** the backend SHALL return `401` for all protected routes (`/jobs`, `/admin/*`)

#### Scenario: Admin routes reject non-admin
- **WHEN** a non-admin authenticated user calls `POST /admin/pause`
- **THEN** the backend SHALL return `403`

#### Scenario: Job delete removes from list
- **WHEN** a job is deleted via `DELETE /jobs/:id`
- **THEN** a subsequent `GET /jobs` for that owner SHALL not include the deleted job

### Requirement: E2E smoke test covers SIWE success flow
The backend smoke test SHALL verify that a correctly signed SIWE message results in a valid JWT.

#### Scenario: SIWE success returns JWT
- **WHEN** the test derives a SIWE message from the backend nonce and signs it with a valid test private key
- **THEN** `POST /auth/verify` SHALL return a JWT token with status 200

#### Scenario: SIWE verify rejects wrong chainId
- **WHEN** the SIWE message is constructed with a chainId that does not match the backend's configured NETWORK
- **THEN** `POST /auth/verify` SHALL return status 401

#### Scenario: SIWE verify rejects tampered message
- **WHEN** the SIWE message body is modified after signing (signature mismatch)
- **THEN** `POST /auth/verify` SHALL return status 401

#### Scenario: Safety config roundtrip
- **WHEN** an admin patches `{ slippageBps: 75 }` via `PATCH /admin/safety`
- **THEN** a subsequent `GET /admin/safety` SHALL return `slippageBps: 75`

### Requirement: End-to-end smoke test prerequisites are documented
The smoke test scenario SHALL document all prerequisites required for a real testnet run, not just the unit-test-level mock scenarios. This extends the existing smoke test spec to cover the operational prerequisites.

#### Scenario: Developer reads e2e smoke test prerequisites
- **WHEN** a developer wants to run the full end-to-end smoke test on testnet
- **THEN** the prerequisites are documented: testnet CFX for the user wallet, testnet USDT or WCFX for `tokenIn`, a registered keeper address, `ADMIN_ADDRESSES` configured, and both backend and frontend running

#### Scenario: Keeper must be registered before executions succeed
- **WHEN** the keeper processes a job and submits `executeLimitOrder` or `executeDCATick`
- **THEN** the transaction succeeds only if the signer address was previously registered via `setKeeper(signerAddress, true)` by the contract owner; otherwise it reverts with `Unauthorized`

#### Scenario: System status endpoint reflects keeper health
- **WHEN** the keeper has processed at least one heartbeat cycle
- **THEN** `GET /system/status` returns `worker.status: "running"` and `worker.lastSeenAt` is within the last `keeperIntervalMs` milliseconds
