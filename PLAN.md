# Porting Plan: DevKit → Framework

**Generated:** 2026-05-09  
**Source repos:** `.cfxdevkit/devkit` (12 packages) + `.cfxdevkit/devkit-workspace` (10 packages)  
**Target repo:** `/workspaces/root` (framework monorepo)  
**Scope:** Close all porting gaps so the framework is the single source of truth and CAS/showcase apps are clean reference implementations.

---

## What Is Already Fully Ported ✅

These packages exist in the framework and are equal to or better than the devkit originals. No further porting needed.

| Devkit package | Framework package | Notes |
|---|---|---|
| `@cfxdevkit/core` (devkit) | `@cfxdevkit/core` (`cfx-core`) | Enhanced: branded types, dual-space, BIP-44 derivation |
| `@cfxdevkit/protocol` (devkit) | `@cfxdevkit/protocol` (`cfx-core`) | Enhanced: `CFX_NATIVE_ADDRESS`, `WCFX_ADDRESSES`, `waitForTransactionReceipt` |
| `@cfxdevkit/executor` (devkit) | `@cfxdevkit/automation` (`cfx-domain`) | Renamed + enhanced: Keeper, PriceChecker, DCA/limit strategies |
| `@cfxdevkit/wallet` (devkit) | `@cfxdevkit/wallet` (`cfx-keys`) | Enhanced: Ledger, OneKey, Satochip, session keys, capability policies |
| `@cfxdevkit/services` (devkit) | `@cfxdevkit/services` (`cfx-keys`) | Enhanced: pluggable keystore provider pattern (memory, file, OS, KMS) |
| `@cfxdevkit/compiler` (devkit) | `@cfxdevkit/compiler` (`cfx-solidity`) | Partial — see Gap 4 below |
| `@cfxdevkit/contracts` (devkit) | `@cfxdevkit/abis` (`cfx-solidity`) | Renamed; standard EVM ABIs re-exported |
| `@cfxdevkit/devnode` (devkit) | `@cfxdevkit/devnode` (`cfx-core`) | Equivalent |
| `@devkit/devkit-backend` (devnode routes) | `@cfxdevkit/devnode-server` (`cfx-tools`) | Hono-based, clean replacement |
| `@devkit/conflux-wallet` (devkit-ws) | `@cfxdevkit/wallet-connect` (`cfx-ui`) | `useCoreWallet`, `isFluentProvider`, Fluent detection ported |
| MCP: accounts, blockchain eSpace, compiler, keystore, node, wallet | `@cfxdevkit/mcp-server` (`cfx-tools`) | 33 tools, modular — see Gap 5 for what's missing |

---

## Porting Gaps (Priority Order)

---

### GAP 1 — `@cfxdevkit/react` 🔴 HIGH
**Location:** `cfx-ui/packages/react`  
**Current state:** Empty stub — only exports `__packageName` placeholder  
**Devkit source:** `devkit/packages/react/src/` (6 components + 3 hooks)  
**Framework spec:** `cfx-ui/packages/react/API.md` (already written — hooks-only redesign)

The new design is intentionally simpler than the devkit: provider distributes a `Client` the app already built (no hidden state, SSR/test friendly). No UI components — those stay in `wallet-connect/ui` and `defi-react`.

**Files to create:**

| File | Exports |
|---|---|
| `src/context.tsx` | `CfxProvider`, `useClient`, `useChain`, `useSigner` |
| `src/account.ts` | `useAccount` |
| `src/contract.ts` | `useReadContract`, `useReadContracts`, `useSimulateContract`, `useWriteContract` |
| `src/balance.ts` | `useNativeBalance`, `useTokenBalance`, `useTokenMetadata` |
| `src/tx.ts` | `useSendTransaction`, `useWaitForTransaction` |
| `src/events.ts` | `useWatchEvent` |
| `src/index.ts` | re-export all of the above |

**Key design decisions:**
- State via TanStack Query (`useQuery`/`useMutation`) — injectable `QueryClient`
- `CfxProvider` does NOT create a client; the app passes one in
- `useClient()` throws if used outside provider (clear error, not silent null)
- All hooks accept `enabled?: boolean` for conditional fetching
- `@tanstack/react-query` is a `peerDependency`

**Status:** ✅ Implemented (2026-05-09)

---

### GAP 2 — `@cfxdevkit/theme` 🟡 MEDIUM (needed before defi-react)
**Location:** `cfx-ui/packages/theme`  
**Current state:** Empty stub  
**Devkit source:** `devkit/packages/theme/src/` (Tailwind v3 preset + globals.css)  
**Framework spec:** `cfx-ui/packages/theme/API.md` (CSS custom properties, no Tailwind dep)

**Files to create:**

| File | Exports |
|---|---|
| `src/tokens.ts` | `colors`, `spacing`, `radius`, `typography`, `shadow`, `motion` token consts |
| `src/css/base.css` | CSS `@layer base { :root { --cfx-* } }` — all tokens as CSS vars |
| `src/css/dark.css` | `[data-theme="dark"] { --cfx-* }` overrides |
| `src/theme-provider.tsx` | `ThemeProvider`, `useTheme` |
| `src/index.ts` | `export * from './tokens.js'; export * from './theme-provider.js';` |

**Package.json exports to add:** `"./css"`, `"./dark"`, `"./tokens"`, `"./react"`

**Status:** ✅ Implemented (2026-05-09) — `@cfxdevkit/defi-react` 🔴 HIGH
**Location:** `cfx-ui/packages/defi-react`  
**Current state:** Empty stub  
**Devkit source:** `devkit/packages/defi-react/src/` (`PoolsProvider`, `usePoolTokens`, `useTokenPrice`)  
**Framework spec:** `cfx-ui/packages/defi-react/API.md` (redesigned: composable swap/balance/token-picker widgets)  
**Immediate source:** CAS `pools-context.tsx` and `strategy.ts` contain inline implementations to extract

**Files to create:**

| File | Exports |
|---|---|
| `src/swap/useSwap.ts` | `useSwap(input)` hook |
| `src/swap/SwapWidget.tsx` | `SwapWidget` component (headless) |
| `src/balance/usePortfolio.ts` | `usePortfolio(input)` hook |
| `src/balance/PortfolioTable.tsx` | `PortfolioTable` component |
| `src/token-picker/TokenPicker.tsx` | `TokenPicker` component |
| `src/tx-status/TxStatusList.tsx` | `TxStatusList`, `TxStatusToast` |
| `src/index.ts` | re-export all |

**Depends on:** GAP 1 (`@cfxdevkit/react`) must be done first.

**Status:** ✅ Implemented (2026-05-09) — types + swap/balance/portfolio/token-picker/tx-status widgets; all sub-path exports.

---

### GAP 4 — Missing compiler templates ✅ DONE
**Location:** `cfx-solidity/packages/compiler/src/templates/`  
**Current:** 5 templates (basic-erc20, basic-erc721, example-counter, simple-storage, payable-vault)  
**Missing from devkit:**

| Template id | Contract name | Notes |
|---|---|---|
| `simple-escrow` | `SimpleEscrow` | Three-party: buyer/seller/arbiter, release/refund |
| `multi-sig-wallet` | `MultiSigWallet` | M-of-N, submit/confirm/execute/revoke pattern |
| `name-registry` | `NameRegistry` | On-chain name → address mapping, transfer ownership |
| `ballot` | `Ballot` | Weighted votes, delegation, winning proposal |

Each needs: `src/templates/<id>/source.ts` + entry in `src/templates/index.ts`.  
The MCP `compile_and_deploy` tool lists templates by name — users expect all 9.

**Status:** ✅ Implemented (2026-05-09) — 4 new templates added (`simple-escrow`, `multi-sig-wallet`, `name-registry`, `ballot`) to `cfx-solidity/packages/compiler/src/templates/`. Registry now has 9 entries total. Typechecks pass.

---

### GAP 5 — Missing MCP tool groups 🟡 MEDIUM
**Location:** `cfx-tools/packages/mcp-server/src/tools/`  
**Current:** 33 tools — accounts, blockchain (eSpace), compiler, keystore, node, wallet  
**Missing:**

| Group | Tools to add | Description |
|---|---|---|
| **Core Space blockchain** | `cfxdevkit_blockchain_core_get_balance`, `_get_block_number`, `_get_chain_id`, `_call_contract`, `_read_erc20`, `_send_cfx`, `_write_contract`, `_deploy_contract`, `_erc20_transfer`, `_erc20_approve` | Mirrors eSpace tool set but for Core Space via cive |
| **Contract tracking** | `cfxdevkit_contracts_list`, `_contract_info`, `_contract_call`, `_contract_write` | Read deployments store, call/write a tracked contract |
| **Bootstrap catalog** | `cfxdevkit_bootstrap_catalog`, `_bootstrap_deploy` | List and deploy production template contracts |
| **Agent health** | `cfxdevkit_backend_health`, `cfxdevkit_agent_operation_get`, `cfxdevkit_agent_operations_recent` | Check devnode-server health, retrieve op ledger entries |
| **Project scripts** | `cfxdevkit_project_script_run`, `cfxdevkit_project_dev_server_status` | Run package.json scripts, check dev server status |
| **DEX** | `cfxdevkit_dex_source_pools` | Fetch Swappi pool data from devnode or testnet |
| **Workspace logs** | `cfxdevkit_workspace_logs` | Tail log output from running services |

**Status:** ❌ Not started

---

### GAP 6 — Scaffold CLI completeness ✅ DONE
**Location:** `cfx-tools/packages/create/src/`  
**Current:** Non-interactive, 1 template  
**Devkit source:** `devkit-workspace/packages/scaffold-cli` + `devkit-workspace/packages/template-core`

**Missing features:**

| Feature | Description |
|---|---|
| Interactive mode | `@inquirer/prompts` — ask template + target when args not provided |
| Template: `minimal-dapp` | Vite + React + wagmi, no backend |
| Template: `wallet-probe` | Wallet detection + signing demo only |
| Template: `project-example` | Full-stack: frontend + backend + contracts |
| Target: `devcontainer` | `.devcontainer/` setup for VS Code / Codespaces |
| Target: `docker` | `docker-compose.yml` + `Dockerfile` production target |
| Template+target matrix | Any template × any target = valid combination |

**Status:** ✅ Implemented (2026-05-09) — 3 real templates (`minimal-dapp`, `wallet-probe`, `project-example`) with inline file content. Legacy aliases (`basic`, `react`, `solidity`) kept. `devcontainer` + `docker` targets supported. `getTemplateFiles(template, target)` exported. `--target` and `--skip-install` CLI flags added. All 21 tests pass.

---

### GAP 7 — Shared UI components 🟢 LOW
**Location:** No equivalent in framework yet  
**Devkit source:** `devkit-workspace/packages/ui-shared/src/`

Used by `dex-ui` and the VSCode extension webview. Decision needed before starting:
- Option A: New `cfx-ui/packages/ui-shared` package
- Option B: Absorb into `defi-react` (less overhead)

**Missing components:** `Button`, `Card`, `Badge`, `Tabs`, `ConnectButton`, `Faucet`, `TradeActionBar`, `SwapInput`, `TokenBalance`, `TokenIcon`, `NetworkBadge`, `useAuth`

**Depends on:** GAP 2 (theme) + GAP 3 (defi-react) design decision.

**Status:** ✅ Implemented (2026-05-09) — rolled into `@cfxdevkit/defi-react/primitives` (Option B). Exports: `Button`, `Card`, `Badge`, `Tabs`, `NetworkBadge`.

---

### GAP 8 — `switchConfluxChain` utility ✅ DONE
**Location:** `cfx-ui/packages/wallet-connect/src/`  
**Devkit source:** `devkit-workspace/packages/conflux-wallet/src/switchChain.ts`

Calls `wallet_addEthereumChain` / `wallet_switchEthereumChain` with Conflux chain params. ~30 lines. Everything else from `conflux-wallet` is already ported.

**Status:** ✅ Implemented (2026-05-09) — `switchEspaceChain(provider, chain)` and `switchEspaceChainFromConfig(provider, chainConfig)` in `cfx-ui/packages/wallet-connect/src/lib/switchConfluxChain.ts`. Handles 4902 (chain not added) by calling `wallet_addEthereumChain`. Exported from `src/index.ts`.

---

## Implementation Order

```
GAP 1  @cfxdevkit/react         ✅ done  (unblocked GAP 3)
GAP 2  @cfxdevkit/theme         ✅ done
GAP 3  @cfxdevkit/defi-react    ✅ done  (after GAP 1 + GAP 2)
GAP 7  ui-shared components     ✅ done  (rolled into defi-react/primitives)
GAP 4  compiler templates       ✅ done  (9 templates total)
GAP 6  scaffold-cli             ✅ done  (3 real templates + 2 targets)
GAP 8  switchConfluxChain       ✅ done  (eSpace chain switching utility)
```

---

## What Does NOT Need Porting

| Devkit item | Reason |
|---|---|
| `devkit/packages/react` UI components (AccountCard, AppNavBar, etc.) | New design is hooks-only; UI lives in `defi-react` / `wallet-connect/ui` |
| `devkit-workspace/packages/devkit-backend` full REST API | Split into `devnode-server` + `mcp-server`; REST API was VSCode-extension-internal |
| ConnectKit integration | Not used; framework uses wagmi injected connector |
| `devkit-workspace/packages/devkit-base` artifacts | Replaced by proper package build pipeline |
| `devkit-workspace/packages/shared` typed HTTP client | Replaced by MCP tools as primary AI interface |

---

## Verification Checklist (per gap, before closing)

- [ ] `pnpm --filter <package> typecheck` passes
- [ ] `pnpm --filter <package> build` produces `dist/`
- [ ] `pnpm --filter <package> test` passes
- [ ] No `TODO` / `FIXME` / stub comments in new files
- [ ] `API.md` matches implementation
- [ ] Imported by at least one downstream package or example
