# `projects/examples`

Live showcase apps that exercise the public API of the `@cfxdevkit/*`
packages from the user's perspective. Each app under `apps/` is a standalone
runnable demo; they share no code with each other and are deliberately
small so they double as integration tests for the surface area.

## Apps

- [`apps/showcase/`](apps/showcase/) — single-page React app demonstrating
  the currently-implemented features:
  - BIP-39 mnemonic generation
  - Dual-space (EVM + Core base32) HD account derivation
  - Live network status against the public Conflux RPC endpoints

  Run with `pnpm --filter @cfxdevkit/example-showcase dev`.

## Adding an app

1. `mkdir -p projects/examples/apps/<name>`
2. Add a `package.json` named `@cfxdevkit/example-<name>`.
3. Register the path in [.moon/workspace.yml](../../.moon/workspace.yml).
4. Add a `moon.yml` (`type: 'application'`, `language: 'typescript'`).
5. Run `pnpm install` from the workspace root.
