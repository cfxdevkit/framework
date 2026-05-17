# Phase 1 — showcase-local: Architecture Truth Document + Cleanup + Extensions

**Workspace root:** `/workspaces/root`  
**App root:** `projects/examples/apps/showcase-local/` (all paths in this file are relative to this unless stated otherwise)

**Goal:** Remove all dead code and misaligned concepts from showcase-local; document the real architecture accurately so future agents can extend it correctly; identify any genuine gaps in the current panel set.

This is the most important phase. showcase-local has been a recurring pain point: the actual implementation is good, but accumulated dead code and deprecated design artifacts have caused agents to misread the architecture and introduce wrong patterns.

---

## The Actual Architecture (Ground Truth)

**showcase-local is a Next.js app router application. It has NO custom server-action API layer.**

The architecture has exactly two layers:

```
React UI (app router, client components)
    ↓ calls
ConfluxDevkitClient (HTTP client from @cfxdevkit/client)
    ↓ calls
devnode-server (Hono HTTP server from @cfxdevkit/devnode-server)
    ↓ manages
DevNode + Keystore + Compiler + Contracts + SessionKeys
```

### How state flows

```
ConfluxDevkitClient (HTTP client singleton — lib/devkit-client.ts)
    ↓ called by
app/workspace/keystore/runtime.ts  — polls keystore + devnode status on timer
app/workspace/keystore/actions.ts  — action handlers: setup, unlock, wallet CRUD
app/workspace/compose.ts           — compile/deploy/session-key state
app/workspace/compose-actions.ts   — action handlers: compile, deploy, issueSession
app/workspace/drafts.ts            — form drafts (Solidity source, passphrase, names)
app/workspace/shared.ts            — shared constants
    ↓ all merged by
app/showcase-workspace.tsx         — top-level orchestrator component
    ↓ passes combined props to
ShowcaseWorkspacePanelsProps       — defined in app/panels/shared.tsx
    ↓ consumed by
Individual panel components (each in app/panels/)
```

Nearly every panel is a **pure presentational component** — it receives data and callbacks via `ShowcaseWorkspacePanelsProps`, never calls the client directly.

**Current exception:** `app/panels/reveal.tsx` still calls `revealSecret()` from `app/keystore/client.ts` directly. Treat that as cleanup debt, not as the canonical pattern for new panels.

### What `ShowcaseWorkspacePanelsProps` contains

The type `ShowcaseWorkspacePanelsProps` is defined in `app/panels/shared.tsx`. It includes:

- `keystoreStatus`, `keystorePhase`, `keystoreError` — keystore backend state
- `wallets[]`, `activeWallet`, `walletAccounts[]` — wallet list + active selection
- `walletNameDrafts` — local rename drafts (Record<id, string>)
- `devnode` — devnode status (running, blockNumber, URLs)
- `devnodeAccounts[]` — genesis accounts with balances
- `nodeProfiles[]`, `selectedNodeProfile` — stored node configs
- `artifact` — last compiled ABI + bytecode
- `contracts[]`, `selectedContract` — deployed contract registry
- `issuedSession`, `sessionVerify` — session key state
- `network: 'local' | 'testnet' | 'mainnet'`
- `space: 'core' | 'espace'`
- `source` — Solidity source draft
- **Action callbacks** (not data fetchers):
  - `onStartDevnode`, `onStopDevnode`, `onRestartDevnode`, `onWipeDevnode`, `onMineBlock`
  - `onSetupKeystore`, `onUnlockKeystore`, `onLockKeystore`
  - `onCreateWallet`, `onActivateWallet`, `onDeleteWallet`, `onRenameWallet`, `onSetWalletNameDraft`
  - `onActivateAccount`
  - `onCompile`, `onDeploy`
  - `onIssueSessionKey`, `onVerifySessionKey`
  - `onFundAccount`
  - `onSelectNetwork`, `onSelectSpace`, `onSelectNodeProfile`

**Rule:** When adding a new panel, add the required data/callbacks to `ShowcaseWorkspacePanelsProps` (in `app/panels/shared.tsx`), implement the backing logic in `app/workspace/keystore/runtime.ts` (for polled state) or `app/workspace/compose.ts` / `app/workspace/compose-actions.ts` (for user-triggered actions), wire it in `app/showcase-workspace.tsx`, then write the panel as a pure component. Do not copy the current reveal-panel shortcut unless that exception is intentionally being formalized.

---

## Cleanup Targets — Verify, Then Delete or Trim

### 1. `app/keystore/client.ts` — Trim, Do Not Delete Blindly

**Full path:** `projects/examples/apps/showcase-local/app/keystore/client.ts`

**What it is:** A mixed bag of thin runtime client wrappers plus the reveal helper used by the Secret Reveal panel.

**Verified current state:** This file is **not fully dead**.
- `app/panels/reveal.tsx` imports `revealSecret()` and `RevealSecretResponse`
- `app/workspace/keystore/runtime.ts` imports `fetchDevnodeAccounts()`
- The remaining keystore CRUD wrappers appear to be unused

**Action:** Do a surgical cleanup instead of deleting the file wholesale.
- Keep or relocate `fetchDevnodeAccounts()`
- Keep or relocate `revealSecret()` and its response/input types
- Delete only the unused thin wrappers after confirming there are still no call sites
- Delete `RevealConsumeResponse` if it remains unused after the trim

> ⚠️ Do NOT attempt to expand `client.ts` into a new panel-facing API layer. The workspace state approach is still the correct architecture.

### 2. `lib/showcase-guide.ts` — Split Live Snippets from Dead Guide Metadata

**Full path:** `projects/examples/apps/showcase-local/lib/showcase-guide.ts`

**What it is:** A data file containing two different things:
- old guided-tutorial metadata (`LOCAL_SHOWCASE_TITLE`, `DEVNODE_SEED_WALLET_NAME`, `LOCAL_CHAPTERS`, `LOCAL_FLOW`)
- live code-snippet constants (`DEVNODE_API_SNIPPET`, `KEYSTORE_API_SNIPPET`, `COMPILER_SNIPPET`, `DEPLOY_SNIPPET`, `CUSTOM_OPERATION_SNIPPET`) that active panels still render

**History:** An early concept for a "guided tutorial" panel embedded in the dashboard. The concept was abandoned because the workspace itself demonstrates all the SDK features interactively — a separate linear tutorial adds no value and would need constant maintenance.

**Verified current state:** The file is **partially live**.
- `app/panels/setup.tsx`, `app/panels/keystore/index.tsx`, `app/panels/compose.tsx`, `app/panels/deploy.tsx`, and `app/panels/custom-operation.tsx` import snippet constants from it
- The tutorial metadata exports appear unused

**Action:** Extract the live snippet constants into a narrower file (for example `lib/showcase-snippets.ts`) or keep them in place, then delete only the unused tutorial metadata/types.

> ⚠️ The guide/tutorial concept is **deprecated**. Do not implement a guided walkthrough panel inside showcase-local. If a tutorial experience is needed in the future, it should be a separate app or a docs page — not embedded in the workspace dashboard.

### 3. `app/shell/stage.tsx` — Keep the Live Panel Stage, Remove the Dead Helper

**Full path:** `projects/examples/apps/showcase-local/app/shell/stage.tsx`

**What it is:** The file exports the live `ShowcaseWorkspacePanelStage` component plus an unused `resolveWorkspaceSteps()` helper.

**Verified current state:** `app/shell/index.tsx` imports `ShowcaseWorkspacePanelStage` from this file, so the file itself is live. The unused part is `resolveWorkspaceSteps()`.

**Action:** Remove `resolveWorkspaceSteps()` if it stays unused. Do **not** delete `app/shell/stage.tsx` unless the stage component is moved elsewhere first.

> If there is a genuine need for sequential step navigation in the shell (e.g., first-time setup flow), this should be redesigned from scratch based on the actual shell architecture — not revived from the stale helper.

### 4. `app/panels/keystore/styles.ts` — Partially Orphaned

**Full path:** `projects/examples/apps/showcase-local/app/panels/keystore/styles.ts`

**Current state:** Exports `cardStyle`, `sectionLabelStyle`, `addressRowStyle`. Only `cardStyle` is consumed (by `wallet-management.tsx` and `identity-card.tsx`).

**Action:** Delete `sectionLabelStyle` and `addressRowStyle` from `styles.ts`. Keep `cardStyle`.

### 5. `lib/local-runtime.ts` `readRuntimeActiveSigner()` — Unused Server Function

**Full path:** `projects/examples/apps/showcase-local/lib/local-runtime.ts`

**What it is:** An exported async function for reading the active signer from the runtime.

**Action:** Remove the export if it's not called. If the function is internally useful as a non-exported helper, remove the `export` keyword.

### 6. `app/workspace/shared.ts` `DEFAULT_PASSPHRASE` — Unused Constant

**Full path:** `projects/examples/apps/showcase-local/app/workspace/shared.ts`

**Action:** Delete if not used anywhere in the workspace state. If it was meant for development convenience, either wire it or delete it.

---

## What Currently Works (Do Not Touch)

All panel files live under `projects/examples/apps/showcase-local/app/panels/`.

The following panels are **fully functional** with real backend wiring:

| Panel | File | Status |
|-------|------|--------|
| Environment Setup | `app/panels/setup.tsx` | ✅ Working |
| Keystore & Wallets | `app/panels/keystore/index.tsx` | ✅ Working |
| Identity Card | `app/panels/keystore/identity-card.tsx` | ✅ Working |
| Wallet Management | `app/panels/keystore/wallet-management.tsx` | ✅ Working |
| Accounts + Faucet | `app/panels/accounts-section.tsx` | ✅ Working |
| Local Devnode | `app/panels/devnode.tsx` | ✅ Working |
| Compiler | `app/panels/compose.tsx` | ✅ Working |
| Deploy | `app/panels/deploy.tsx` | ✅ Working |
| Contract Context | `app/panels/contract-context.tsx` | ✅ Working |
| Session Key | `app/panels/custom-operation.tsx` | ✅ Working |
| Secret Reveal | `app/panels/reveal.tsx` | ✅ Working |

The shell, event log, sidebar, and top navigation are working.  
The multi-network toggle (`local` / `testnet` / `mainnet`) and space toggle (`core` / `espace`) are working.

---

## Genuine Gaps (What Might Be Missing)

After dead code cleanup, evaluate whether any of these need to be added:

### Gap 1: Accounts Panel
**Status: RESOLVED** — `app/panels/accounts-section.tsx` (`projects/examples/apps/showcase-local/app/panels/accounts-section.tsx`) already exists. Verify it is registered in `app/panels/registry.ts` and that faucet functionality is wired.

### Gap 2: SIWE Panel
The old showcase (backend showcase) had a SIWE authentication demo. showcase-local uses backend-managed wallets, so SIWE is less relevant here (SIWE is for authenticating browser wallet holders). However, if the devnode-server exposes a SIWE auth endpoint, a panel showing it could be useful.

**Decision:** Defer SIWE to showcase-public Phase 2. Do not add it to showcase-local.

### Gap 3: Reveal Panel Wire-up
Verify that `app/panels/reveal.tsx` is registered in `app/panels/registry.ts` and visible in the sidebar. The two-step reveal flow (`/api/keystore/reveal/request` + `/api/keystore/reveal/consume`) must be exercised.

---

## How to Add a New Panel (Canonical Pattern)

Any future OpenSpec that adds a panel to showcase-local must follow this exact pattern:

1. **Define what data and callbacks the panel needs**
2. **Add them to `ShowcaseWorkspacePanelsProps`** in `app/panels/shared.tsx` (`projects/examples/apps/showcase-local/app/panels/shared.tsx`)
3. **Implement the backing logic** in the appropriate workspace module:
   - State derived from polling the client → `app/workspace/keystore/runtime.ts`
   - Keystore action handlers → `app/workspace/keystore/actions.ts`
   - Compile/deploy/session-key actions → `app/workspace/compose-actions.ts`
4. **Wire it in** `app/showcase-workspace.tsx` — merge new state/callbacks into the props object
5. **Write the panel as a pure component**: `function MyPanel({ props }: { props: ShowcaseWorkspacePanelsProps })`
6. **Register in `app/panels/registry.ts`** with a section ID and label
7. **The panel must NOT**: import `ConfluxDevkitClient` directly, use Next.js `'use server'` directive, create its own `useEffect` polling loops, or import from `lib/showcase-guide.ts` (deleted)

---

## Task List for This Phase

All paths are under `projects/examples/apps/showcase-local/` unless stated. Run quality commands from `/workspaces/root`.

- [ ] Read `app/keystore/client.ts` call sites; keep `fetchDevnodeAccounts()` + `revealSecret()`, delete only unused wrappers
- [ ] Split `lib/showcase-guide.ts` into live snippet constants vs unused guide metadata; delete only the unused guide layer
- [ ] Remove `resolveWorkspaceSteps()` from `app/shell/stage.tsx` if it remains unused
- [ ] Remove `sectionLabelStyle` + `addressRowStyle` from `app/panels/keystore/styles.ts`; keep `cardStyle`
- [ ] Remove the `export` keyword from `readRuntimeActiveSigner()` in `lib/local-runtime.ts` or delete the function if it's not called internally either
- [ ] Search for `DEFAULT_PASSPHRASE` across the app; delete from `app/workspace/shared.ts` if unused
- [ ] Verify `app/panels/reveal.tsx` is registered in `app/panels/registry.ts`
- [ ] Verify `app/panels/accounts-section.tsx` is registered in `app/panels/registry.ts` and faucet works
- [ ] Run `pnpm -w typecheck` from `/workspaces/root` — must pass clean after the trims
- [ ] Run `pnpm check:unused` from `/workspaces/root` — unused `app/keystore/client.ts` wrappers, guide metadata exports, and helper constants should disappear from the list
