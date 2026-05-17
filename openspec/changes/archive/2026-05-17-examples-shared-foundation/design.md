## Context

The existing `projects/examples` suite is five separate Vite SPAs proxied through a gateway. Each app maintains its own copy of theme CSS variables, wallet connection state management, and UI primitives. Since the initial porting work, the framework has grown `@cfxdevkit/theme` (design tokens + ThemeProvider), `@cfxdevkit/wallet-connect` (ConnectButton, WalletPickerModal, useCoreWallet, walletState helpers, SIWE helpers), and `@cfxdevkit/react` (CfxProvider, useAccount, useBalance). The showcase currently bypasses all of this, making it a poor guide for how to actually use the framework.

The goal of this change is to lay the structural foundation that all subsequent example chapters will build on: a rebuilt shared UI package and two clean Next.js app skeletons.

## Goals / Non-Goals

**Goals:**
- Rebuild `packages/showcase-ui` to be a thin wrapper over framework packages — zero bespoke wallet state logic
- Create `apps/showcase-public` (Next.js, deployable to Vercel/Netlify, targets testnet/mainnet, no server filesystem)
- Create `apps/showcase-local` (Next.js, local-only, Node.js runtime, local devnode + file keystore)
- Both apps share a single `packages/showcase-ui` for Shell, Sidebar, and presentational components
- Provider wiring (theme, wagmi, react-query, CfxProvider) done correctly once in each layout
- All chapter route pages are stubs (`/core` → "Coming soon" etc.) so the apps are runnable from day one

**Non-Goals:**
- Implementing any chapter content (that's changes 2 and 3)
- Archiving the old Vite apps (that's change 4)
- Adding new framework packages or changing `@cfxdevkit/theme` / `@cfxdevkit/wallet-connect`

## Decisions

### 1. Next.js App Router, not Pages Router
**Decision:** App Router (`app/` directory), React Server Components disabled on interactive pages via `'use client'`  
**Rationale:** App Router is the current Next.js default; simpler nested layouts; `generateStaticParams` will let the public app export as static HTML for deployment. Pages Router adds no benefit for a showcase with no complex data fetching.

### 2. One shared `packages/showcase-ui`, not two
**Decision:** Both apps import from `@cfxdevkit/example-showcase-ui`.  
**Rationale:** Shell, Sidebar, DemoCard, LogBox, CodeSnippet are identical across both apps. Duplicating them would create drift. The package is `Tier 2` (may import from framework, not from the apps).

### 3. `packages/showcase-ui` uses framework tokens, not custom CSS variables
**Decision:** `theme.css` is removed entirely. The package imports `@cfxdevkit/theme/css` as a side-effect and uses `var(--cfx-color-*)` / `var(--cfx-space-*)` tokens.  
**Rationale:** This is the primary purpose of the rewrite — demonstrating and proving `@cfxdevkit/theme`. The old bespoke `--bg`, `--accent`, `--panel` variables are replaced by their `--cfx-*` equivalents.

### 4. Wagmi scope: eSpace only in `showcase-public`, Core via `useCoreWallet` hook
**Decision:** `showcase-public` wagmi config uses `createSupportedEspaceChains()` (eSpace mainnet + testnet). Core Space wallet uses `useCoreWallet()` from `@cfxdevkit/wallet-connect/hooks` (Fluent). No attempt to put Core Space in wagmi.  
**Rationale:** This mirrors idiomatic framework usage. wagmi is the EVM (eSpace) connector; `useCoreWallet` is the Fluent/Core connector.

### 5. `showcase-local` uses Node.js runtime explicitly
**Decision:** `showcase-local/next.config.ts` sets no `output: 'export'`. API routes use `export const runtime = 'nodejs'` explicitly.  
**Rationale:** `devnode`, `compiler`, and `keystore-file` all require Node.js child processes or filesystem. The local app must never be deployed.

### 6. Sidebar + panel routing via URL search params, not file-based sub-routes
**Decision:** Each chapter page manages its own section with `?section=<id>` URL param (same pattern as existing `useActivePanelState`).  
**Rationale:** Keeps each route a single file with its own `<Sidebar>` + panel render tree. App Router file-based routing would create dozens of tiny files for what are really tab-like sub-sections.

## Risks / Trade-offs

- **`@cfxdevkit/theme/css` import in Next.js layout**: CSS side-effect imports from `node_modules` work in Next.js App Router but require the package's `exports` field to expose the CSS file. Verify `@cfxdevkit/theme` has `"./css": "./src/css/base.css"` in its exports. → Mitigation: check during setup; fall back to copying the CSS inline if needed.
- **wagmi SSR hydration**: wagmi v2 with App Router needs `'use client'` on the provider wrapper and careful `initialState` handling to avoid hydration mismatches. → Mitigation: follow CAS's `WagmiProvider` pattern (already solved there).
- **`showcase-local` accidentally deployed**: Nothing technically prevents someone from deploying the local app. → Mitigation: add a `NEXT_PUBLIC_LOCAL_ONLY=true` env check that renders a clear error page if the devnode binary is not found.

## Migration Plan

No migration needed — both apps are new. The old Vite apps remain in place until change 4 (`examples-archive-old`) runs. The workspace registers both new apps in `.moon/workspace.yml` alongside the old ones with no conflict.
