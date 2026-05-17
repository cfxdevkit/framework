# Proposal: examples-showcase-public

## Why

The Conflux framework has a fully deployable surface — `@cfxdevkit/core` (RPC + codecs + units), `@cfxdevkit/wallet-connect` (ConnectButton, SIWE, Fluent, wagmi), `@cfxdevkit/react` (CfxProvider, hooks), and `@cfxdevkit/defi-react` (DeFi widgets) — but no public deployment that developers can visit without running the stack locally. The existing `apps/showcase-browser` is a Vite SPA gated behind a local gateway proxy, making it unreachable for anyone evaluating the framework online. This change fills all chapter content in the `apps/showcase-public` skeleton created by `examples-shared-foundation`.

## What Changes

- **`apps/showcase-public/app/page.tsx`** — landing page with framework overview, feature cards, and links to each chapter
- **`apps/showcase-public/app/core/page.tsx`** — RPC calls via `createClient`; chain listing; address codec round-trip (base32 ↔ hex); unit formatting (CFX, GDrip)
- **`apps/showcase-public/app/wallet/page.tsx`** — `ConnectButton`/`WalletPickerModal` flow; `useAccount` + `useBalance` display; `useCoreWallet` for Fluent; chain switch (eSpace testnet ↔ mainnet)
- **`apps/showcase-public/app/keys/page.tsx`** — `generateMnemonic`, `validateMnemonic`; `deriveDualAccounts` (HD path); address display (no private key storage, educational only)
- **`apps/showcase-public/app/siwe/page.tsx`** — full SIWE round-trip: nonce fetch → `createSiweMessage` → wallet sign → `/api/auth/verify` → session display
- **`apps/showcase-public/app/defi/page.tsx`** — `TokenPicker`, `PortfolioTable`, `useTokenBalance`, `SwapWidget` stub (requires DexAdapter)
- **`apps/showcase-public/app/ui-kit/page.tsx`** — `ThemeProvider` dark/light switch demo; all `showcase-ui` component catalog; design token table

## New Capabilities

- `showcase-public-chapters`: all seven chapter pages with live interactive demos
- `showcase-public-rpc-proxy`: `/api/rpc/[space]/route.ts` that forwards to public Conflux RPC (avoids CORS in browser, rate-limited per IP)

## Dependencies

- Depends on: `examples-shared-foundation` (apps/showcase-public skeleton + packages/showcase-ui)
- Packages used: `@cfxdevkit/core`, `@cfxdevkit/wallet-connect`, `@cfxdevkit/react`, `@cfxdevkit/defi-react`, `@cfxdevkit/theme`, `@cfxdevkit/example-showcase-ui`
