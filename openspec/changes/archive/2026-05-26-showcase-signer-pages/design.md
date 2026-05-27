## Context

Next.js App Router supports nested layouts. Each `app/keys/<device>/page.tsx` gets its own
route, title, and error boundary automatically. The shared `SiteLayout` wrapper provides the
nav bar; each page uses `SiteLayout` directly. No new layout file is needed.

The existing panel files (`memory-panel.tsx`, `ledger-panel.tsx`, `onekey-panel.tsx`,
`onekey-widgets.tsx`, `panel-styles.ts`, `wallet-summary.tsx`, `balance-context.ts`)
stay in `app/keys/` — they are imported from the sub-pages. This avoids moving files and
keeps the git diff minimal.

## Goals / Non-Goals

**Goals:**
- `/keys/onekey` contains only OneKey UI; Ledger imports are not bundled on that route
- Deep-linking to `/keys/onekey` works from docs, README, etc.
- Overview at `/keys` provides a clear visual entry point with the comparison matrix

**Non-Goals:**
- Moving the panel component files (they stay in `app/keys/`)
- Changing any panel logic or styling

## Decisions

**`DeviceLinkCard` on the overview.** Three cards replacing the `HardwareWalletSection`
on `/keys`: each shows device name, brief capability list, and a `Next/Link` to the
sub-route. Cards share `PANEL_STYLE` from `panel-styles.ts`.

**Back navigation.** Each sub-page has a breadcrumb: `← Keys & Signers` linking to `/keys`.
Implemented as a small inline link, not a separate layout.

## Risks / Trade-offs

Minimal — purely additive routing. The existing panel components are unchanged.
