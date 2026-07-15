## 1. Investigate Tracing Sources

- [ ] 1.1 Locate dynamic requires or filesystem operations in `/api/keystore/reveal/consume`
- [ ] 1.2 Identify NFT list file tracing causing full project contamination
- [ ] 1.3 Map affected import paths to static alternatives

## 2. Resolve Dynamic Tracing in Showcase Build

- [ ] 2.1 Replace dynamic `require()` calls with static `import` statements
- [ ] 2.2 Remove or refactor `path.join`/`fs.readFile` operations in keystore reveal logic
- [ ] 2.3 Update NFT list loading to use explicit module paths instead of dynamic resolution
- [ ] 2.4 Isolate showcase-local build tracing to prevent cross-package contamination

## 3. Fix CLI Linting & Import Structure

- [ ] 3.1 Align CLI command imports (`derive`, `generate`, `keystore`, `status`, `units`) with linting rules
- [ ] 3.2 Remove unused or incorrectly formatted import statements in `cli/commands`
- [ ] 3.3 Verify import ordering and formatting matches project standards

## 4. Validate Build & Typecheck

- [ ] 4.1 Run `pnpm run typecheck` to confirm showcase-local:build passes without tracing errors
- [ ] 4.2 Run `pnpm run check` to verify wallet:build and cli:lint errors are resolved
- [ ] 4.3 Confirm total validation status reaches 9/9 passed with 0 errors
