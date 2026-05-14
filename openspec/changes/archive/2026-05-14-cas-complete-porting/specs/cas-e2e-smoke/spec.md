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

#### Scenario: Safety config roundtrip
- **WHEN** an admin patches `{ slippageBps: 75 }` via `PATCH /admin/safety`
- **THEN** a subsequent `GET /admin/safety` SHALL return `slippageBps: 75`
