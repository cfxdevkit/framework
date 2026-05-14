## Why

The current CAS frontend was ported as a developer console (`CasConsole`) that deviates from the original production UX. The home page sends authenticated users to a `/dashboard` route that renders a debug-oriented component with duplicate wallet controls. The original CAS had a single-page layout where authentication and strategy management coexist on one route, with modals for all creation flows.

## What Changes

- Replace `CasConsole` dev console with the proper single-page authenticated layout
- Remove `/dashboard` as a separate app route — all post-auth content lives on `/`
- Replace the hero → dashboard link flow with in-place page transformation on auth
- Replace manual "Sign in" button flow with automatic SIWE on wallet connect (auto-sign, one retry)
- Remove `WalletPanel` (standalone auth component) from the dashboard — wallet status moves to NavBar chip
- Replace `EspaceWalletModal` with inline `injected()` connect call (no modal needed)
- Rewrite `NavBar` to be persistent sticky with compact `WalletConnect` chip (address + SIWE dot)
- Wire `StrategyBuilder` as a full-screen modal on `/` (triggered by "+ New Strategy" button)
- Wire `ApprovalWidget` as a modal on `/` (triggered by "Approvals" button)
- Add `WcfxWrapModal` component for CFX ↔ wCFX wrapping (triggered by "Wrap wCFX" button)
- Switch from custom CSS class system to Tailwind utility classes throughout
- Update page title from "CAS Local Dev" to "Conflux Automation Site"
- Remove the separate `/create` route (strategy creation is via modal on `/`)

## Capabilities

### New Capabilities

- `cas-home-dashboard`: Single-page layout that transitions from landing hero → strategy dashboard on authentication; includes job list, action buttons (New Strategy, Wrap wCFX, Approvals), and modal overlays
- `cas-nav-wallet-widget`: Persistent NavBar with sticky positioning, address chip showing SIWE status (green=signed, orange=unsigned, spinner=in-progress), and auto-sign on connect
- `cas-wcfx-wrap-modal`: Modal for wrapping native CFX to wCFX and unwrapping wCFX back to CFX

### Modified Capabilities

- `cas-approval-widget`: Transitions from embedded component to modal pattern with `open`/`onClose` props
- `cas-api-proxy`: No change to proxy logic; `NEXT_PUBLIC_CAS_API_URL` env var convention stays

## Impact

- `projects/cas/apps/frontend/src/app/page.tsx` — full rewrite
- `projects/cas/apps/frontend/src/app/layout.tsx` — switch to Tailwind, add persistent NavBar
- `projects/cas/apps/frontend/src/app/dashboard/page.tsx` — change to `redirect('/')`
- `projects/cas/apps/frontend/src/app/create/` — remove route (or keep as redirect to `/`)
- `projects/cas/apps/frontend/src/app/auth-context.tsx` — add auto-sign on connect behavior
- `projects/cas/apps/frontend/src/components/CasConsole.tsx` — delete
- `projects/cas/apps/frontend/src/components/WalletPanel.tsx` — delete
- `projects/cas/apps/frontend/src/components/EspaceWalletModal.tsx` — delete (or keep if referenced elsewhere)
- New: `src/components/shared/NavBar.tsx`, `src/components/shared/WalletConnect.tsx`
- New: `src/components/StrategyBuilder/WcfxWrapModal.tsx`
- `projects/cas/apps/frontend/src/components/ApprovalWidget.tsx` — add `open`/`onClose` props
- `projects/cas/apps/frontend/tailwind.config.ts` — ensure `conflux-*` color scale is defined
- `projects/cas/STRUCTURE.md` — update to reflect new component tree
