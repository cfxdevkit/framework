## 1. Analyze and Plan File Splitting Strategy

- [ ] 1.1 Review current structure and responsibilities of `repo-namespace.ts` to identify logical submodules
- [ ] 1.2 Review current structure and responsibilities of `agent-namespace.ts` to identify logical submodules
- [ ] 1.3 Review current structure and responsibilities of `repo-namespace.test.ts` to identify logical test module groupings
- [ ] 1.4 Review current structure and responsibilities of `check.ts` to identify logical functional boundaries
- [ ] 1.5 Document proposed module boundaries and naming conventions for all four files
- [ ] 1.6 Validate that splitting preserves all existing functionality and test coverage

## 2. Refactor `repo-namespace.ts`

- [ ] 2.1 Extract namespace resolution logic into `repo-resolve.ts`
- [ ] 2.2 Extract workspace root detection logic into `repo-workspace.ts`
- [ ] 2.3 Extract git nexus snapshot handling into `repo-snapshot.ts`
- [ ] 2.4 Extract JSON write utilities into `repo-write.ts`
- [ ] 2.5 Update `repo-namespace.ts` to re-export or delegate to new modules
- [ ] 2.6 Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` to confirm `repo-namespace.ts` no longer exceeds threshold

## 3. Refactor `agent-namespace.ts`

- [ ] 3.1 Extract agent initialization logic into `agent-init.ts`
- [ ] 3.2 Extract agent configuration handling into `agent-config.ts`
- [ ] 3.3 Extract agent lifecycle management into `agent-lifecycle.ts`
- [ ] 3.4 Update `agent-namespace.ts` to delegate to new modules
- [ ] 3.5 Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` to confirm `agent-namespace.ts` no longer exceeds threshold

## 4. Refactor `repo-namespace.test.ts`

- [ ] 4.1 Extract namespace resolution tests into `repo-resolve.test.ts`
- [ ] 4.2 Extract workspace root tests into `repo-workspace.test.ts`
- [ ] 4.3 Extract snapshot tests into `repo-snapshot.test.ts`
- [ ] 4.4 Extract write utility tests into `repo-write.test.ts`
- [ ] 4.5 Update `repo-namespace.test.ts` to import and delegate to new test modules
- [ ] 4.6 Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` to confirm `repo-namespace.test.ts` no longer exceeds threshold

## 5. Refactor `check.ts`

- [ ] 5.1 Extract hotspots check logic into `check-hotspots.ts`
- [ ] 5.2 Extract kebab-groups check logic into `check-kebab-groups.ts`
- [ ] 5.3 Extract lint check logic into `check-lint.ts`
- [ ] 5.4 Extract structured output formatting into `check-output.ts`
- [ ] 5.5 Update `check.ts` to orchestrate calls to new modules
- [ ] 5.6 Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` to confirm `check.ts` no longer exceeds threshold

## 6. Validation and Integration

- [ ] 6.1 Run full `pnpm run check` to verify no regressions
- [ ] 6.2 Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` to confirm all hard hotspots resolved
- [ ] 6.3 Ensure all new modules are properly exported and imported
- [ ] 6.4 Update documentation or comments referencing original file locations
- [ ] 6.5 Confirm test coverage remains ≥90% for all refactored modules
