## 1. Fix Linting Issues

- [ ] 1.1 Organize imports and exports in `tooling-cli` using Biome to resolve `tooling-cli:lint` error
- [ ] 1.2 Verify lint passes with `pnpm run lint`

## 2. Resolve Typecheck & Build Errors

- [ ] 2.1 Remove unused variable `iFK` in `cli/src/commands/keystore.ts` to fix TS6133 error
- [ ] 2.2 Add missing `repoCheckCommand` export to `llm-agents/workers/agents/check/types.ts`
- [ ] 2.3 Verify typecheck and build pass with `pnpm run typecheck` and `pnpm run build`

## 3. Address Code Hotspots

- [ ] 3.1 Document incremental refactoring plan for `keystore.ts` (590 lines) to address hard hotspot
- [ ] 3.2 Add hotspot note to project documentation and track in backlog for future PRs

## 4. Validate Fixes

- [ ] 4.1 Run full repo check suite (`pnpm run check`) to confirm all errors are resolved
- [ ] 4.2 Verify hotspot scan passes with `pnpm run cdk -- repo check hotspots -- --fail-on-hard`
- [ ] 4.3 Confirm overall validation status shows 9/9 passed with 0 errors
