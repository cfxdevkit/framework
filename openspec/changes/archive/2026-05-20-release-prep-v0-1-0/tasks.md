## 1. Archive completed changes

- [x] 1.1 Archive `showcase-local-refactor` with `openspec archive --change showcase-local-refactor`.
- [x] 1.2 Archive `showcase-public-completion` with `openspec archive --change showcase-public-completion`.
- [x] 1.3 Archive `shared-backend-tooling-alignment` with `openspec archive --change shared-backend-tooling-alignment`.
- [x] 1.4 Archive `cas-frontend-cleanup` with `openspec archive --change cas-frontend-cleanup`.
- [x] 1.5 Archive `legacy-showcase-cleanup` with `openspec archive --change legacy-showcase-cleanup`.
- [x] 1.6 Verify `openspec list` shows no active changes other than `release-prep-v0-1-0`.

## 2. Write CHANGELOG.md v0.1.0 entry

- [x] 2.1 Write the `## [0.1.0] - 2026-05-20` section in `CHANGELOG.md` covering all Tier 0 and Tier 1 packages, the two keeper showcase apps, CAS, and legacy app retirements.

## 3. Update static architecture docs

- [x] 3.1 Remove `@cfxdevkit/hardware-bridge` stub from the Tier table in `ARCHITECTURE.md` and update the showcase app descriptions to list only `showcase-local` and `showcase-public`.
- [x] 3.2 Review `docs/STRUCTURE.md` and remove or update references to retired legacy example apps.

## 4. Quality gates

- [x] 4.1 Run `pnpm -w typecheck` from workspace root — must pass with zero errors.
- [x] 4.2 Run `pnpm -w lint` from workspace root — must pass with zero errors.
- [x] 4.3 Run `pnpm -w test` from workspace root — must pass with zero failures.
- [x] 4.4 Run `pnpm check:unused` — review output, add any intentional acceptable remainders to `knip.config.ts` with a comment, confirm the report is clean.
