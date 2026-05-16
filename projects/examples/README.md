# `projects/examples`

Tier 3 example apps that exercise the public API of the `@cfxdevkit/*`
packages from the user's perspective. These apps may import from `framework/`,
`platform/`, and `domains/`, but no higher-tier code may import from here.
The examples include multiple standalone apps under `apps/` plus a small
shared UI package under `packages/`. Together they act as runnable demos
and light integration coverage for the public API surface.

## Apps

- [`apps/showcase-gateway/`](apps/showcase-gateway/) — single development
  entry point and reverse proxy for the showcase apps. Run `pnpm showcase` from
  the monorepo root, then open `http://127.0.0.1:5173`.

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

- [`apps/showcase-local/`](apps/showcase-local/) — Tier 3 local-runtime showcase
  that runs the shared `@cfxdevkit/devnode-server` backend in-process and exposes
  the same control plane expected by showcase, the VS Code extension, and MCP.
  The backend owns the active network profile per wallet, supports switching
  between `local`, `testnet`, and `mainnet`, keeps tracked contracts isolated by
  wallet, and preserves generic ABI routes alongside tracked contract calls by id.

- [`apps/showcase-backend/`](apps/showcase-backend/) — Tier 1 backend service used by
  the stack example.

## Recommended Local Workflow

Run the whole showcase stack behind one stable URL:

```bash
pnpm showcase
```

Then open `http://127.0.0.1:5173`. The gateway proxies frontend sections by
path (`/showcase/`, `/stack/`, `/browser/`, `/keystores/`) and backend routes by
same-origin paths (`/api/*`, `/devnode/*`, `/compile/*`, `/rpc/*`). This avoids
browser-side `127.0.0.1` confusion and Vite port drift when another dev server
is still running.

## Linear Walkthrough

The gateway presents the examples as a single path through the current codebase:

1. `/showcase/` — SDK fundamentals: `@cfxdevkit/core`, wallet derivation,
  keystore sessions, address/unit helpers, Solidity template compile/deploy,
  and network status.
2. `/stack/` — backend-backed flows: `@cfxdevkit/devnode`, backend SIWE,
  session-key delegation, compiler endpoints, contract deployment, and local
  RPC proxying.
3. `/showcase-local/` — shared backend control plane: wallet-scoped keystore,
  local/public network profile switching, tracked contract persistence, deploy,
  read, write, and tracked contract call-by-id flows.
4. `/browser/` — external wallet coverage: Fluent Core, non-Fluent eSpace
  providers, wagmi, raw injected provider diagnostics, signing, and transfer
  flows.
5. `/keystores/` — keystore management coverage: memory, encrypted file, Ledger,
  and reserved OneKey/Satochip backend slots, plus Core/eSpace transfer and
  deploy flows through the active managed signer.

Current known coverage gaps are visible in the gateway coverage map. The next
sections to add should target `@cfxdevkit/theme`, `@cfxdevkit/react`,
`@cfxdevkit/cli`, `@cfxdevkit/llm-tools`, and the domain packages
(`automation`, `game-engine`, `hardware-bridge`).

## Shared package

- [`packages/showcase-ui/`](packages/showcase-ui/) — Tier 2 shared theme,
  shell navigation, sidebar state, backend/devnode controls, and wallet UI
  primitives used by the showcase apps.

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
