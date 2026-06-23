## 1. Analysis and Preparation

- [x] 1.1 Review the 5 `repo*.ts` files in `pi-agent/src/commands` to map their current exports, types, and internal dependencies
- [x] 1.2 Identify all files across the `pi-agent` package that import from these 5 modules

## 2. Consolidation Implementation

- [x] 2.1 Create the new consolidated module `pi-agent/src/commands/repo-actions.ts`
- [x] 2.2 Migrate all function implementations, interfaces, and constants from the 5 source files into `repo-actions.ts`
- [x] 2.3 Organize the consolidated file with clear section comments and maintain a single export block

## 3. Import Updates and Cleanup

- [x] 3.1 Update all import statements in the codebase to reference `repo-actions.ts` instead of the individual `repo*.ts` files
- [x] 3.2 Remove the original `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, and `repo-status.ts` files
- [x] 3.3 Update the `pi-agent/src/commands/index.ts` barrel export to point to the new consolidated module

## 4. Validation and Testing

- [ ] 4.1 Run `pnpm run cdk -- repo check kebab-groups` to verify the kebab-groups warning is resolved
- [ ] 4.2 Execute the full `pi-agent` test suite to confirm no functional regressions
- [ ] 4.3 Run type checking and linting (`pnpm run typecheck && pnpm run lint`) to ensure code quality standards are met
