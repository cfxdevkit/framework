## 1. Tailwind & Layout Foundation

- [x] 1.1 Verify `tailwind.config.ts` has `conflux-*` color scale defined; add it if missing
- [x] 1.2 Rewrite `apps/frontend/src/app/layout.tsx`: switch to Tailwind classes, remove custom CSS imports, add `<NavBar />` inside providers, set `bg-slate-950 text-slate-100` on `<body>`
- [x] 1.3 Update page `<title>` in `layout.tsx` metadata to "Conflux Automation Site"

## 2. NavBar & WalletConnect Chip

- [x] 2.1 Create `src/components/shared/NavBar.tsx`: sticky top bar with logo (`⚡ Conflux Automation`), `Status` link, admin-gated `Safety` link, and `<WalletConnect />` on the right
- [x] 2.2 Create `src/components/shared/WalletConnect.tsx`: compact chip with address + SIWE status dot (green/orange/spinner), copy-to-clipboard on address click, disconnect button when authenticated, "Sign In" retry when unsigned, "Switch Network" when wrong chain

## 3. Auth Context — Auto-sign

- [x] 3.1 Update `src/app/auth-context.tsx`: add `autoSignedForRef` guard that fires `login()` once when `isConnected` becomes true and `token` is null; clear JWT and reset guard on address switch

## 4. Home Page State Machine

- [x] 4.1 Rewrite `src/app/page.tsx` as a full auth state machine: not-connected hero → wrong network gate → auto-sign spinner → retry sign-in → authenticated dashboard layout
- [x] 4.2 Implement the authenticated section of `page.tsx`: "My Strategies" heading with badge, three action buttons (Wrap wCFX, Approvals, + New Strategy), and `<Dashboard />` below
- [x] 4.3 Implement `StrategyModal` in `page.tsx`: full-screen modal wrapping `<StrategyBuilder onSuccess={close} onSubmittingChange={setTxInProgress} />`; blocks close during transaction

## 5. Dashboard Component

- [x] 5.1 Create `src/components/Dashboard/Dashboard.tsx`: extracts jobs-fetch + SSE logic from `CasConsole`, renders the job list with token metadata cache, cancel button, and status badges; accepts `onCreateNew` prop to trigger the new strategy modal

## 6. WcfxWrapModal

- [x] 6.1 Create `src/components/StrategyBuilder/WcfxWrapModal.tsx`: controlled modal (`open`/`onClose`) with wrap and unwrap tabs, CFX/wCFX balance display, amount input with validation, and `deposit()`/`withdraw()` contract calls

## 7. ApprovalWidget Modal Refactor

- [x] 7.1 Update `src/components/ApprovalWidget.tsx`: add `open: boolean` and `onClose: () => void` props; render the existing content inside an overlay that conditionally mounts when `open` is true

## 8. Route Fixes

- [x] 8.1 Replace `src/app/dashboard/page.tsx` content with `redirect('/')` from `next/navigation`
- [x] 8.2 Replace `src/app/create/page.tsx` content with `redirect('/')` (or delete route if no external links)

## 9. Cleanup

- [x] 9.1 Delete `src/components/CasConsole.tsx`
- [x] 9.2 Delete `src/components/WalletPanel.tsx`
- [x] 9.3 Delete `src/components/EspaceWalletModal.tsx`
- [x] 9.4 Remove `src/app/styles/` directory and all custom CSS files (nav.css, hero.css, layout.css, forms.css, table.css, strategy.css) after verifying no remaining references

## 10. Documentation

- [x] 10.1 Update `projects/cas/STRUCTURE.md` to reflect new component tree (shared/NavBar, shared/WalletConnect, Dashboard/Dashboard, StrategyBuilder/WcfxWrapModal)
