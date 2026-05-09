# projects/cas — Conflux Automation Site

**Status:** Local-dev testable slice in progress.

CAS is being rebuilt on top of reusable framework packages. The first implementation targets a
SQLite-backed local developer experience, with production persistence and worker rollout kept for a
later checkpoint.

**Apps**
- `apps/backend/` — Express API for health, SIWE auth, jobs, and execution history.
- `apps/frontend/` — Next.js 16 local UI for auth, order creation, job lists, cancel, and execution history.
- `apps/worker/` — planned keeper process that executes automation strategies.

**Packages**
- `packages/shared/` — CAS API/domain DTOs and HTTP client shared by backend and frontend.

**Framework usage**
- `@cfxdevkit/automation` — SQLite schema plus job/execution repositories.
- `@cfxdevkit/services/auth` — reusable nonce/session-token helpers.
- `@cfxdevkit/wallet-connect/siwe` — canonical SIWE parsing and verification.
- `@cfxdevkit/wallet-connect` — frontend wallet layer, without ConnectKit.

**Backend local dev**
- Default port: `3011`.
- Default bind host: `0.0.0.0`.
- Default SQLite path: `projects/cas/.data/cas-dev.sqlite`.
- Important env vars: `CAS_SQLITE_PATH`, `CAS_AUTH_SECRET`, `CAS_SESSION_TTL_MS`,
    `CAS_NONCE_TTL_MS`, `CAS_CORS_ORIGIN`, `CAS_BACKEND_HOST`.

**Frontend local dev**
- Default port: `3010`.
- Default API base: `http://127.0.0.1:3011`.
- Override API base with `NEXT_PUBLIC_CAS_API_URL` or from the UI toolbar.
- The UI signs in through a browser EVM provider using SIWE; it does not use ConnectKit.

**Local test flow**
1. Build shared contracts once: `pnpm --filter @cfxdevkit/cas-shared build`.
2. Start the backend: `pnpm --filter @cfxdevkit/cas-backend dev`.
3. Start the frontend: `pnpm --filter @cfxdevkit/cas-frontend dev`.
4. Open `http://127.0.0.1:3010`, sign in with an injected EVM wallet, create a swap/limit/DCA/TWAP job, refresh the jobs table, then cancel or inspect executions.

**Current API surface**
- `GET /health`
- `GET /auth/nonce?address=0x...`
- `POST /auth/verify`
- `GET /auth/me`
- `GET /jobs`
- `GET /jobs/updates?since=0`
- `POST /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/cancel`
- `GET /jobs/:id/executions`

**Migration notes**
- Keep CAS-specific API shapes in `packages/shared` until they become generally useful.
- Promote reusable backend primitives into framework packages instead of duplicating showcase code.
- Worker integration still migrates last, after the backend and UI contracts stabilize.
