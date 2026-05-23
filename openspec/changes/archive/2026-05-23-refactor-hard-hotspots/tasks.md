## 1. Analyze and Plan Hotspot Refactoring

- [x] 1.1 Review current structure of `repo-namespace.ts` (632 lines, score 1444) and identify cohesive submodules
- [x] 1.2 Review current structure of `agent-namespace.ts` (430 lines, score 1355) and identify cohesive submodules
- [x] 1.3 Review current structure of `repo-namespace.test.ts` (716 lines, score 1111) and identify test module boundaries
- [x] 1.4 Review current structure of `check.ts` (991 lines, score 991) and identify logical agent responsibilities
- [x] 1.5 Document proposed module boundaries and naming conventions for all hotspots
- [x] 1.6 Validate proposed structure against OpenSpec modularity constraints

## 2. Extract Core Logic from `repo-namespace.ts`

- [x] 2.1 Extract namespace resolution logic into `repo-resolve.ts`
- [x] 2.2 Extract namespace validation logic into `repo-validate.ts`
- [x] 2.3 Extract namespace metadata handling into `repo-meta.ts`
- [x] 2.4 Refactor `repo-namespace.ts` to delegate to extracted modules
- [x] 2.5 Update all imports referencing `repo-namespace.ts`

## 3. Extract Core Logic from `agent-namespace.ts`

- [x] 3.1 Extract agent registration logic into `agent-register.ts`
- [x] 3.2 Extract agent lifecycle management into `agent-lifecycle.ts`
- [x] 3.3 Extract agent metadata handling into `agent-meta.ts`
- [x] 3.4 Refactor `agent-namespace.ts` to delegate to extracted modules
- [x] 3.5 Update all imports referencing `agent-namespace.ts`

## 4. Refactor Test Suite for `repo-namespace.ts`

- [x] 4.1 Split `repo-namespace.test.ts` into `repo-resolve.test.ts`
- [x] 4.2 Split `repo-namespace.test.ts` into `repo-validate.test.ts`
- [x] 4.3 Split `repo-namespace.test.ts` into `repo-meta.test.ts`
- [x] 4.4 Create shared test utilities for namespace mocking
- [x] 4.5 Update test runner configuration to include new test files

## 5. Refactor `check.ts` Agent Logic

- [x] 5.1 Extract check validation logic into `check-validate.ts`
- [x] 5.2 Extract check execution orchestration into `check-orchestrate.ts`
- [x] 5.3 Extract check result aggregation into `check-aggregate.ts`
- [x] 5.4 Extract check reporting logic into `check-report.ts`
- [x] 5.5 Refactor `check.ts` to delegate to extracted modules
- [x] 5.6 Update agent entrypoint to use new module structure

## 6. Update Dependencies and Build Configuration

- [x] 6.1 Update `tsconfig.json` to include new module paths
- [x] 6.2 Update `package.json` exports if modules are published
- [x] 6.3 Verify no circular dependencies between new modules
- [x] 6.4 Run `pnpm run build` to confirm compilation success

## 7. Validate Refactoring

- [x] 7.1 Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` and confirm no hard hotspots remain
- [x] 7.2 Run full test suite to ensure no regressions
- [x] 7.3 Verify linting and formatting pass across all modified files
- [x] 7.4 Document new module boundaries in `docs/architecture/hotspot-refactoring.md`
