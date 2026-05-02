# `projects/examples`

Tier 3 example apps that exercise the public API of the `@cfxdevkit/*`
packages from the user's perspective. These apps may import from `framework/`,
`platform/`, and `domains/`, but no higher-tier code may import from here.
The examples include multiple standalone apps under `apps/` plus a small
shared UI package under `packages/`. Together they act as runnable demos
and light integration coverage for the public API surface.

## Apps

- [`apps/showcase/`](apps/showcase/) — Tier 3 single-page React app demonstrating
  the currently-implemented features:
  - BIP-39 mnemonic generation
  - Dual-space (EVM + Core base32) HD account derivation
  - Live network status against the public Conflux RPC endpoints

  Run with `pnpm --filter @cfxdevkit/example-showcase dev`.

- [`apps/showcase-browser/`](apps/showcase-browser/) — Tier 3 browser-only wallet and
  network showcase focused on client-side flows.

- [`apps/showcase-stack/`](apps/showcase-stack/) — Tier 3 full-stack example frontend
  that talks to the showcase backend.

- [`apps/showcase-backend/`](apps/showcase-backend/) — Tier 1 backend service used by
  the stack example.

## Shared package

- [`packages/showcase-ui/`](packages/showcase-ui/) — Tier 2 shared presentational UI
  pieces used by `showcase-browser` and `showcase-stack`.

## Adding an app

1. `mkdir -p projects/examples/apps/<name>`
2. Add a `package.json` named `@cfxdevkit/example-<name>`.
3. Register the path in [.moon/workspace.yml](../../.moon/workspace.yml).
4. Add a `moon.yml` (`type: 'application'`, `language: 'typescript'`).
5. Run `pnpm install` from the workspace root.

Note: All apps in `projects/examples` are Tier 3. They may import from
`framework/`, `platform/`, and `domains/`, but no higher-tier code may import from here.

## Adding a shared example package

1. Create `projects/examples/packages/<name>/`.
2. Add a `package.json` named `@cfxdevkit/example-<name>`.
3. Register the path in [.moon/workspace.yml](../../.moon/workspace.yml).
4. Add a README documenting which example apps depend on it.

Note: Shared example packages in `projects/examples/packages` are Tier 2.
They may import from `framework/` and `platform/`, but not from `domains/` or higher tiers.
