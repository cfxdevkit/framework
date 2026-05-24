# Tasks — monorepo-first-pass

## C4 — Archive packages private

- [x] **C4.1** Add `"private": true` to `repos/cfx-tools/packages/archive/cdk-ai/package.json`
- [x] **C4.2** Add `"private": true` to `repos/cfx-tools/infra/archive/llm-tools/package.json`

## C3 — Moon workspace registration

- [x] **C3.1** Add `repos/cfx-tools/packages/docs-pipeline` to `.moon/workspace.yml`
- [x] **C3.2** Add `repos/cfx-tools/packages/docs-site` to `.moon/workspace.yml`; confirm `runInCI: false` on its build task
- [x] **C3.3** Add `repos/cfx-tools/infra/pi-agent` to `.moon/workspace.yml`
- [x] **C3.4** Add `pi-agent:build` to `tooling-cli/moon.yml` `deps`

## C1 — `@cfxdevkit/workspace-utils` package

- [x] **C1.1** Create `repos/cfx-config/packages/workspace-utils/` with `package.json`, `tsconfig.json`, `moon.yml`, `src/index.ts`
- [x] **C1.2** Implement `findWorkspaceRoot(startDir?)` and `workspaceRoot` singleton in `src/index.ts`
- [x] **C1.3** Add `workspace-utils` to `.moon/workspace.yml`
- [x] **C1.4** Replace `findWorkspaceRoot`/`findRepoRoot` in `arch-check/src/runtime.ts` with import
- [x] **C1.5** Replace in `arch-check/src/checks/monorepo-units.ts`
- [x] **C1.6** Replace in `cdk-repo-check/src/repo-check/context.ts`
- [x] **C1.7** Replace in `docs-pipeline/src/workspace.ts`
- [x] **C1.8** Replace in `tooling-cli/src/workspace-paths.ts`
- [x] **C1.9** Replace in `pi-agent/src/runtime.ts`
- [x] **C1.10** Add `@cfxdevkit/workspace-utils` to each consumer's `package.json` deps; `pnpm install`
- [x] **C1.11** Typecheck all consumers pass

## C2 — Relocate test support

- [x] **C2.1** Audit imports of `@cfxdevkit/testing/tooling-cli-test-support` and `@cfxdevkit/testing/llm-agents-test-support`
- [x] **C2.2** Create `tooling-cli/src/test-support.ts` with content from `testing/src/tooling-cli-test-support.ts`
- [x] **C2.3** Update all tooling-cli test imports to use `./test-support.js`
- [x] **C2.4** Ensure `llm-agents/workers/tests/support.ts` contains the workflow mock helpers (merge from `testing/src/llm-agents-test-support.ts`)
- [x] **C2.5** Update all llm-agents test imports
- [x] **C2.6** Remove `tooling-cli-test-support.ts` and `llm-agents-test-support.ts` from `cfx-core/packages/testing/src/`
- [x] **C2.7** Remove sub-path exports from `testing/package.json`
- [x] **C2.8** All tests still pass

## Validate

- [x] **V.1** `pnpm cdk -- repo precommit` passes all gates
- [x] **V.2** Promote `monorepo-first-pass` spec to `openspec/specs/`
