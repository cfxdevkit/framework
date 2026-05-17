## REMOVED Requirements

> Closure note (2026-05-17): Archive this change as deferred. These requirements are not satisfied in the current repo state because the legacy example app directories still exist and some remaining showcase-public parity work still references them as source material.

### Requirement: Old Vite apps are removed from the workspace

The directories `apps/showcase`, `apps/showcase-stack`, `apps/showcase-browser`, `apps/hardware-wallet-showcase`, and `apps/showcase-gateway` SHALL be deleted from `projects/examples/apps/`.

**Reason:** Superseded by `apps/showcase-public` and `apps/showcase-local`. The Vite apps duplicated framework functionality and required a gateway proxy to run. The new Next.js apps provide equivalent functionality in a deployable, maintainable form.

**Migration:** All functionality is covered by `examples-showcase-public` and `examples-showcase-local`.

#### Scenario: Old app directories do not exist after archive
WHEN the file system is inspected after this change is applied
THEN none of `apps/showcase`, `apps/showcase-stack`, `apps/showcase-browser`, `apps/hardware-wallet-showcase`, `apps/showcase-gateway` exist under `projects/examples/apps/`

### Requirement: Showcase backend is removed

The directory `apps/showcase-backend` SHALL be deleted from `projects/examples/apps/` once the keeper apps are verified as self-contained.

**Reason:** Its functionality is superseded by `showcase-local`'s embedded runtime and `showcase-public`'s own Next.js API routes.

**Migration:** See `artifacts/plan/phase-0-legacy-audit.md` for the replacement architecture summary.

#### Scenario: showcase-backend directory does not exist after archive
WHEN the file system is inspected after this change is applied
THEN `projects/examples/apps/showcase-backend` does not exist

### Requirement: Workspace config reflects only new apps

The root `.moon/workspace.yml` and root `pnpm-workspace.yaml` SHALL no longer reference the removed legacy example apps. The keeper app paths and `projects/examples/packages/showcase-ui` SHALL remain.

**Reason:** Stale workspace config causes pnpm/moon errors and slows CI.

**Migration:** No migration — removed entries are simply deleted.

#### Scenario: pnpm install succeeds after removal
WHEN `pnpm install` is run from the monorepo root after removal
THEN the install completes with no unresolved dependency errors

#### Scenario: Moon task graph contains only new projects
WHEN `moon query projects` is run
THEN no old showcase apps appear in the output
