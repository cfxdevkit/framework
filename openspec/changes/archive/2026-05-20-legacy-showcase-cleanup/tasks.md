## 1. Legacy App Retirement

- [x] 1.1 Confirm every legacy app feature is either ported to a keeper or explicitly superseded by the release plan.
- [x] 1.2 Remove `projects/examples/apps/showcase/`, `showcase-browser/`, `showcase-stack/`, `showcase-gateway/`, `showcase-backend/`, and `hardware-wallet-showcase/`.
- [x] 1.3 Remove all workspace and Moon references to the retired apps.
- [x] 1.4 Remove any retired app entries from `projects/examples/package.json` and verify no per-app `moon.yml` files remain after deletion.

## 2. Stub Package Removal

- [x] 2.1 Delete `repos/cfx-domain/packages/hardware-bridge/`.
- [x] 2.2 Remove hardware-bridge references from workspace configs and any package metadata.

## 3. Repo Surface Cleanup

- [x] 3.1 Remove stale infrastructure and documentation references to retired apps and the stub package.
- [x] 3.2 Run workspace validation (`typecheck`, targeted tests if needed, and `check:unused`) after the removals.
- [x] 3.3 Confirm infrastructure or proxy routing no longer points at retired example apps.

## Validation Notes

- Keeper coverage is carried by `showcase-local`, `showcase-public`, and shared `showcase-ui`; release-critical hardware wallet behavior is documented under `showcase-public` and non-public local/devnode behavior remains in `showcase-local`.
- Removed retired app directories and the `hardware-bridge` package; `projects/examples/package.json` does not exist, and remaining example app `moon.yml` files are only for `showcase-local` and `showcase-public`.
- Post-cleanup searches found no live source/config/doc references to the retired app package names, retired app directories, `@cfxdevkit/hardware-bridge`, or retired infra/proxy routes after excluding generated artifacts, caches, logs, and OpenSpec history.
- `pnpm --filter @cfxdevkit/client build`, `pnpm --filter @cfxdevkit/example-showcase-local typecheck`, `pnpm --filter @cfxdevkit/example-showcase-public typecheck`, and `pnpm -w typecheck` pass.
- `pnpm check:unused` still fails on pre-existing MCP unused dependency/export findings; the failure output contains no deleted legacy showcase app or `@cfxdevkit/hardware-bridge` references.
