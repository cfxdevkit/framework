## 1. Analyze CLI Import Structure

- [ ] 1.1 Locate the CLI file containing the unsorted command imports
- [ ] 1.2 Review ESLint `import/order` rules to confirm alphabetical sorting requirement

## 2. Apply Import Sorting Fix

- [ ] 2.1 Reorder all `./commands/*` imports alphabetically
- [ ] 2.2 Remove any duplicate or misplaced import statements

## 3. Validate Lint and Build Signals

- [ ] 3.1 Execute `pnpm run lint` to verify `devnode-server:lint` passes
- [ ] 3.2 Execute `pnpm run check` to verify `wallet:build` passes
- [ ] 3.3 Confirm validation context shows 0 errors and 0 warnings
