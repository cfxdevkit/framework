## ADDED Requirements

### Requirement: Local app skeleton exists and runs

The `apps/showcase-local` Next.js application SHALL exist as a runnable package named `@cfxdevkit/example-showcase-local` with all chapter routes stubbed.

#### Scenario: App starts in development mode
WHEN `pnpm dev` is run from `apps/showcase-local`
THEN the Next.js dev server starts with no compilation errors and all chapter routes accessible

#### Scenario: All chapter routes respond
WHEN any of `/`, `/devnode`, `/keystore`, `/session-key`, `/compiler`, `/deploy` is visited
THEN the page renders the shared Shell layout with a "coming soon" placeholder for the chapter content

#### Scenario: App does not produce a static export
WHEN `pnpm build` is run
THEN Next.js builds in standard server mode (no `output: 'export'`)

### Requirement: Node.js API routes scaffolded

The local app SHALL have scaffolded (empty) API route files for `/api/devnode/*`, `/api/keystore/*`, `/api/session-key/*`, `/api/compile/*`, and `/api/deploy/*`. Each SHALL declare `export const runtime = 'nodejs'`.

#### Scenario: API routes declare Node.js runtime
WHEN the Next.js build processes the API route files
THEN no "edge runtime" warnings appear and the routes are treated as Node.js server functions

#### Scenario: Health check route responds
WHEN GET `/api/health` is called
THEN `{ ok: true }` is returned with 200 status

### Requirement: Provider wiring in root layout

The local app's root layout SHALL mount `ThemeProvider`, `WagmiProvider`, and `QueryClientProvider`. Wagmi SHALL be configured with all three eSpace chains (mainnet, testnet, local) so the local devnode chapter can switch to a locally-spawned chain.

#### Scenario: Local chain is available in wagmi config
WHEN the local app's wagmi config is inspected
THEN eSpace local (chainId 2030) is present alongside testnet and mainnet chains
