# `projects/examples`

Live showcase apps that exercise the public API of the `@cfxdevkit/*`
packages from the user's perspective. The examples include multiple standalone
apps under `apps/` plus a small shared UI package under `packages/`. Together
they act as runnable demos and light integration coverage for the public API
surface.

## Apps

- [`apps/showcase/`](apps/showcase/) — single-page React app demonstrating
  the currently-implemented features:
  - BIP-39 mnemonic generation
  - Dual-space (EVM + Core base32) HD account derivation
  - Live network status against the public Conflux RPC endpoints

  Run with `pnpm --filter @cfxdevkit/example-showcase dev`.

- [`apps/showcase-browser/`](apps/showcase-browser/) — browser-only wallet and
  network showcase focused on client-side flows.

- [`apps/showcase-stack/`](apps/showcase-stack/) — full-stack example frontend
  that talks to the showcase backend.

- [`apps/showcase-backend/`](apps/showcase-backend/) — backend service used by
  the stack example.

## Shared package

- [`packages/showcase-ui/`](packages/showcase-ui/) — shared presentational UI
  pieces used by `showcase-browser` and `showcase-stack`.

## Adding an app

1. `mkdir -p projects/examples/apps/<name>`
2. Add a `package.json` named `@cfxdevkit/example-<name>`.
3. Register the path in [.moon/workspace.yml](../../.moon/workspace.yml).
4. Add a `moon.yml` (`type: 'application'`, `language: 'typescript'`).
5. Run `pnpm install` from the workspace root.

## Adding a shared example package

1. Create `projects/examples/packages/<name>/`.
2. Add a `package.json` named `@cfxdevkit/example-<name>`.
3. Register the path in [.moon/workspace.yml](../../.moon/workspace.yml).
4. Add a README documenting which example apps depend on it.
