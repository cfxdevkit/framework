## 1. Package Scaffold

- [x] 1.1 Create `repos/cfx-tools/packages/arch-check/package.json` (`name: @cfxdevkit/arch-check`, `private: true`, type: module)
- [x] 1.2 Create `repos/cfx-tools/packages/arch-check/tsconfig.json` extending `@cfxdevkit/tsconfig`
- [x] 1.3 Create `repos/cfx-tools/packages/arch-check/biome.json` extending `@cfxdevkit/biome-config`
- [x] 1.4 Create `repos/cfx-tools/packages/arch-check/moon.yml` with placeholder tasks (to be populated in section 6)
- [x] 1.5 Add `@cfxdevkit/arch-rules` as `devDependency` (`workspace:*`) in `arch-check/package.json`
- [x] 1.6 Create `repos/cfx-tools/packages/arch-check/src/` directory structure: `checks/secrets.ts`, `checks/hotspots.ts`, `checks/ci.ts`, `checks/docs.ts`, `checks/corpus.ts`, `checks/eval.ts`, `checks/arch.ts`, `index.ts`

## 2. Register in Workspace and Moon

- [x] 2.1 Verify `repos/cfx-tools/packages/*` is already in `pnpm-workspace.yaml` (it should be — add if missing)
- [x] 2.2 Add `repos/cfx-tools/packages/arch-check` entry to `.moon/workspace.yml` projects list
- [x] 2.3 Run `pnpm install` to wire the new package into the workspace

## 3. Port check:secrets

- [x] 3.1 Read `scripts/check-secret-leaks.mjs` in full to capture all 4 security rules and the roots list
- [x] 3.2 Write `src/checks/secrets.ts` as typed TypeScript with the same rules, omitting `tools/` from the scan roots (it no longer exists), and exporting a `runSecretsCheck()` function
- [x] 3.3 Write `src/bin/check-secrets.ts` CLI entry that calls `runSecretsCheck()` and exits with code 1 on violations
- [x] 3.4 Verify the ported implementation catches the same patterns as the original `.mjs` script

## 4. Port check:hotspots

- [x] 4.1 Read `repos/cfx-llm/packages/llm-tools/workers/code-hotspots.ts` in full
- [x] 4.2 Read `repos/cfx-llm/packages/llm-tools/workers/agents/runtime/index.ts` to capture shared utilities needed by hotspots
- [x] 4.3 Write `src/checks/hotspots.ts` as typed TypeScript (no `@ts-nocheck`), exporting `runHotspotsCheck(opts?)` function with the same flags: `--soft-limit`, `--hard-limit`, `--since`, `--fail-on-hard`, `--json`
- [x] 4.4 Write `src/bin/check-hotspots.ts` CLI entry that parses CLI args and calls `runHotspotsCheck()`

## 5. Move Deterministic Agent Runners

- [x] 5.1 Read `repos/cfx-llm/packages/llm-tools/workers/agents/runtime/index.ts` in full to identify all exported utilities
- [x] 5.2 Copy `runtime/` utilities into `arch-check/src/runtime/` (or inline them — prefer inline if small)
- [x] 5.3 Write `src/checks/ci.ts` by porting `workers/agents/cicd.ts` (remove `@ts-nocheck`, add types)
- [x] 5.4 Write `src/checks/docs.ts` by porting `workers/agents/docs.ts` (remove `@ts-nocheck`, add types)
- [x] 5.5 Write `src/checks/corpus.ts` by porting `workers/agents/corpus.ts` (remove `@ts-nocheck`, add types)
- [x] 5.6 Write `src/checks/eval.ts` by porting `workers/agents/eval-serve.ts` — include both `runEvalAgent` and `runServeCheckAgent` (remove `@ts-nocheck`, add types)
- [x] 5.7 Write `src/bin/check-ci.ts`, `src/bin/check-docs.ts`, `src/bin/check-corpus.ts`, `src/bin/check-eval.ts` CLI entries

## 6. Implement arch:check

- [x] 6.1 Write `src/checks/arch.ts` importing `getTierFor`, `getRulesFor`, `getLifecycle` from `@cfxdevkit/arch-rules`
- [x] 6.2 Implement `runArchCheck()`: enumerate all workspace packages, resolve their tier, and evaluate `enforce: always` rules
- [x] 6.3 When `getLifecycle()` returns `pre-release`, skip rules with `enforce: on-release`
- [x] 6.4 Exit with code 1 when any `severity: error` rule is violated; print rule ID, violating package, and description
- [x] 6.5 Write `src/bin/arch-check.ts` CLI entry that calls `runArchCheck()`

## 7. Wire Moon Tasks

- [x] 7.1 Update `repos/cfx-tools/packages/arch-check/moon.yml` to define tasks: `check-secrets`, `check-hotspots`, `check-ci`, `check-docs`, `check-corpus`, `check-eval`, `arch-check`
- [x] 7.2 Each moon task runs the corresponding `src/bin/*.ts` via `tsx` (or compiled `node dist/bin/*.js`)
- [x] 7.3 Set appropriate `inputs` for each task (e.g., `check:secrets` inputs: `repos/**`, `projects/**`, `scripts/**`)

## 8. Update llm-tools

- [x] 8.1 Delete `repos/cfx-llm/packages/llm-tools/workers/code-hotspots.ts`
- [x] 8.2 Delete `repos/cfx-llm/packages/llm-tools/workers/agents/cicd.ts`
- [x] 8.3 Delete `repos/cfx-llm/packages/llm-tools/workers/agents/docs.ts`
- [x] 8.4 Delete `repos/cfx-llm/packages/llm-tools/workers/agents/corpus.ts`
- [x] 8.5 Delete `repos/cfx-llm/packages/llm-tools/workers/agents/eval-serve.ts`
- [x] 8.6 Remove the `ci`, `corpus`, `docs`, `eval`, `serve-check`, `hotspots` commands from `workers/llm-agents.ts` dispatch table and remove their imports
- [x] 8.7 Remove the `runAll()` calls to the deleted agents in `workers/agents/all.ts`; update `all.ts` to only orchestrate remaining LLM agents (`review`, and any surviving agent)
- [x] 8.8 Run `pnpm --filter @cfxdevkit/llm-tools typecheck` to confirm no dangling references

## 9. Update Root package.json Scripts

- [x] 9.1 Remove `quality:hotspots` script (replaced by `check:hotspots`)
- [x] 9.2 Remove `security:secrets` script (replaced by `check:secrets`)
- [x] 9.3 Remove `llm:hotspots`, `llm:ci`, `llm:corpus`, `llm:docs`, `llm:eval`, `llm:serve-check` scripts
- [x] 9.4 Add `check:hotspots`, `check:secrets`, `check:ci`, `check:docs`, `check:corpus`, `check:eval`, `arch:check` scripts that call `moon run arch-check:<task>`
- [x] 9.5 Update `security:check` to call `pnpm run check:secrets` instead of `pnpm run security:secrets`

## 10. Delete scripts/check-secret-leaks.mjs

- [x] 10.1 Delete `scripts/check-secret-leaks.mjs`

## 11. Validation

- [x] 11.1 Run `moon run arch-check:build` — exits 0
- [x] 11.2 Run `moon run arch-check:typecheck` — exits 0 (no `@ts-nocheck` in any check file)
- [x] 11.3 Run `moon run arch-check:lint` — exits 0
- [x] 11.4 Run `moon run arch-check:arch-check` — exits 0 on clean repo
- [x] 11.5 Run `moon run arch-check:check-secrets` — exits 0 on clean repo (no `tools/` directory error)
- [x] 11.6 Run `moon run arch-check:check-hotspots` — completes without uncaught exception
- [x] 11.7 Run `pnpm --filter @cfxdevkit/llm-tools typecheck` — exits 0 after worker deletions
- [x] 11.8 Run `pnpm run check:secrets` from repo root — succeeds
- [x] 11.9 Run `pnpm run arch:check` from repo root — succeeds
- [x] 11.10 Confirm `scripts/check-secret-leaks.mjs` does not exist
