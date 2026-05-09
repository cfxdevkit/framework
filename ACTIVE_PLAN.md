# Active Implementation Plan

**Created:** 2026-05-09  
**Source:** PLAN.md gap analysis (devkit + devkit-workspace → framework)  
**Scope:** In-scope items only. See "Postponed" section at the bottom for deferred work.

---

## Execution Order

Dependencies drive the order: server routes → HTTP client → protocol ABIs → DEX service →
DEX hooks → UI components → templates → VS Code views.

```
[GAP B] devnode-server routes
    └─► [GAP H] typed HTTP client
    └─► [GAP C] VS Code tree views (node/network/accounts)

[GAP K] Protocol ABIs (Swappi V2)
    └─► [GAP G] SwapService
        └─► [GAP D] defi-react DEX hooks + SwappiAdapter
            └─► [GAP J-partial] LP creation UI component

[GAP I] Compiler templates (independent)
[GAP E] ui-shared components (mostly independent, some use GAP D hooks)

[GAP F] Template fidelity (after GAP E — templates use ConnectButton etc.)
```

---

## GAP B — devnode-server: Missing Route Groups

**Status:** ✅ Done  
**Priority:** 1 — blocks GAP H, GAP C, and parts of GAP A  
**Location:** `repos/cfx-tools/packages/devnode-server/src/`

### What exists today
- `GET /health`
- `GET /node/status`, `POST /node/start`, `POST /node/stop`, `POST /node/restart`, `POST /node/wipe`, `POST /node/mine`

### Route groups to add

#### 1. Keystore routes (`/keystore/*`)
Wire to `@cfxdevkit/services` `KeystoreProvider` (file backend).

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/keystore/status` | — | `{ ok, locked, hasWallets, walletCount }` |
| `POST` | `/keystore/setup` | `{ passphrase }` | `{ ok, walletCount }` |
| `POST` | `/keystore/unlock` | `{ passphrase }` | `{ ok }` |
| `POST` | `/keystore/lock` | — | `{ ok }` |
| `GET` | `/keystore/wallets` | — | `{ ok, wallets: WalletSummary[] }` |
| `POST` | `/keystore/wallets` | `{ mnemonic, name }` | `{ ok, wallet: WalletSummary }` |
| `PUT` | `/keystore/wallets/:id/activate` | — | `{ ok }` |
| `DELETE` | `/keystore/wallets/:id` | — | `{ ok }` |
| `PATCH` | `/keystore/wallets/:id/rename` | `{ name }` | `{ ok }` |

#### 2. Accounts routes (`/accounts/*`)
Read genesis accounts from running devnode; use `@cfxdevkit/devnode` API.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/accounts` | — | `{ ok, accounts: AccountInfo[] }` |
| `POST` | `/accounts/fund` | `{ address, amount }` | `{ ok, txHash }` |
| `GET` | `/accounts/faucet` | — | `{ ok, faucet: FaucetInfo }` |

#### 3. Contracts routes (`/contracts/*`)
In-memory (or file-persisted) contract registry.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/contracts` | — | `{ ok, contracts: ContractRecord[] }` |
| `GET` | `/contracts/:id` | — | `{ ok, contract: ContractRecord }` |
| `DELETE` | `/contracts/:id` | — | `{ ok }` |
| `DELETE` | `/contracts` | — | `{ ok, cleared }` |
| `POST` | `/contracts/register` | `{ address, abi, name, space }` | `{ ok, contract: ContractRecord }` |
| `POST` | `/contracts/call` | `{ id, method, args, space }` | `{ ok, result }` |
| `POST` | `/contracts/deploy` | `{ bytecode, abi, args, space }` | `{ ok, contract: ContractRecord }` |

#### 4. Network routes (`/network/*`)
Expose selected network and per-network RPC config.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/network/current` | — | `{ ok, network, espaceRpc, coreRpc }` |
| `GET` | `/network/capabilities` | — | `{ ok, capabilities }` |
| `GET` | `/network/config` | — | `{ ok, config }` |
| `POST` | `/network/config` | `{ key, value }` | `{ ok }` |
| `POST` | `/network/set` | `{ network }` | `{ ok }` |

#### 5. Mining routes (`/mining/*`)
Toggle continuous mining mode.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/mining/status` | — | `{ ok, running, intervalMs }` |
| `POST` | `/mining/start` | `{ intervalMs? }` | `{ ok }` |
| `POST` | `/mining/stop` | — | `{ ok }` |

### Implementation notes
- Add `src/routes/keystore.ts`, `accounts.ts`, `contracts.ts`, `network.ts`, `mining.ts`
- Wire via `app.route('/keystore', keystoreRoutes)` etc. in `app.ts`
- Controller: extend `DevnodeServerController` or add separate service classes
- Types: add to `types.ts`
- Tests: add to `index.test.ts` or new `routes.test.ts`

---

## GAP H — Typed HTTP Client (`@cfxdevkit/client`)

**Status:** ✅ Done  
**Priority:** 2 — after GAP B routes are stable  
**Location:** New package `repos/cfx-tools/packages/client/` **or** add to `repos/cfx-core/packages/core/`

### What to implement

`ConfluxDevkitClient` — typed fetch wrapper covering all devnode-server routes.

```ts
const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000' });

// node
await client.node.status()
await client.node.start({ mnemonic? })
await client.node.stop()

// keystore
await client.keystore.status()
await client.keystore.unlock({ passphrase })
await client.keystore.lock()
await client.keystore.wallets.list()
await client.keystore.wallets.add({ mnemonic, name })

// accounts
await client.accounts.list()
await client.accounts.fund({ address, amount })  // space auto-detected from address prefix

// contracts
await client.contracts.list()
await client.contracts.register({ address, abi, name })
await client.contracts.call({ id, method, args })

// network
await client.network.current()
await client.network.set({ network })

// mining
await client.mining.status()
await client.mining.start({ intervalMs? })
await client.mining.stop()
```

### Implementation notes
- Pure `fetch` — no extra deps
- Each namespace is a plain object of async functions, not a class
- All responses typed via shared types (import from `@cfxdevkit/devnode-server` or inline)
- Ship with the `@cfxdevkit/mcp-server` and `@cfxdevkit/vscode-extension` as their HTTP layer

---

## GAP K — Protocol ABIs: Swappi V2

**Status:** ✅ Done  
**Priority:** 2 (parallel to GAP H)  
**Location:** `repos/cfx-solidity/packages/` — new package **or** extend `@cfxdevkit/abis`

### What to add

Swappi V2 contract ABIs (as viem `Abi` typed arrays) + deployed addresses per chain.

| Export | Description |
|--------|-------------|
| `swappiFactoryAbi` | `ISwappiFactory` — `getPair`, `createPair`, `allPairs`, `allPairsLength` |
| `swappiRouterAbi` | `ISwappiRouter02` — `swapExactTokensForTokens`, `addLiquidity`, `removeLiquidity`, `getAmountsOut` |
| `swappiPairAbi` | `ISwappiPair` — `getReserves`, `token0`, `token1`, `totalSupply`, `mint`, `burn` |
| `swappiFactoryAddress` | `Record<ChainId, Address>` — mainnet + testnet |
| `swappiRouterAddress` | `Record<ChainId, Address>` — mainnet + testnet |

Source: copy from `.cfxdevkit/devkit-workspace/contracts/` ABI JSON files.

### Implementation notes
- Add to `repos/cfx-solidity/packages/abis/src/` as a new subpath export `@cfxdevkit/abis/swappi`
- Or create `repos/cfx-solidity/packages/swappi-abis/` if it grows large
- Keep viem-typed (use `parseAbi` if needed, or ship as `as const` arrays)

---

## GAP I — Compiler Templates: TestToken + Voting

**Status:** ✅ Done  
**Priority:** 2 (independent, parallel)  
**Location:** `repos/cfx-solidity/packages/compiler/src/templates/`

### What to add

Two new template files:

**`test-token/source.ts`**
```
TEST_TOKEN_PATH = 'TestToken.sol'
TEST_TOKEN_SOURCE = ERC-20 with open mint (mintTo(address, uint256) callable by anyone — for local dev only)
```

**`voting/source.ts`** (alias for ballot with a different ID)  
Register as `voting` → points to the same Ballot source as `ballot`, or is a standalone simplified voting contract.

### Update `templates/index.ts`
Add both to the `TEMPLATES` registry. Total → 11 templates.

---

## GAP G — SwapService: Live Swappi DEX Integration

**Status:** ✅ Done  
**Priority:** 3 — after GAP K (needs ABIs)  
**Location:** `repos/cfx-ui/packages/defi-react/src/` or `repos/cfx-core/packages/`

### What to implement

`SwapService` class that provides a concrete `DexAdapter` (the interface already exists in `defi-react/src/types.ts`).

```ts
export interface SwapServiceConfig {
  /** Chain ID — used to look up factory/router addresses. */
  chainId: number;
  /** eSpace public client (viem). */
  client: PublicClient;
}

export function createSwapService(config: SwapServiceConfig): SwapService;

export class SwapService implements DexAdapter {
  getQuote(params): Promise<Quote>;
  buildCalldata(quote: Quote): Promise<SwapCalldata>;

  // Additional non-adapter methods
  getPoolTokens(pairAddress: Address): Promise<{ token0: TokenInfo; token1: TokenInfo; reserve0: bigint; reserve1: bigint }>;
  getTokenPrice(tokenAddress: Address, quoteToken: Address): Promise<bigint>;
  getPairs(tokenA: Address, tokenB: Address): Promise<Address>;
}
```

### Key implementation details
- Use `swappiRouterAbi` + `swappiFactoryAbi` + `swappiPairAbi` from GAP K
- `getAmountsOut` for quote calculation (single-hop: tokenIn → tokenOut)
- Multi-hop via: tokenIn → WCFX → tokenOut when direct pair doesn't exist
- `addLiquidity` / `removeLiquidity` helpers for LP operations
- WCFX address per chain (wrapped native CFX)
- No backend dependency — pure on-chain reads via viem `readContract`

---

## GAP D — defi-react: DEX Data Hooks + SwappiAdapter

**Status:** ✅ Done  
**Priority:** 4 — after GAP G (needs SwapService)  
**Location:** `repos/cfx-ui/packages/defi-react/src/`

### What to add

New directory: `repos/cfx-ui/packages/defi-react/src/pool/`

| File | Exports | Description |
|------|---------|-------------|
| `usePoolTokens.ts` | `usePoolTokens(pairAddress)` | Query token pair + reserves + prices for a Swappi pair |
| `useTokenPrice.ts` | `useTokenPrice(address, quoteToken?)` | Price of token in USDT or WCFX via Swappi router |
| `usePools.ts` | `usePools(addresses[])` | Bulk pool state (map of pair → PoolInfo) |
| `PoolsProvider.tsx` | `PoolsProvider`, `usePools` ctx hook | React context + useQuery for pool state |
| `index.ts` | Re-export all | Entry for `@cfxdevkit/defi-react/pool` subpath |

New file: `repos/cfx-ui/packages/defi-react/src/swap/createSwappiAdapter.ts`

```ts
import { createSwapService } from '@cfxdevkit/defi-react/service'; // or from defi-react internal
export function createSwappiAdapter(config: SwapServiceConfig): DexAdapter;
```

### Subpath exports to add
In `package.json` of `@cfxdevkit/defi-react`:
```json
"./pool": "./src/pool/index.ts",
"./service": "./src/service/index.ts"
```

---

## GAP J (partial) — LP Creation Component

**Status:** ✅ Done  
**Priority:** 5 — after GAP D  
**Location:** `repos/cfx-ui/packages/defi-react/src/`

### What to port (from `apps/dex-ui/src/AddLiquidity.tsx`)

Only port if compatible with the framework's CSS-variable-based theme and the `DexAdapter` pattern.

| Component | Description | Decision |
|-----------|-------------|----------|
| `AddLiquidityWidget` | Two-token input + price/ratio display + "Add Liquidity" action | ✅ Port to `defi-react/src/lp/` |
| `PoolShareBadge` | Shows user's share % of pool after provision | ✅ Include in lp widget |
| `Pools.tsx` (read-only pool list) | Full pool table with reserves | 🟡 Evaluate — port as `PoolTable` if useful standalone |
| Full DEX app shell (`Swap.tsx`, `NavBar.tsx`, `Vault.tsx`) | App-level components | ⛔ Out of scope |

---

## GAP E — ui-shared: Missing Components

**Status:** ✅ Done  
**Priority:** 5 (parallel to GAP J-partial)  
**Location:** `repos/cfx-ui/packages/defi-react/src/primitives/` (extend existing) or new package

### Validate and merge with existing primitives

Existing in `defi-react/primitives`: `Button`, `Card`, `Badge`, `Tabs`, `NetworkBadge`

### Components to add

Group 1 — **General utility** (add to primitives, no DEX dep)

| Component | Description | Notes |
|-----------|-------------|-------|
| `Input` | Styled text input with label + error | Use CSS var tokens |
| `CopyButton` | Icon button → copies text to clipboard | Wraps `Button` + browser clipboard API |
| `SelectMenu` | Dropdown `<select>` + `SelectMenuOption` type | Accessible native select |
| `SegmentedControl` | Toggle N named options (like tab bar) | No external dep |
| `SectionHeader` | Title + optional subtitle + optional action slot | Layout primitive |
| `StatusBanner` | Alert strip (info/warn/error/success) | 4 variants |
| `MetricCard` | KPI card — label + value + optional delta % | Extends `Card` |

Group 2 — **Wallet / App** (depend on `@cfxdevkit/wallet-connect`)

| Component | Description | Notes |
|-----------|-------------|-------|
| `ConnectButton` | Shows "Connect" or truncated address + disconnect | Uses `useEspaceConnectors` |
| `AppToaster` | Toast container (wraps `sonner` or native) | Needs `sonner` dep or custom impl |

Group 3 — **Devkit-specific** (depend on devnode-server or hooks)

| Component | Description | Notes |
|-----------|-------------|-------|
| `FaucetWidget` | Button to POST `/accounts/fund` via HTTP client | Needs GAP H + GAP B |
| `DevkitStatus` | Node + keystore status composite panel | Needs GAP H |
| `SelectableListItem` | List item with selection state | WalletPicker use case |
| `ShellOverview` | Full-page system health overview | Low priority, complex |

Group 4 — **Trade widgets** (depend on GAP D hooks)

| Component | Description | Notes |
|-----------|-------------|-------|
| `TradeTokenField` | Token amount input + token picker trigger | Uses `TokenPicker` from defi-react |
| `TradeActionBar` | Swap/Provide toggle + slippage control | Composition of primitives |
| `TradeSummaryGrid` | Route + price impact + fees table | Pure display |

### `AuthProvider` + `useAuth()`

Simple React context that holds whether a wallet is connected and exposes `signIn`/`signOut` wrappers around SIWE. Backed by `@cfxdevkit/wallet-connect` SIWE utilities.

Add to `repos/cfx-ui/packages/wallet-connect/src/auth/`.

---

## GAP F — Scaffold Templates: Fidelity

**Status:** ✅ Done  
**Priority:** 6 — after GAP E (templates use ConnectButton etc.)  
**Location:** `repos/cfx-tools/packages/scaffold-cli/src/templates/`

### Strategy

Switch from inline string templates to **file-system templates** shipped inside the package.

```
packages/scaffold-cli/
  src/
    templates.ts          ← thin registry (exists)
    templates/
      minimal-dapp.ts     ← current inline content (exists)
      wallet-probe.ts     ← current inline content (exists)
      project-example.ts  ← current inline content (exists)
  template-files/         ← NEW: real directory trees
    minimal-dapp/
      .devcontainer/
      .github/
      .vscode/
      .gitignore
      .mcp.json
      CLAUDE.md
      README.md
      package.json
      pnpm-workspace.yaml
      dapp/
        package.json
        tsconfig.json
        vite.config.ts
        index.html
        src/
          main.tsx        ← imports ConnectButton from @cfxdevkit/defi-react
          App.tsx
    wallet-probe/
      (same skeleton + patches/)
    project-example/
      (full monorepo tree — see below)
```

### `project-example` must include

| Path | Description |
|------|-------------|
| `.mcp.json` | MCP config pointing to local mcp-server |
| `AGENTS.md` | AI agent context for the scaffolded project |
| `CLAUDE.md` | Claude Code instructions |
| `.github/workflows/ci.yml` | Build + test CI |
| `.vscode/extensions.json` | Recommended extensions |
| `biome.json` | Linter config |
| `pnpm-workspace.yaml` | Workspace config |
| `docker-compose.yml` | Full stack compose |
| `vercel.json` | Vercel deploy config |
| `scripts/deploy-contract.mjs` | Deploy helper |
| `scripts/sync-project-network.mjs` | Sync addresses |
| `scripts/doctor.mjs` | Health check |
| `scripts/list-contracts.mjs` | List deployed |
| `deployments/contracts.json` | Empty deployment tracker |
| `dapp/wagmi.config.ts` | Wagmi code-gen config |
| `dapp/src/components/` | Pre-built components (ConnectButton, FaucetWidget) |
| `packages/backend/src/index.ts` | Hono backend with health route |
| `packages/contracts/src/Counter.sol` | Sample contract |

### Smoke-test target

Add a new template target `smoketest` to `minimal-dapp` that:
1. Scaffolds the project
2. Installs deps (`pnpm install`)
3. Runs `pnpm build` and verifies exit 0

Wire as a moon task in `cfx-tools`.

---

## GAP C — VS Code Extension: Missing Tree Views

**Status:** 🟡 In Progress (mining.start/stop commands done; networkView, nodeView, accountsView tree views pending)  
**Priority:** 6 (parallel to GAP F, after GAP B routes)  
**Location:** `repos/cfx-tools/packages/vscode-extension/src/`  
**Note:** DEX view (`cfxdevkit.dexView`) is **out of scope** — local DEX not in framework.

### Tree views to add

| View ID | Provider | Data source |
|---------|----------|-------------|
| `cfxdevkit.networkView` | `NetworkProvider` | In-memory `selectedNetwork` state |
| `cfxdevkit.nodeView` | `NodeControlProvider` | GET `/node/status` (poll 3s when active) |
| `cfxdevkit.accountsView` | `AccountsProvider` | GET `/accounts` (refresh on node start) |

### Implementation

1. **`src/views/network-view.ts`** — tree items for Local/Testnet/Mainnet with current selection indicator
2. **`src/views/node-view.ts`** — Running/Stopped status item + start/stop/restart/wipe inline actions
3. **`src/views/accounts-view.ts`** — account list with Core+eSpace addresses and balances

All three providers extend `vscode.TreeDataProvider` and poll via `setInterval` or respond to the existing `refreshAll()` call.

### Status bar addition

`registerDexUiStatusBar()` — **only if** there is a local DEX UI running. Since local DEX is out of scope, this is deferred.

### Commands to add (non-DEX)

| Command ID | Action |
|-----------|--------|
| `cfxdevkit.node.restart` | POST `/node/restart` |
| `cfxdevkit.node.wipe` | POST `/node/wipe` (with confirm dialog) |
| `cfxdevkit.network.select` | Quick-pick Local/Testnet/Mainnet |
| `cfxdevkit.accounts.refresh` | Force-refresh accounts view |
| `cfxdevkit.mining.start` | POST `/mining/start` |
| `cfxdevkit.mining.stop` | POST `/mining/stop` |

---

## Validation Gates

After all GAPs above are implemented, run:

```bash
# Quality gate
moon run :lint :typecheck :test

# Hotspot check
pnpm --filter @cfxdevkit/llm-tools llm -- commit --dry-run

# Smoke test the dapp template
cd /tmp && npx @cfxdevkit/create@local my-dapp --template minimal-dapp && cd my-dapp && pnpm install && pnpm build
```

---

## Postponed — MCP Tools (GAP A, Groups 1–8)

**Decision:** Postponed until the full framework cleanup is complete.  
**Reason:** Adding MCP tools on top of an evolving devnode-server creates a moving target. Better to stabilize the HTTP routes (GAP B) first, then implement MCP tools in a single clean pass.

**What is deferred:**

| Group | Tools | Unblocked by |
|-------|-------|-------------|
| Group 1: Workspace/Docker | `workspace_status/start/stop/logs`, `docker_available` | GAP B + Docker utils |
| Group 2: Backend relay | `backend_health`, `backend_api_catalog`, `backend_api_call` | GAP B |
| Group 3: DEX tools | `dex_status`, `dex_deploy`, `dex_manifest`, `dex_translation_table`, `dex_wcfx_price`, `dex_reset`, `dex_source_pools`, `dex_seed_from_gecko` | Out of scope (local DEX) |
| Group 4: Agent ops | `extension_capability_map`, `agent_workspace_context`, `agent_tool_contracts`, `agent_operation_get/recent`, `agent_runbook_execute`, `local_stack_status` | GAP B + stable framework |
| Group 5: Project | `project_info`, `project_doctor`, `project_script_run`, `project_dev_server_status` | Stable framework |
| Group 6: Extended keystore | `cfxdevkit_keystore_lock`, `cfxdevkit_wallet_add/activate/delete/rename` | GAP B keystore routes |
| Group 7: Extended node | `cfxdevkit_node_restart`, `cfxdevkit_node_wipe_restart`, `cfxdevkit_node_wipe` | GAP B (already have routes) |
| Group 8: Bootstrap | `conflux_bootstrap_catalog/entry/prepare/deploy/deploy_multi` | Bootstrap service (new) |

**Planned task (separate):** After framework cleanup, implement all MCP tools as a single focused PR. This will bring the framework to parity with devkit-workspace on AI agent tooling.

---

## Summary Checklist

| GAP | Description | Status |
|-----|-------------|--------|
| B | devnode-server routes (keystore/accounts/contracts/network/mining) | ✅ Done |
| H | Typed HTTP client (`ConfluxDevkitClient`) | ✅ Done |
| K | Protocol ABIs (Swappi V2 Factory/Router/Pair) | ✅ Done |
| I | Compiler templates (TestToken, Voting) | ✅ Done |
| G | SwapService (live Swappi DEX integration) | ✅ Done |
| D | defi-react DEX hooks (usePoolTokens, useTokenPrice, SwappiAdapter) | ✅ Done |
| J | LP creation widget (AddLiquidityWidget, PoolShareBadge) | ✅ Done |
| E | ui-shared components (Input, CopyButton, ConnectButton, FaucetWidget, …) | ✅ Done |
| F | Template fidelity (file-system templates, smoke-test target) | ✅ Done |
| C | VS Code tree views (networkView, nodeView, accountsView) + commands | 🟡 mining.start/stop done; networkView/nodeView/accountsView pending |
| A | MCP tools (all groups) | ⏸ POSTPONED |
