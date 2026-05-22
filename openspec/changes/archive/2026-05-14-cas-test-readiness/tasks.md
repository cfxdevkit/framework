## 1. Backend env example file

- [x] 1.1 Create `projects/cas/apps/backend/.env.example` with all 17 config variables from `resolveCasBackendConfig()` — use testnet contract addresses as defaults, comment out `SIGNER_PRIVATE_KEY` with a warning, set `KEEPER_ENABLED=false` by default, and include inline comments for every variable
- [x] 1.2 Verify `projects/cas/apps/backend/.gitignore` (or root `.gitignore`) excludes `.env` — add entry if missing

## 2. Frontend env example file

- [x] 2.1 Create `projects/cas/apps/frontend/.env.local.example` with all 4 `NEXT_PUBLIC_*` variables — `NEXT_PUBLIC_CAS_API_URL`, `NEXT_PUBLIC_AUTOMATION_MANAGER_ADDRESS`, `NEXT_PUBLIC_WCFX_ADDRESS`, `NEXT_PUBLIC_CONFLUX_ESPACE_RPC` — pre-filled with testnet values and inline comments
- [x] 2.2 Verify `projects/cas/apps/frontend/.gitignore` excludes `.env.local` — add entry if missing

## 3. README rewrite

- [x] 3.1 Replace the outdated API surface table in `projects/cas/README.md` with the full 18-route list grouped by domain (health, auth, jobs, admin, pools, system, sse), noting auth requirements per route
- [x] 3.2 Add a complete env var reference table (backend + frontend vars, types, defaults, descriptions)
- [x] 3.3 Add a "No-keeper mode" run section: build shared, start backend, start frontend, open browser, connect wallet, create job, observe dashboard
- [x] 3.4 Add a "Keeper mode" run section: fund signer with testnet CFX, set `KEEPER_ENABLED=true` + `SIGNER_PRIVATE_KEY`, register signer via `cast send <automationManagerAddress> "setKeeper(address,bool)" <signerAddress> true --rpc-url https://evmtestnet.confluxrpc.com --private-key <ownerKey>`, restart backend, observe job execution in dashboard
- [x] 3.5 Update the "Current API surface" section header to match new content (or remove legacy section)

## 4. STRUCTURE.md rewrite

- [x] 4.1 Rewrite `projects/cas/STRUCTURE.md` to reflect the actual directory tree — `apps/backend/src/` with all real files listed (including `worker.ts` noted as embedded keeper), `apps/frontend/src/` with actual component/page/hook files, `packages/shared/src/` with actual files — remove all references to `apps/worker/`, `contracts/`, and `e2e/`

## 5. CHANGELOG update

- [x] 5.1 Document in `projects/cas/README.md` the features added during the porting work: `DELETE /jobs/:id` hard-delete route, `GET|PATCH /admin/safety` safety config API, `ApprovalWidget` ERC-20 allowance manager panel, token symbol+logo display in JobsTable, Next.js API proxy at `app/api/[...path]/route.ts`
