> Closure note (2026-05-17): Archive this change as the delivered chapter-style `showcase-public` baseline. The current app already ships `/core`, `/wallet`, `/keys`, `/siwe`, `/defi`, `/ui-kit`, plus `/api/auth/*` and `/api/rpc/[space]`. Remaining hardware-wallet and legacy-gap work is now tracked in `artifacts/plan/phase-2-showcase-public.md`.

## 1. Landing page

- [x] 1.1 Implement `app/page.tsx`: hero section with framework tagline and "Get Started" button
- [x] 1.2 Add chapter feature card grid: one card per chapter (core, wallet, keys, siwe, defi, ui-kit) with icon, title, and one-line description
- [x] 1.3 Wire each chapter card to navigate to its route via Next.js `<Link>`

## 2. Core chapter

- [x] 2.1 Implement `app/core/page.tsx` with Shell layout and section sidebar (chains, rpc, codec, units)
- [x] 2.2 Chain list section: call `listChains()` from `@cfxdevkit/core` and render results in a table DemoCard
- [x] 2.3 RPC section: button that POSTs to `/api/rpc/espace` with `eth_blockNumber`, renders result in LogBox
- [x] 2.4 Address codec section: text input → `base32ToHex` / `hexToBase32` with copy button via CodeSnippet
- [x] 2.5 Units section: static DemoCard showing `formatCFX`, `formatGDrip`, `parseCFX` examples with computed results

## 3. Wallet chapter

- [x] 3.1 Implement `app/wallet/page.tsx` with sections: connect, account, core-wallet, chain-switch
- [x] 3.2 Connect section: render `ConnectButton` from showcase-ui; show wallet picker flow
- [x] 3.3 Account section: `useAccount` + `useBalance` display (address, balance, chainId) in a DemoCard
- [x] 3.4 Core wallet section: `useCoreWallet` — show Fluent account address and Core Space balance
- [x] 3.5 Chain switch section: two buttons (eSpace mainnet / testnet), call `useSwitchChain`, show active chain with StatusBadge

## 4. Keys chapter

- [x] 4.1 Implement `app/keys/page.tsx` with sections: generate, validate, derive
- [x] 4.2 Generate section: "Generate Mnemonic" button → `generateMnemonic()` → display words in styled grid
- [x] 4.3 Validate section: textarea input → `validateMnemonic()` → StatusBadge (ok/error)
- [x] 4.4 Derive section: mnemonic input + "Derive" button → `deriveDualAccounts(mnemonic, 0)` → show eSpace and Core addresses with CodeSnippet

## 5. SIWE chapter

- [x] 5.1 Implement `app/siwe/page.tsx` with sections: nonce, sign, verify, result
- [x] 5.2 Nonce section: address from `useAccount`; "Request Nonce" button → GET `/api/auth/nonce?address={address}` → display nonce in LogBox
- [x] 5.3 Sign section: "Sign SIWE Message" button → `createSiweMessage(...)` → `useSigner` to sign → display signature in CodeSnippet
- [x] 5.4 Verify section: "Verify on Server" button → POST `/api/auth/verify` with message + signature → display raw JWT in LogBox
- [x] 5.5 Result section: decode JWT client-side with `jose` → display parsed payload (address, iat, exp) in DemoCard

## 6. DeFi chapter

- [x] 6.1 Implement `app/defi/page.tsx` (`'use client'`) with sections: token-picker, portfolio, swap
- [x] 6.2 Token picker section: render `TokenPicker` with static list (WCFX, USDT, ETH on eSpace testnet); show selected token in DemoCard
- [x] 6.3 Portfolio section: render `PortfolioTable` with `useTokenBalance` for each static token; show balances for connected wallet
- [x] 6.4 Swap section: render `SwapWidget` shell; overlay a "Bring your own DexAdapter" notice card

## 7. UI Kit chapter

- [x] 7.1 Implement `app/ui-kit/page.tsx` with sections: theme, components, tokens
- [x] 7.2 Theme section: dark/light toggle button that calls `ThemeProvider` setter; show current theme name
- [x] 7.3 Components section: render Shell, Sidebar, DemoCard, LogBox, CodeSnippet, StatusBadge all in example configurations within nested DemoCards
- [x] 7.4 Token table section: render a table of all `--cfx-color-*`, `--cfx-space-*`, `--cfx-radius-*` tokens with their category, name, and a color swatch or computed value

## 8. RPC proxy API route

- [x] 8.1 Implement `/api/rpc/[space]/route.ts`: validate `space` ∈ `{espace, core}`, POST to public RPC endpoint, return response
- [x] 8.2 Add per-IP in-memory token bucket rate limiter (10 req/s): reject with 429 when exceeded
- [x] 8.3 Map `espace` → `https://evmtestnet.confluxrpc.com` (testnet) and `core` → `https://test.confluxrpc.com`

## 9. Validation

- [x] 9.1 `pnpm --filter @cfxdevkit/example-showcase-public tsc --noEmit` passes with no errors
- [x] 9.2 `pnpm --filter @cfxdevkit/example-showcase-public build` succeeds
- [x] 9.3 `pnpm run check:hotspots` shows no new hard violations (all new page files under 300 lines)
