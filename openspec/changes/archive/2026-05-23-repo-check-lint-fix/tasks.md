## 1. Fix JSON Output in Format Step

- [x] 1.1 Identify root cause of malformed JSON output (minus-digit parsing error) in `format` step
- [x] 1.2 Locate and fix invalid minus sign usage in JSON-generating code (likely in `commands.js` or `context.js`)
- [x] 1.3 Validate JSON output by re-running `pnpm run tooling -- -- repo check docs --json` and confirming valid JSON
- [x] 1.4 Confirm `pnpm run format` completes without parse errors

## 2. Fix Lint Errors in Source Files

- [x] 2.1 Add missing export for `runStructuredRepoCommand` in `commands.js`
- [x] 2.2 Add missing exports for `findWorkspaceRoot`, `getGitNexusSnapshot`, and `writeJson` in `context.js`
- [x] 2.3 Ensure all required types (`RepoCheckHotspotsResult`, `RepoCheckKebabGroupsResult`, etc.) are exported from `types` module
- [x] 2.4 Run `pnpm run lint` to confirm all lint errors are resolved

## 3. Validate End-to-End Execution

- [x] 3.1 Run `pnpm run check` to verify lint errors no longer propagate to check step
- [x] 3.2 Run full pipeline (`pnpm run format && pnpm run lint && pnpm run check`) to confirm all steps pass
- [x] 3.3 Manually inspect JSON output from `--json` flag to ensure it is valid and parseable
