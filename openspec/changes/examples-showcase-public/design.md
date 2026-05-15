## Context

`apps/showcase-public` exists as a skeleton (from `examples-shared-foundation`) with stub chapter routes and provider wiring in place. This change fills in the content for all seven chapters. Each chapter targets developers evaluating the framework: the demos must be self-contained, runnable against public testnet RPC, and require no backend beyond the two Next.js API routes already scaffolded (SIWE auth + RPC proxy).

Key framework API surface covered by each chapter:
- **core**: `createClient`, `listChains`, `espaceTestnet`, `coreTestnet`, `base32ToHex`, `hexToBase32`, `formatCFX`, `formatGDrip`, `parseCFX`
- **wallet**: `ConnectButton`, `WalletPickerModal`, `useCoreWallet`, `useAccount`, `useBalance`, `useSigner`, wagmi `useChainId`, `useSwitchChain`
- **keys**: `generateMnemonic`, `validateMnemonic`, `deriveDualAccounts`
- **siwe**: `createSiweMessage`, `verifySiweMessage`, `generateSiweNonce`, `parseSiweMessage`
- **defi**: `TokenPicker`, `PortfolioTable`, `useTokenBalance`, `usePortfolio`
- **ui-kit**: `ThemeProvider`, all `showcase-ui` components, CSS token table

## Goals / Non-Goals

**Goals:**
- Every chapter page has at least one live interactive demo against testnet (or in-browser for keys)
- Each demo uses `DemoCard`, `LogBox`, `CodeSnippet`, `StatusBadge` from `@cfxdevkit/example-showcase-ui`
- SIWE chapter demonstrates a full stateless auth round-trip ending in a displayed JWT payload
- RPC proxy API route is rate-limited per IP (10 req/s via a simple in-memory token bucket) to prevent abuse
- TypeScript strict mode, no `any`

**Non-Goals:**
- SwapWidget full integration (DexAdapter is project-specific — show the component shell with a "bring your own adapter" note)
- Persistent user sessions (SIWE auth is demonstration only, JWT is not stored past page reload)
- Supporting Core Space RPC via proxy (only eSpace RPC is proxied; Core Space calls go direct)

## Decisions

### 1. No persistent auth state — SIWE result shown in-page only
**Decision:** After `/api/auth/verify` returns a JWT, decode it client-side with `jose` and display the payload in the UI. Do not store the JWT in a cookie or localStorage.  
**Rationale:** This is a demo, not a production auth flow. Storing JWTs introduces session management complexity (revocation, refresh) that is out of scope. The demo's value is showing the SIWE message → sign → verify → decoded claim flow.

### 2. RPC proxy is thin, stateless, rate-limited per IP
**Decision:** `/api/rpc/[space]/route.ts` validates `space` is `espace` or `core`, forwards the JSON-RPC body to the corresponding public endpoint, returns the response verbatim.  
**Rationale:** Pure RPC forwarding with no caching or transformation. Rate limiting prevents the public showcase from being used as an anonymous RPC relay. In-memory token bucket resets on restart (acceptable for a demo).

### 3. Keys chapter uses in-browser `@cfxdevkit/core` directly — no API route
**Decision:** Mnemonic generation and derivation run client-side in the browser via `@cfxdevkit/core` browser-safe exports.  
**Rationale:** The keys chapter is explicitly educational. Keeping everything in the browser makes it clear no credentials leave the device. No API involvement needed.

### 4. DeFi chapter uses mock token list, not live on-chain query for `TokenPicker`
**Decision:** `TokenPicker` is shown with a static token list (WCFX, USDT, ETH on eSpace testnet). `useTokenBalance` runs against the connected wallet if one is present.  
**Rationale:** Avoids dependency on a specific DEX/aggregator API for the demo. `SwapWidget` is displayed as a "bring your own DexAdapter" shell.

## Risks / Trade-offs

- **`@cfxdevkit/defi-react` SSR**: `SwapWidget` and `TokenPicker` may use browser APIs. `'use client'` directive on the defi page must cover the full component tree. → Mitigation: wrap entire chapter panel in a `dynamic(() => import('./DefiPanel'), { ssr: false })` if hydration errors occur.
- **SIWE `Buffer` polyfill**: `siwe` package requires `Buffer` in the browser. Next.js 14+ handles this via webpack config. → Mitigation: add `webpack: (config) => { config.resolve.fallback = { buffer: require.resolve('buffer/') }; return config; }` to `next.config.ts`.
- **RPC rate-limit bypass**: In-memory token bucket resets on cold start and doesn't share state across serverless instances. → Mitigation: acceptable for demo; document that production use should route through a proper RPC provider.

## Migration Plan

No migration required. This change only adds content to the skeleton pages created in `examples-shared-foundation`. The old Vite SPAs remain until `examples-archive-old` runs.
