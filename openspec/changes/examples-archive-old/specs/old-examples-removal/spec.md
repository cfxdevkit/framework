## REMOVED Requirements

### Requirement: Old Vite apps are removed from the workspace

The directories `apps/showcase`, `apps/showcase-stack`, `apps/showcase-browser`, `apps/hardware-wallet-showcase`, and `apps/showcase-gateway` SHALL be deleted from `projects/examples/apps/`.

**Reason:** Superseded by `apps/showcase-public` and `apps/showcase-local`. The Vite apps duplicated framework functionality and required a gateway proxy to run. The new Next.js apps provide equivalent functionality in a deployable, maintainable form.

**Migration:** All functionality is covered by `examples-showcase-public` and `examples-showcase-local`.

#### Scenario: Old app directories do not exist after archive
WHEN the file system is inspected after this change is applied
THEN none of `apps/showcase`, `apps/showcase-stack`, `apps/showcase-browser`, `apps/hardware-wallet-showcase`, `apps/showcase-gateway` exist under `projects/examples/apps/`

### Requirement: Showcase backend is removed

The directory `apps/showcase-backend` SHALL be deleted from `projects/examples/apps/` once its remaining local-runtime responsibilities are covered by the shared control-plane replacement.

**Reason:** Its functionality (devnode management, keystore, session-key, compile, deploy) is superseded by the shared local-runtime control plane consumed by `apps/showcase-local` and other tooling.

**Migration:** See `local-runtime-control-plane` and `examples-showcase-local` for the replacement implementation.

#### Scenario: showcase-backend directory does not exist after archive
WHEN the file system is inspected after this change is applied
THEN `projects/examples/apps/showcase-backend` does not exist

### Requirement: Old showcase-ui package is removed

The old `packages/showcase-ui` (pre-rebuild) SHALL be removed. Only the rebuilt version installed by `examples-shared-foundation` SHALL exist.

**Reason:** The old package contained ~500 LoC of bespoke wallet-state, theme CSS, and ConnectWall logic that has been replaced by `@cfxdevkit/wallet-connect` and `@cfxdevkit/theme`.

**Migration:** Any import of the old `showcase-ui` package is replaced by `@cfxdevkit/example-showcase-ui` (the rebuilt package) or by direct framework imports.

#### Scenario: Only one showcase-ui package exists after archive
WHEN `packages/` is inspected under `projects/examples`
THEN only the rebuilt `packages/showcase-ui` (with `@cfxdevkit/example-showcase-ui` package name) exists

### Requirement: Workspace config reflects only new apps

The `projects/examples/.moon/workspace.yml` and `projects/examples/pnpm-workspace.yaml` SHALL reference only `apps/showcase-public`, `apps/showcase-local`, and `packages/showcase-ui`. All removed app globs SHALL be deleted.

**Reason:** Stale workspace config causes pnpm/moon errors and slows CI.

**Migration:** No migration — removed entries are simply deleted.

#### Scenario: pnpm install succeeds after removal
WHEN `pnpm install` is run from the monorepo root after removal
THEN the install completes with no unresolved dependency errors

#### Scenario: Moon task graph contains only new projects
WHEN `moon query projects` is run
THEN no old showcase apps appear in the output
