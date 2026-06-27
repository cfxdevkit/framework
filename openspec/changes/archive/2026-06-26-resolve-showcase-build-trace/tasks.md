## 1. Identify Dynamic Tracing Issues

- [ ] 1.1 Locate dynamic require statements and filesystem operations causing the `showcase-local:build` typecheck error
- [ ] 1.2 Map the unintended project-wide trace to specific files in the import chain

## 2. Refactor Imports to Explicit Paths

- [ ] 2.1 Replace dynamic requires (e.g., `require('./' + foo)`) with explicit static imports
- [ ] 2.2 Update CLI command loaders to explicitly import `derive`, `generate`, `keystore`, `status`, and `units` modules
- [ ] 2.3 Remove `path.join`, `path.resolve`, or `fs.readFile` calls from module resolution logic

## 3. Validate Build and Typecheck

- [ ] 3.1 Run `pnpm run typecheck` to confirm `showcase-local:build` error is resolved
- [ ] 3.2 Run `pnpm run check` to verify `wallet:build` and `cli:lint` pass without warnings
- [ ] 3.3 Confirm all 9 validation checks pass with 0 errors
