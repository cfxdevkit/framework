## 1. Fix Kebab-Group Naming Convention

- [ ] 1.1 Rename `onekey*.ts` files in `repos/cfx-keys/packages/signer-session/src` to strictly follow kebab-case naming conventions
- [ ] 1.2 Update all import statements and module references across the repository to match the new filenames
- [ ] 1.3 Validate kebab-groups check passes using `pnpm run cdk -- repo check kebab-groups`

## 2. Refactor Keystore Hotspot

- [ ] 2.1 Analyze `repos/cfx-tools/packages/cli/src/commands/keystore.ts` to map logical boundaries for extraction
- [ ] 2.2 Extract shared types, constants, and utility functions into a dedicated `keystore-utils.ts` module
- [ ] 2.3 Split distinct sub-command handlers into separate files under a `keystore/` subdirectory
- [ ] 2.4 Refactor `keystore.ts` to serve as a thin entry point that imports and registers the extracted modules
- [ ] 2.5 Update all internal imports and verify CLI command registration remains intact
- [ ] 2.6 Run existing unit tests to confirm refactored keystore commands maintain identical behavior

## 3. Validation & Verification

- [ ] 3.1 Run hotspot check to confirm `keystore.ts` line count drops below the hard threshold: `pnpm run cdk -- repo check hotspots -- --fail-on-hard`
- [ ] 3.2 Execute full test suite for `cfx-tools/packages/cli` to ensure zero regressions
- [ ] 3.3 Perform manual CLI smoke tests for all keystore commands to verify end-to-end functionality
