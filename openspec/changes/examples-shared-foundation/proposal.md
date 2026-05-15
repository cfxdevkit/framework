## Why

The current `projects/examples` showcase is a collection of aging Vite SPAs that duplicate logic the framework now provides (`wallet-state.ts`, `theme.css`, custom `ConnectWall`) and require a gateway proxy to stitch them together. The showcase cannot be deployed, cannot serve as living documentation, and no longer demonstrates idiomatic use of the framework packages it's supposed to showcase. A clean foundation — a shared UI package rebuilt on `@cfxdevkit/theme` + `@cfxdevkit/wallet-connect`, and two purpose-built Next.js apps — unblocks all subsequent example chapters.

## What Changes

- **New**: `packages/showcase-ui` is rewritten from scratch on top of `@cfxdevkit/theme` and `@cfxdevkit/wallet-connect/ui`; the custom `theme.css`, `wallet-state.ts`, `core-wallet-primitives.ts`, and `ConnectWall.tsx` are removed and replaced by framework primitives
- **New**: `apps/showcase-public` — a Next.js 15 app (App Router) with empty route stubs for all public chapters (`/core`, `/wallet`, `/keys`, `/siwe`, `/defi`, `/ui-kit`) and stateless API routes (`/api/auth/*`, `/api/rpc/*`)
- **New**: `apps/showcase-local` — a Next.js 15 app (App Router) with empty route stubs for all local chapters (`/devnode`, `/keystore`, `/session-key`, `/compiler`, `/deploy`) and Node.js API routes
- Shared `Shell`, `Sidebar`, `DemoCard`, `LogBox`, `CodeSnippet`, `StatusBadge` components live in `packages/showcase-ui` and are consumed by both apps
- Both apps wire `@cfxdevkit/theme/css`, `ThemeProvider`, wagmi `WagmiProvider`, `QueryClientProvider`, and `CfxProvider` in their root layout
- **BREAKING**: old `packages/showcase-ui` API (`ShowcaseNav`, `PanelSidebar`, `useActivePanelState`, `wallet-state`, `ConnectWall`) is removed — consuming apps (the old Vite SPAs) will be archived in a separate change

## Capabilities

### New Capabilities

- `showcase-public-app`: Next.js public showcase app skeleton with all chapter routes stubbed, wagmi+theme+cfx provider wiring, and shared layout
- `showcase-local-app`: Next.js local devkit showcase app skeleton with all chapter routes stubbed, Node.js API route scaffolding, and shared layout
- `showcase-ui-kit`: Shared UI package for both showcase apps — Shell, Sidebar, DemoCard, LogBox, CodeSnippet, StatusBadge — built on `@cfxdevkit/theme` tokens and `@cfxdevkit/wallet-connect/ui`

### Modified Capabilities

## Impact

- `projects/examples/packages/showcase-ui/` — full rewrite; all existing exports removed; new exports: `Shell`, `Sidebar`, `DemoCard`, `LogBox`, `CodeSnippet`, `StatusBadge`, re-exports of `@cfxdevkit/theme` and `@cfxdevkit/wallet-connect/ui`
- `projects/examples/apps/showcase-public/` — new Next.js app; `package.json` named `@cfxdevkit/example-showcase-public`
- `projects/examples/apps/showcase-local/` — new Next.js app; `package.json` named `@cfxdevkit/example-showcase-local`
- `.moon/workspace.yml` — register both new apps
- `@cfxdevkit/theme`, `@cfxdevkit/wallet-connect`, `@cfxdevkit/react` — consumed as dependencies (no changes to those packages)
