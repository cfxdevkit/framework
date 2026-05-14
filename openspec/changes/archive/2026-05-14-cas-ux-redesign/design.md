## Context

The CAS frontend was initially ported from the original `conflux-cas` application as a developer console (`CasConsole`) to verify the porting was progressing correctly. The original production app uses a single-page layout where the home route (`/`) serves as both the landing page and the authenticated dashboard. The port diverged: it routes authenticated users to `/dashboard` which renders a dev tool with duplicate wallet controls and no Tailwind styling.

The original reference is at `/workspaces/root/.cfxdevkit/cas/conflux-cas/frontend/`. The component and routing structure has been fully analyzed and is used as the ground truth for this redesign.

Current state:
- `layout.tsx` uses custom CSS class imports (no Tailwind)
- `page.tsx` is a static hero with separate connect/sign-in steps and a link to `/dashboard`
- `dashboard/page.tsx` renders `CasConsole` (dev tool)
- `CasConsole` contains `WalletPanel` — a duplicate auth flow
- Auth is manual: user clicks "Sign in" after connecting
- No persistent NavBar with wallet status

Target state mirrors the original:
- `layout.tsx` uses Tailwind + persistent sticky NavBar
- `page.tsx` is a state machine: hero → network gate → auto-sign → strategy dashboard
- `dashboard/page.tsx` redirects to `/`
- NavBar contains compact wallet chip (address + SIWE status dot)
- Auth is automatic on connect (auto-sign fires once per connection)

## Goals / Non-Goals

**Goals:**
- Replicate the page-level UX flow of `conflux-cas` exactly: hero → wallet connect → auto-sign → single-page strategy dashboard
- Implement persistent NavBar with `WalletConnect` chip (green/orange/spinner SIWE status dot)
- Wire `StrategyBuilder`, `ApprovalWidget`, `WcfxWrapModal` as modals on the home page
- Switch styling from custom CSS classes to Tailwind utility classes with the `conflux-*` color scale
- Remove dev-only components (`CasConsole`, `WalletPanel`, `EspaceWalletModal`)
- Dashboard state: job list rendered directly on page, modals for all creation/management flows

**Non-Goals:**
- Backend API changes — no endpoint additions or modifications
- Strategy logic changes — `StrategyBuilder` business logic is unchanged
- Adding new strategy types beyond the existing limit order and DCA
- Mobile-specific layout (responsive follows from Tailwind, but no native mobile app target)
- SSE connection changes

## Decisions

### D1: Single route — home page is the dashboard

**Decision**: `/` handles all states. No separate `/dashboard` route.

**Rationale**: The original CAS works this way. Having a separate `/dashboard` route created the UX problem of needing to navigate after sign-in. The page transformation approach (hero → dashboard in-place) avoids navigation and keeps the URL stable for users who bookmark the app.

**Alternative considered**: Keep `/dashboard` but make it auth-protected and move `CasConsole` content there. Rejected — this preserves the duplicate auth problem and doesn't match the original.

### D2: Auto-sign on wallet connect

**Decision**: When `isConnected` becomes true and no valid JWT exists, the auth context fires `login()` automatically. The auto-sign guard (`autoSignedForRef`) prevents re-firing on re-renders. If the user rejects, a manual retry button appears.

**Rationale**: This is the original CAS behavior. Eliminates the two-step "connect then sign" UX which confused the explore analysis.

**Alternative considered**: Keep manual sign-in button. Rejected — the original eliminates this step.

### D3: Tailwind replaces custom CSS

**Decision**: Remove all `styles/*.css` imports from `layout.tsx`; use Tailwind utility classes as in the original. The `conflux-*` color scale (already present in `tailwind.config.ts`) is used for branded elements.

**Rationale**: The original uses Tailwind throughout. The custom CSS system is a divergence that makes the port harder to compare against the original and maintain.

**Alternative considered**: Retrofit Tailwind on top of existing CSS. Rejected — creates specificity conflicts and doesn't simplify maintenance.

### D4: Inject wagmi `injected()` connector directly — no modal

**Decision**: Wallet connection uses `connect({ connector: injected() })` directly from the connect button. `EspaceWalletModal` is removed.

**Rationale**: The original CAS uses `injected()` directly. The framework wallet modal was added during porting but is not part of the original flow. For a single MetaMask-style connector, a picker modal adds no value.

### D5: WcfxWrapModal is a new component

**Decision**: Implement `WcfxWrapModal` as a standalone modal component consuming wagmi's `useWriteContract`. Uses the `WCFX_ABI` already in `lib/contracts.ts`.

**Rationale**: The original has this component at `components/StrategyBuilder/WcfxWrapModal.tsx`. The current port does not have it. It is essential for users who need to convert native CFX to wCFX before creating strategies.

### D6: Dashboard component reuse

**Decision**: The existing `JobsTable` and jobs-fetching logic from `CasConsole` is extracted into a proper `Dashboard` component (matching the original's `Dashboard.tsx`). All SSE and polling logic lives in `Dashboard`.

**Rationale**: `CasConsole` mixed auth controls with job display. Separating them makes `Dashboard` a pure "show my jobs" component, composable as a section on the home page.

## Risks / Trade-offs

- **[Tailwind purge]** → Ensure `tailwind.config.ts` content glob covers all new component paths. The `conflux-*` scale must be defined in the config (check existing config before assuming it's present).
- **[Auto-sign timing]** → The `autoSignedForRef` guard must be carefully ported from the original. Getting this wrong leads to infinite sign loops in React StrictMode. Use the original's `useRef` + `useEffect` pattern exactly.
- **[Existing tests]** → Any Vitest tests referencing `CasConsole`, `WalletPanel`, or `EspaceWalletModal` will fail. These tests should be deleted or updated as part of this change.
- **[SSE EventSource]** → The SSE connection in `Dashboard` must clean up on unmount to prevent dangling connections when the user navigates away.

## Migration Plan

1. Keep the existing `CasConsole`, `WalletPanel`, `EspaceWalletModal` files intact until the new components fully replace them (deletion is the last step per tasks).
2. New components go in `src/components/shared/` (NavBar, WalletConnect) and `src/components/StrategyBuilder/WcfxWrapModal.tsx`.
3. Rewrite `layout.tsx` → `page.tsx` → `dashboard/page.tsx` in order.
4. Update `auth-context.tsx` to add auto-sign behavior.
5. Update `ApprovalWidget` to accept `open`/`onClose` props.
6. Delete dev-only components.
7. Update `STRUCTURE.md`.

Rollback: All changes are in `projects/cas/apps/frontend/src/`. Git revert of this path is the rollback.
