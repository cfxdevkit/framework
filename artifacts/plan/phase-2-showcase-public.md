# Phase 2 — showcase-public: Hardware Wallet + Remaining Legacy Feature Gaps

**Workspace root:** `/workspaces/root`  
**App root:** `projects/examples/apps/showcase-public/` (all relative paths in this file use this base)  
**See COMPLETION_PLAN.md** for the full monorepo layout reference.

**Goal:** Complete showcase-public by adding (a) the hardware wallet demo from hardware-wallet-showcase and (b) the still-missing legacy features that are not already covered by the existing chapter app.

**Architecture note:** `showcase-public` is a fully browser-side Next.js app. It has no `@cfxdevkit/devnode-server` or `@cfxdevkit/client` dependency and makes no calls to any external backend service. For features that require a server-side nonce (SIWE), showcase-public adds its own minimal Next.js API routes. File keystore and devnode lifecycle are handled exclusively by `showcase-local`, which has its own embedded server.

---

## Current State of showcase-public

| Route | Content | Status |
|-------|---------|--------|
| `/` | Landing / chapter index | ✅ Functional |
| `/core` | Chain catalog, live RPC call, address codec, unit helpers | ✅ Functional |
| `/wallet` | eSpace account, Core wallet, chain switching | ✅ Functional |
| `/keys` | Generate mnemonic, validate mnemonic, derive dual account | ✅ Functional |
| `/siwe` | Nonce → sign → verify demo backed by local API routes | ✅ Functional |
| `/defi` | Token picker, portfolio table, swap widget demo | ✅ Functional |
| `/ui-kit` | Shared UI foundation showcase | ✅ Functional |

The major remaining gap is the **hardware wallet demo** on `/keys`. The other remaining legacy gaps are narrower: the existing `/wallet` page does not yet cover the full message-signing / send-transaction / dual-space dashboard surface from `showcase-browser`, and `/core` does not yet cover the deeper block/transaction lookup sections from `showcase`.

---

## Section A: Hardware Wallet Demo (Port from hardware-wallet-showcase)

### What hardware-wallet-showcase Demonstrates

The app shows three keystore backends side-by-side:

| Backend | What it does |
|---------|-------------|
| **Memory** | In-browser ephemeral wallet (no persistence) |
| **File** | Encrypted mnemonic stored on backend (file keystore) |
| **Ledger** | Hardware wallet via WebHID transport + Ethereum app |

For each backend, the user can:
1. Generate/connect account (derive or pair hardware device)
2. View address + balance
3. Sign a test message
4. Deploy a test contract
5. Call a read function on the deployed contract

### Target Route in showcase-public

Add a **hardware wallet section** to the existing `/keys` page.

Do NOT create `/keys/hardware/page.tsx` as a separate route — keep it as a new section below the existing key-math content. This keeps the page as a single coherent demo of "key management" from basic cryptography through hardware wallet pairing.

### Implementation Guide

**Dependencies to use** (verify against `projects/examples/apps/showcase-public/package.json` before implementation):
- `@cfxdevkit/wallet` (`repos/cfx-keys/packages/wallet/`) — hardware adapters live at `src/hardware/ledger.ts`, `src/hardware/onekey.ts`, `src/hardware/satochip.ts`; import via `@cfxdevkit/wallet/hardware/ledger` etc. This is not currently listed in `showcase-public/package.json`, so adding it is a required first step for the hardware-wallet work.
- `@cfxdevkit/core` (`repos/cfx-core/packages/core/`) — address derivation, balance reads
- `@cfxdevkit/react` (`repos/cfx-ui/packages/react/`) — hooks for account/balance state
- `@cfxdevkit/example-showcase-ui` (`projects/examples/packages/showcase-ui/`) — DemoCard, CodeSnippet, StatusBadge components

**What needs to be built:**

```
showcase-public/
  app/keys/
    page.tsx                     ← existing; add hardware wallet section here
    hardware/
      HardwareWalletSection.tsx  ← new; top-level section component
      LedgerPanel.tsx            ← WebHID connect + sign + derive
      MemoryWalletPanel.tsx      ← in-browser ephemeral wallet (no backend)
      KeystoreMatrixPanel.tsx    ← optional: side-by-side comparison
```

**LedgerPanel requirements:**
- "Connect Ledger" button → calls `@cfxdevkit/wallet/hardware/ledger` WebHID transport
- Display paired device name + firmware version
- Derive eSpace address (m/44'/60'/0'/0/0) + Core address (m/44'/503'/0'/0/0)
- Sign test message button → shows raw signature
- Note: requires HTTPS or localhost; will not work in sandboxed iframe

**MemoryWalletPanel requirements:**
- "Generate Wallet" button → generates random 12-word mnemonic in browser
- Display eSpace + Core address pair
- Sign test message (using in-browser signer, no backend)
- This panel shows the equivalent functionality WITHOUT hardware — useful for comparison

**File keystore panel:** Exclude from `showcase-public` v0.1.0. File keystore is a `showcase-local` feature (it has an embedded devnode-server and file keystore service). `showcase-public` is a pure frontend app — it has no keystore service. Focus on the zero-setup browser-wallet demonstrations first.

### Source Files to Reference

When implementing, read these files from the source app at `projects/examples/apps/hardware-wallet-showcase/src/`:
- `keystore-demo.ts` — backend definitions + metadata
- `wallet-controller-ledger.ts` — WebHID implementation
- `wallet-controller-memory.ts` — in-memory signer
- `keystore-ui.tsx` — UI patterns

Do NOT copy these files verbatim. Rewrite them as clean Next.js components using `@cfxdevkit/react` hooks and `@cfxdevkit/ui` components (`repos/cfx-ui/packages/ui/`), matching showcase-public's visual style (DemoCard, CodeSnippet, StatusBadge from `@cfxdevkit/example-showcase-ui` in `projects/examples/packages/showcase-ui/`).

---

## Section B: Browser Wallet Features (Port from showcase-browser)

### Target Route: `/wallet` (extend existing page)

Do **not** create a new `/wallets` route. `showcase-public` already has `app/wallet/page.tsx`, and it already demonstrates:
- eSpace connection and balance state via wagmi
- Core wallet connection via `useCoreWallet`
- chain switching for both eSpace and Core Space

This phase extends that existing route with the still-missing browser-wallet actions.

**Content:**

```
showcase-public/
  app/wallet/
    page.tsx                       ← existing page; extend or refactor
    sections/                      ← optional refactor target
      WalletConnectionSection.tsx  ← Fluent, MetaMask, wagmi connect
      AccountDashboardSection.tsx  ← address, balance, gas, epoch
      MessageSigningSection.tsx    ← personal_sign, EIP-712, CIP-23
      SendTransactionSection.tsx   ← send native CFX (eSpace + Core)
      DualSpaceSection.tsx         ← Core + eSpace simultaneously
```

### WalletConnectionSection

The existing page already covers the basic connection flows. Keep those sections and extend them where needed:
1. **Fluent (Core space)** — `cfx_requestAccounts` via `@cfxjs/use-wallet-react` or direct EIP-1193
2. **Fluent (eSpace)** — `eth_requestAccounts` via Fluent's EVM provider
3. **MetaMask / EIP-1193** — standard wagmi `useConnect`

**Dependencies:**
- `@cfxdevkit/wallet-connect` (`repos/cfx-ui/packages/wallet-connect/`) — wagmi config + connectors; already in showcase-public
- `@cfxdevkit/react` (`repos/cfx-ui/packages/react/`) — wagmi-based hooks

Display connection status badge (Connected / Disconnected) and active account per wallet. Reuse the current header + `/wallet` page flow instead of introducing a parallel connection surface.

### AccountDashboardSection

The existing `/wallet` page already shows the connected account state. Extend it if you need more detail, but do not rebuild it from scratch.

After any wallet connects, add or confirm:
- **eSpace address** (0x format) + ETH balance + chain ID
- **Core address** (base32 format) + CFX balance + epoch number
- Live refresh every 10s

Use `@cfxdevkit/react` balance hooks.

### MessageSigningSection

Three signing modes:
1. **personal_sign** — plain string, user sees the text in wallet popup
2. **EIP-712** — structured data (show the typed data object + signature)
3. **CIP-23** — Core space equivalent of EIP-712 (Conflux-specific)

Display resulting signature in a copyable CodeSnippet.

### SendTransactionSection

Two sub-panels:
1. **eSpace** — send CFX via wagmi `useSendTransaction`; show recipient, amount, gas; show tx hash + link to scan
2. **Core** — send CFX via `cfx_sendTransaction`; same UI pattern

Note: Provide a "send to self" shortcut to avoid needing a separate recipient address.

### DualSpaceSection

If both a Core wallet and eSpace wallet are connected:
- Show both balances updated live
- "Cross-space transfer" button → initiate bridge contract call (optional for v0.1.0)

### SIWE Authentication Section

The SIWE flow already exists at `/siwe`, backed by `app/api/auth/nonce/route.ts` and `app/api/auth/verify/route.ts`.

**Current implementation notes:**
- `nonce/route.ts` uses a simple in-memory nonce store keyed by address
- `verify/route.ts` verifies the signature and returns a simple session payload, not a signed JWT

**Phase decision:** no new SIWE page or route is needed for v0.1.0. Only harden the current demo if you decide the nonce/session layer should move to `@cfxdevkit/services/auth` helpers.

---

## Section C: Core RPC Panel (Port from showcase)

### Target Route: `/core` (extend existing page)

Do **not** create a new `/rpc` route. `showcase-public` already has `app/core/page.tsx`, and it already demonstrates direct Conflux reads using `@cfxdevkit/core`.

**Content:**

```
showcase-public/
  app/core/
    page.tsx                       ← existing page; extend or refactor
    sections/                      ← optional refactor target
      BlockLookupSection.tsx      ← cfx_getBlockByHash / byEpoch
      TxLookupSection.tsx         ← cfx_getTransactionByHash / receipt
      ChainInfoSection.tsx        ← cfx_getStatus, chain ID, epoch, block height
      CrossSpaceSection.tsx       ← read eSpace state from Core RPC
```

**Existing coverage:** chain list, one live RPC call, address codec, and unit helpers are already on `/core`.

**Source:** Port the missing deeper lookup panels from `projects/examples/apps/showcase/src/` into the existing `/core` route. The RPC calls themselves use `@cfxdevkit/core` (`repos/cfx-core/packages/core/`), already a dep of showcase-public.

---

## Task List for This Phase

All paths relative to `projects/examples/apps/showcase-public/` unless stated. Run quality commands from `/workspaces/root`.

### Hardware wallet
- [ ] Read `app/keys/page.tsx` to understand the current structure before adding the hardware section
- [ ] Add `@cfxdevkit/wallet` to `package.json`
- [ ] Create `app/keys/hardware/HardwareWalletSection.tsx`
- [ ] Create `app/keys/hardware/LedgerPanel.tsx` using `@cfxdevkit/wallet` hardware sub-path
- [ ] Create `app/keys/hardware/MemoryWalletPanel.tsx`
- [ ] Import and render `HardwareWalletSection` at the bottom of `app/keys/page.tsx`
- [ ] Add WebHID availability check (show graceful message in non-Chrome browsers)

### Browser wallets
- [ ] Read `app/wallet/page.tsx` before extending the wallet surface
- [ ] Decide whether to keep `/wallet` in one file or split new content into `app/wallet/sections/`
- [ ] Keep the existing connection/account/chain-switch surface; do not recreate it under a new route name
- [ ] Implement `MessageSigningSection` (3 modes: personal_sign, EIP-712, CIP-23)
- [ ] Implement `SendTransactionSection` (eSpace + Core with send-to-self shortcut)
- [ ] Implement a richer dual-space dashboard/action view on `/wallet`
- [ ] Evaluate whether `/siwe` is release-ready as-is or should adopt `@cfxdevkit/services/auth`

### Core RPC
- [ ] Read `app/core/page.tsx` before extending the Core surface
- [ ] Add block lookup, transaction lookup, and cross-space read sections to `/core`
- [ ] Factor `/core` into section components only if the page becomes hard to maintain

### Cleanup
- [ ] Delete `projects/examples/apps/hardware-wallet-showcase/` after all content is ported and verified
- [ ] Run `pnpm -w typecheck` from `/workspaces/root` — must pass clean
- [ ] Run `pnpm check:unused` from `/workspaces/root` — hardware-wallet-showcase should have no remaining refs
