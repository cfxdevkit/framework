## 1. Refactor CLI Keystore Hotspot

- [ ] 1.1 Analyze `keystore.ts` structure and identify logical boundaries for splitting
- [ ] 1.2 Extract keystore initialization and configuration logic into a new module
- [ ] 1.3 Extract keystore command handlers and CLI argument parsing into a separate file
- [ ] 1.4 Extract keystore utility functions and validation helpers into a dedicated utils file
- [ ] 1.5 Refactor `keystore.ts` to act as a thin entry point that re-exports from new modules

## 2. Rename Signer-Session Files for Kebab-Case Compliance

- [ ] 2.1 Rename `onekey-diagnostics.ts` to strictly follow kebab-case naming conventions
- [ ] 2.2 Rename `onekey-session.ts` to strictly follow kebab-case naming conventions
- [ ] 2.3 Update internal module references within the renamed files to match new paths

## 3. Update Cross-Module Imports and References

- [ ] 3.1 Update all import statements in `cfx-tools/packages/cli` to point to new keystore modules
- [ ] 3.2 Update all import statements in `cfx-keys/packages/signer-session` to point to renamed files
- [ ] 3.3 Verify barrel exports (`index.ts`) are updated to reflect new file structure and names

## 4. Validate and Verify Changes

- [ ] 4.1 Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` to confirm hard hotspot is resolved
- [ ] 4.2 Run `pnpm run cdk -- repo check kebab-groups` to confirm kebab-case warnings are cleared
- [ ] 4.3 Execute full build and lint pipelines to ensure no regressions
- [ ] 4.4 Run existing test suites for CLI and signer-session packages to verify functionality
