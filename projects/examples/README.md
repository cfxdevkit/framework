# `projects/examples`

Tier 3 example apps that exercise the public API of the `@cfxdevkit/*`
packages from the user's perspective. These apps may import from `framework/`,
`platform/`, and `domains/`, but no higher-tier code may import from here.
The examples include the supported keeper showcase apps under `apps/` plus a
small shared UI package under `packages/`. Together they act as runnable demos
and light integration coverage for the public API surface.

## Apps

- [`apps/showcase-local/`](apps/showcase-local/) — Tier 3 local-runtime showcase
  that runs the shared `@cfxdevkit/devnode-server` backend in-process and exposes
  the same control plane expected by showcase, the VS Code extension, and MCP.
  The backend owns the active network profile per wallet, supports switching
  between `local`, `testnet`, and `mainnet`, keeps tracked contracts isolated by
  wallet root, preserves generic ABI routes alongside tracked contract calls by id,
  and exposes derived-account inventory beneath the active wallet root. Destructive
  reset remains operator-only; see [`apps/showcase-local/RESET.md`](apps/showcase-local/RESET.md).

- [`apps/showcase-public/`](apps/showcase-public/) — Tier 3 browser-side public SDK
  showcase for Core/eSpace RPC, browser wallets, hardware wallets, SIWE, DeFi,
  and UI-kit demos without a local backend dependency.

## Recommended Local Workflow

Run the supported showcase apps:

```bash
pnpm showcase
```

Then open the app URLs printed by Next.js for `showcase-local` and
`showcase-public`.

## Linear Walkthrough

The keeper apps present the supported release walkthrough:

1. `showcase-local` — shared backend control plane: wallet-scoped keystore,
  wallet-root and derived-account management, local/public network profile
  switching, tracked contract persistence, deploy, read, write, and tracked
  contract call-by-id flows. Reset is a manual operator workflow rather than a
  browser action.
2. `showcase-public` — public/browser SDK coverage: Core and eSpace RPC lookups,
  browser wallet flows, hardware wallet demos, SIWE, DeFi widgets, and UI-kit
  examples.

## Shared package

- [`packages/showcase-ui/`](packages/showcase-ui/) — Tier 2 shared theme,
  shell primitives, status/log widgets, code snippets, and wallet UI primitives
  used by the keeper showcase apps.

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
