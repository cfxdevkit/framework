## 1. Backend: Job Delete Route

- [x] 1.1 Add `DELETE /jobs/:id` handler to `projects/cas/apps/backend/src/routes/jobs.ts` — authenticate session, verify owner or admin, delete row, return job DTO
- [x] 1.2 Add `deleteJob(id)` method to `CasApiClient` in `projects/cas/packages/shared/src/client.ts`

## 2. Backend: Safety Config

- [x] 2.1 Add typed getters (`getMaxSwapUsd`, `getSlippageBps`, `getMaxRetries`) and setters to `SqliteSettingsStore` in `projects/cas/apps/backend/src/db/sqlite.ts`
- [x] 2.2 Add `CasSafetyConfigResponse` and `CasSafetyConfigPatchRequest` types to `projects/cas/packages/shared/src/admin.ts`
- [x] 2.3 Add `GET /admin/safety` and `PATCH /admin/safety` routes to `projects/cas/apps/backend/src/routes/admin.ts`
- [x] 2.4 Add `adminSafetyConfig()` and `adminPatchSafetyConfig(patch)` methods to `CasApiClient`
- [x] 2.5 Export new types from `projects/cas/packages/shared/src/index.ts`

## 3. Frontend: Token Display in JobsTable

- [x] 3.1 Import `usePoolsContext` in `projects/cas/apps/frontend/src/components/JobsTable.tsx`
- [x] 3.2 Build a `tokenMeta(address)` lookup helper from the pools context `tokens` array
- [x] 3.3 Replace raw address abbreviation with `<TokenChip>` inline component (symbol + logo, fallback to abbrev) in `JobCard`
- [x] 3.4 Handle logo load errors via `onError` hiding the image

## 4. Frontend: ApprovalWidget

- [x] 4.1 Create `projects/cas/apps/frontend/src/components/ApprovalWidget.tsx` — reads jobs from props, batches `allowance` calls via wagmi `useReadContracts`, renders one row per unique `tokenIn`
- [x] 4.2 Show current allowance, committed amount, symbol+logo from pools context
- [x] 4.3 Implement "Revoke" button (set allowance to 0) using `useWriteContract`
- [x] 4.4 Implement "Set Exact" button (set allowance to committed amount) using `useWriteContract`
- [x] 4.5 Disable Revoke when allowance = 0; disable Set Exact when allowance = committed amount
- [x] 4.6 Handle Multicall3 availability check — fall back to individual calls if batch fails
- [x] 4.7 Wire `ApprovalWidget` into `CasConsole` (dashboard) below the `JobsTable`

## 5. Frontend: Safety Config Panel

- [x] 5.1 Create `SafetyConfigForm` sub-component in `projects/cas/apps/frontend/src/components/SystemAdminPanel.tsx` with fields for `maxSwapUsd`, `slippageBps`, `maxRetries`
- [x] 5.2 Load current safety config on mount via `client.adminSafetyConfig()` (admin-only)
- [x] 5.3 Submit PATCH on save via `client.adminPatchSafetyConfig(patch)`
- [x] 5.4 Show validation error if `slippageBps` is out of range

## 6. Frontend: Next.js API Proxy

- [x] 6.1 Create `projects/cas/apps/frontend/src/app/api/[...path]/route.ts` with a universal handler for GET, POST, PUT, PATCH, DELETE, OPTIONS
- [x] 6.2 Forward Authorization header and request body to `NEXT_PUBLIC_CAS_API_URL`
- [x] 6.3 Redirect SSE path (`sse/`) to backend URL directly with 307
- [x] 6.4 Return 503 when `NEXT_PUBLIC_CAS_API_URL` is not configured

## 7. E2E Tests

- [x] 7.1 Extend `projects/cas/apps/backend/src/app.test.ts` with a full workflow test: nonce → verify → create job → GET jobs → cancel → DELETE
- [x] 7.2 Add test for `DELETE /jobs/:id` by non-owner returns 404
- [x] 7.3 Add test for `GET /admin/safety` returns defaults
- [x] 7.4 Add test for `PATCH /admin/safety` roundtrip
- [x] 7.5 Add test for admin-only enforcement on safety endpoints (non-admin gets 403)

## 8. Validation

- [x] 8.1 Run `pnpm exec moon run backend:typecheck` and fix any type errors
- [x] 8.2 Run `pnpm exec moon run frontend:typecheck` and fix any type errors
- [x] 8.3 Run `pnpm exec moon run backend:test` and confirm all tests pass
- [x] 8.4 Run `pnpm exec moon run shared:test` and confirm all tests pass
