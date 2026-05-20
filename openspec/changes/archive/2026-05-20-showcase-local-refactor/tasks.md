## 1. Helper and Metadata Cleanup

- [x] 1.1 Trim `app/keystore/client.ts` down to the live helpers that are still used.
- [x] 1.2 Split or trim `lib/showcase-guide.ts` so snippet constants remain and deprecated guide metadata is removed.
- [x] 1.3 Remove unused exports and constants such as `readRuntimeActiveSigner()`, `DEFAULT_PASSPHRASE`, and the dead keystore style helpers.

## 2. Workspace Architecture Verification

- [x] 2.1 Verify `ShowcaseWorkspacePanelsProps` remains the canonical panel contract for runtime data and actions.
- [x] 2.2 Verify `accounts` and `reveal` are registered in `app/panels/registry.ts` and remain wired through the workspace flow.
- [x] 2.3 Remove `resolveWorkspaceSteps()` and any remaining stale tutorial/navigation helpers.
- [x] 2.4 Add or update local architecture guidance so future work follows the shared panel orchestration pattern.

## 3. Validation

- [x] 3.1 Run typecheck for the affected workspace after the trims.
- [x] 3.2 Run `pnpm check:unused` and confirm the targeted dead exports/helpers disappear from the report.
	- `pnpm check:unused` reports no remaining `projects/examples/apps/showcase-local` findings; unrelated workspace findings remain outside this change.
- [x] 3.3 Exercise the accounts faucet flow and the two-step reveal flow after the cleanup to confirm the live panels still behave correctly.
	- `/api/devnode/accounts` returns seeded accounts and a faucet; `/api/devnode/accounts/fund` reaches the runtime but the local node rejected the transaction as `transaction underpriced` in this environment.
	- With an isolated temporary keystore path, setup, unlock, wallet create, reveal request, and reveal consume all returned `200`/`ok=true`.
