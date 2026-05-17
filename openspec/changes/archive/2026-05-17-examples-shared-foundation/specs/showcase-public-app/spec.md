## ADDED Requirements

### Requirement: Public app skeleton exists and runs

The `apps/showcase-public` Next.js application SHALL exist as a runnable package named `@cfxdevkit/example-showcase-public` with all chapter routes stubbed.

#### Scenario: App starts in development mode
WHEN `pnpm dev` is run from `apps/showcase-public`
THEN the Next.js dev server starts on a configured port with no compilation errors

#### Scenario: All chapter routes respond
WHEN any of `/`, `/core`, `/wallet`, `/keys`, `/siwe`, `/defi`, `/ui-kit` is visited
THEN the page renders the shared Shell layout with a "coming soon" placeholder for the chapter content

#### Scenario: App builds for static export
WHEN `pnpm build` is run
THEN Next.js produces a successful build with no TypeScript errors

### Requirement: Provider wiring in root layout

The public app's root layout SHALL mount `ThemeProvider`, `WagmiProvider`, and `QueryClientProvider` so all child pages have access to theme and wallet context.

#### Scenario: eSpace chains are available in wagmi context
WHEN any page component calls `useChains()` from wagmi
THEN the result includes eSpace testnet (chainId 71) and eSpace mainnet (chainId 1030)

#### Scenario: Theme defaults to dark
WHEN the app loads without a stored preference
THEN `data-theme="dark"` is set on the root `<html>` element via `ThemeProvider`

### Requirement: Stateless auth API route

The public app SHALL provide a `/api/auth/nonce` GET route and `/api/auth/verify` POST route for SIWE demonstration purposes. Nonces SHALL be stored in memory with a short TTL (5 minutes) and no persistence across restarts.

#### Scenario: Nonce is generated on request
WHEN GET `/api/auth/nonce?address=0x...` is called
THEN a cryptographically random nonce string is returned and associated with the address in memory

#### Scenario: Verify accepts a valid SIWE message
WHEN POST `/api/auth/verify` is called with a valid signed SIWE message and matching nonce
THEN a signed JWT is returned with 200 status

#### Scenario: Verify rejects a consumed nonce
WHEN POST `/api/auth/verify` is called twice with the same nonce
THEN the second request returns 401
