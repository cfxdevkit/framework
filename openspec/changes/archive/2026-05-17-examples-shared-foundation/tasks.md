> Closure note (2026-05-17): Archive this change as complete. The rebuilt `projects/examples/packages/showcase-ui` package and the example app skeletons landed; follow-on work now lives in the plan docs under `artifacts/plan/`.

## 1. Rebuild `packages/showcase-ui`

- [x] 1.1 Delete all existing source files in `packages/showcase-ui/src/` (theme.css, shell.tsx, devnode.tsx, all lib/ and components/ files)
- [x] 1.2 Update `package.json` dependencies: add `@cfxdevkit/theme`, `@cfxdevkit/wallet-connect`; remove any bespoke wallet-state deps
- [x] 1.3 Implement `Shell` component: top nav bar (title, theme toggle, ConnectButton slot) + sidebar slot + main content area using `--cfx-color-*` tokens
- [x] 1.4 Implement `Sidebar` component: grouped nav items with active state, `--cfx-color-*` tokens, keyboard accessible
- [x] 1.5 Implement `DemoCard` component: bordered card with `title`, `description` props and children slot
- [x] 1.6 Implement `LogBox` component: timestamped log entries list, colored by level (info/warn/error) using feedback tokens
- [x] 1.7 Implement `CodeSnippet` component: monospace code block with copy-to-clipboard button
- [x] 1.8 Implement `StatusBadge` component: three states (ok/error/pending) mapped to success/danger/warning tokens
- [x] 1.9 Re-export `ConnectButton` and `WalletPickerModal` from `@cfxdevkit/wallet-connect/ui` in `src/index.ts`
- [x] 1.10 Verify TypeScript builds with `tsc --noEmit`

## 2. Create `apps/showcase-public` skeleton

- [x] 2.1 Create `apps/showcase-public/` directory with `package.json` (`@cfxdevkit/example-showcase-public`), `tsconfig.json`, `next.config.ts`, `moon.yml`
- [x] 2.2 Register `projects/examples/apps/showcase-public` in `.moon/workspace.yml`
- [x] 2.3 Add dependencies: `next`, `react`, `react-dom`, `wagmi`, `viem`, `@tanstack/react-query`, `@cfxdevkit/theme`, `@cfxdevkit/wallet-connect`, `@cfxdevkit/react`, `@cfxdevkit/core`, `@cfxdevkit/example-showcase-ui`
- [x] 2.4 Create `app/layout.tsx`: import `@cfxdevkit/theme/css` + `@cfxdevkit/theme/dark`, mount `ThemeProvider`, `WagmiProvider` (eSpace mainnet + testnet via `createSupportedEspaceChains()`), `QueryClientProvider`, `CfxProvider`
- [x] 2.5 Create `app/providers.tsx` (`'use client'`): wagmi + react-query provider wiring (follow CAS pattern)
- [x] 2.6 Create stub page for `/` (landing: framework overview, links to chapters)
- [x] 2.7 Create stub pages for `/core`, `/wallet`, `/keys`, `/siwe`, `/defi`, `/ui-kit` — each renders Shell + "Chapter coming soon" DemoCard
- [x] 2.8 Create `/api/auth/nonce/route.ts`: GET handler, generate nonce via `generateSiweNonce()`, store in Map with 5-min TTL, return JSON
- [x] 2.9 Create `/api/auth/verify/route.ts`: POST handler, `verifySiweMessage()`, one-time nonce consumption, return signed JWT
- [x] 2.10 Create `/api/rpc/[space]/route.ts`: thin proxy to public Conflux RPC to avoid CORS issues in local development
- [x] 2.11 Verify `pnpm dev` starts and all routes respond
- [x] 2.12 Verify `pnpm build` succeeds with no TypeScript errors

## 3. Create `apps/showcase-local` skeleton

- [x] 3.1 Create `apps/showcase-local/` directory with `package.json` (`@cfxdevkit/example-showcase-local`), `tsconfig.json`, `next.config.ts` (no `output: 'export'`), `moon.yml`
- [x] 3.2 Register `projects/examples/apps/showcase-local` in `.moon/workspace.yml`
- [x] 3.3 Add dependencies: `next`, `react`, `react-dom`, `wagmi`, `viem`, `@tanstack/react-query`, `@cfxdevkit/theme`, `@cfxdevkit/wallet-connect`, `@cfxdevkit/react`, `@cfxdevkit/core`, `@cfxdevkit/devnode`, `@cfxdevkit/compiler`, `@cfxdevkit/services`, `@cfxdevkit/wallet`, `@cfxdevkit/example-showcase-ui`
- [x] 3.4 Create `app/layout.tsx`: same provider pattern as public app but wagmi config includes eSpace local (chainId 2030) via `createSupportedEspaceChains({ localRpcUrl: ... })`
- [x] 3.5 Create stub page for `/` (landing: local devkit overview, links to chapters, "run locally" notice)
- [x] 3.6 Create stub pages for `/devnode`, `/keystore`, `/session-key`, `/compiler`, `/deploy` — each renders Shell + "Chapter coming soon" DemoCard
- [x] 3.7 Create `/api/health/route.ts` with `export const runtime = 'nodejs'`: returns `{ ok: true }`
- [x] 3.8 Create empty scaffolded API route files with `export const runtime = 'nodejs'` for: `/api/devnode/[...path]/route.ts`, `/api/keystore/[...path]/route.ts`, `/api/session-key/[...path]/route.ts`, `/api/compile/[...path]/route.ts`, `/api/deploy/[...path]/route.ts`
- [x] 3.9 Verify `pnpm dev` starts and all routes respond
- [x] 3.10 Verify `pnpm build` succeeds with no TypeScript errors

## 4. Workspace integration

- [x] 4.1 Run `pnpm install` from workspace root to link new packages
- [x] 4.2 Verify `pnpm --filter @cfxdevkit/example-showcase-ui build` passes
- [x] 4.3 Verify `pnpm --filter @cfxdevkit/example-showcase-public build` passes
- [x] 4.4 Verify `pnpm --filter @cfxdevkit/example-showcase-local build` passes
- [x] 4.5 Run `pnpm run check:hotspots` from workspace root and confirm no new hard violations
