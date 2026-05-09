# Porting Plan: DevKit → Framework

**Updated:** 2026-05-09  
**Source repos:** `.cfxdevkit/devkit` (12 packages) + `.cfxdevkit/devkit-workspace` (10 packages)  
**Target repo:** `/workspaces/root` (framework monorepo)  
**Method:** Full gap analysis — every package, every tool, every component compared.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully ported and equal-to or better than source |
| 🟡 | Partially ported — core exists but features missing |
| 🔴 | Not started — needs full implementation |
| ⬛ | Intentionally not ported (obsolete / replaced) |

---

## Summary Scorecard

| Domain | Source Items | Framework Status | Gap |
|--------|-------------|-----------------|-----|
| Core SDK packages | 12 devkit + 10 devkit-workspace | 22/22 packages exist | Functional gaps inside |
| MCP tools | ~70 in devkit-workspace | 34 in framework | **36 missing** |
| VS Code extension views | 5 tree views + DEX status bar | 1 view (mainView) | **4 tree views + DEX bar missing** |
| VS Code commands | 40+ commands | present | **Stack/Docker/DEX commands missing** |
| Scaffold templates | 3 real templates (full dir tree) | 3 inline templates | **Template fidelity gap** |
| defi-react | DEX hooks, Swappi pool data | Swap/Portfolio/TokenPicker/TxStatus | **DEX pool data hooks missing** |
| ui-shared components | 21 components + 4 trade widgets | Button/Card/Badge/Tabs/NetworkBadge | **16 components missing** |
| devnode-server routes | 15+ routes (keystore/accounts/contracts/DEX) | 6 routes (node only) | **9+ route groups missing** |
| DEX UI app | Full Swappi DEX (9 pages) | Not in framework | **Not ported** |
| Template fidelity | Full project tree w/ scripts/MCP/CI | Minimal inline content | **Structural gaps** |

---

## Part 1 — Fully Ported ✅ (No Action Needed)

These packages exist in the framework and are equal to or better than the devkit originals.

| Devkit package | Framework package | Notes |
|---|---|---|
| `@cfxdevkit/core` (devkit) | `@cfxdevkit/core` (`cfx-core`) | Enhanced: branded types, dual-space, BIP-44 derivation |
| `@cfxdevkit/protocol` (devkit) | `@cfxdevkit/protocol` (`cfx-core`) | Enhanced: precompile ABIs, cross-space helpers |
| `@cfxdevkit/executor` (devkit) | `@cfxdevkit/automation` (`cfx-domain`) | Renamed + enhanced: Keeper, PriceChecker, DCA/limit strategies |
| `@cfxdevkit/wallet` (devkit) | `@cfxdevkit/wallet` (`cfx-keys`) | Enhanced: Ledger, OneKey, Satochip, session keys, capability policies |
| `@cfxdevkit/services` (devkit) | `@cfxdevkit/services` (`cfx-keys`) | Enhanced: pluggable keystore (memory, file, OS, KMS) |
| `@cfxdevkit/contracts` (devkit ABIs) | `@cfxdevkit/abis` (`cfx-solidity`) | Renamed; standard EVM ABIs re-exported via viem |
| `@cfxdevkit/devnode` (devkit) | `@cfxdevkit/devnode` (`cfx-core`) | Equivalent |
| `@cfxdevkit/react` (devkit — hooks layer) | `@cfxdevkit/react` (`cfx-ui`) | Framework version is hooks-only redesign ✅ |
| `@cfxdevkit/theme` (devkit — Tailwind preset) | `@cfxdevkit/theme` (`cfx-ui`) | Framework version uses CSS variables (better arch) ✅ |
| `@devkit/conflux-wallet` (devkit-ws) | `@cfxdevkit/wallet-connect` (`cfx-ui`) | Core+eSpace wallet, SIWE, useCoreWallet ported |
| Compiler core | `@cfxdevkit/compiler` (`cfx-solidity`) | compile(), resolver, 9 templates ✅ |
| `@cfxdevkit/testing` | `@cfxdevkit/testing` (`cfx-core`) | Equivalent |

---

## Part 2 — Porting Gaps (Action Required)

---

### GAP A — MCP Server: Missing 36 Tools 🔴 HIGH

**Framework has:** 34 tools across 6 groups  
**DevKit-workspace has:** 70+ tools across 12 groups

The framework MCP server is missing entire tool groups that AI agents rely on for the full dev loop.

#### Missing Tool Groups

**Group 1: Workspace / Docker lifecycle** (5 tools)

| Tool ID | Description |
|---------|-------------|
| `workspace_status` | Check if the workspace stack (backend + node + DEX) is running |
| `workspace_start` | Start full workspace stack via Docker Compose |
| `workspace_stop` | Stop full workspace stack |
| `workspace_logs` | Tail logs from a named service |
| `docker_available` | Check if Docker/Podman is reachable |

**Group 2: Backend API relay** (3 tools)

| Tool ID | Description |
|---------|-------------|
| `backend_health` | Check devnode-server health |
| `backend_api_catalog` | List all backend HTTP endpoints |
| `backend_api_call` | Generic proxy for any backend route |

**Group 3: DEX tools** (8 tools)

| Tool ID | Description |
|---------|-------------|
| `dex_status` | Current DEX readiness and pool count |
| `dex_deploy` | Deploy Swappi V2 contracts + seed liquidity |
| `dex_manifest` | List all deployed DEX contracts |
| `dex_translation_table` | Token address ↔ symbol mapping |
| `dex_wcfx_price` | Price of WCFX in USDT |
| `dex_reset` | Wipe and redeploy DEX |
| `dex_source_pools` | Fetch live pool state (reserves, prices) |
| `dex_seed_from_gecko` | Seed DEX prices from GeckoTerminal |

**Group 4: Agent / Operations tracking** (7 tools)

| Tool ID | Description |
|---------|-------------|
| `extension_capability_map` | Return map of all available MCP tool capabilities |
| `agent_workspace_context` | Return full workspace context for AI agent orientation |
| `agent_tool_contracts` | Return deployed contracts available to agent |
| `agent_operation_get` | Retrieve a specific past operation by ID |
| `agent_operations_recent` | List N most recent operations |
| `agent_runbook_execute` | Execute a named runbook (e.g. `local_stack_doctor`) |
| `local_stack_status` | Comprehensive readiness check of the full local stack |

**Group 5: Project / Workspace management** (4 tools)

| Tool ID | Description |
|---------|-------------|
| `project_info` | Return package.json metadata and workspace structure |
| `project_doctor` | Run diagnostics and report problems |
| `project_script_run` | Run a named package.json script |
| `project_dev_server_status` | Check if Vite / backend dev server is listening |

**Group 6: Extended Keystore / Wallet management** (5 tools — framework has 4, missing these)

| Tool ID | Description |
|---------|-------------|
| `cfxdevkit_keystore_lock` | Lock the active keystore |
| `cfxdevkit_wallet_add` | Add a new wallet/mnemonic |
| `cfxdevkit_wallet_activate` | Set the active wallet |
| `cfxdevkit_wallet_delete` | Remove a wallet |
| `cfxdevkit_wallet_rename` | Rename a wallet |

**Group 7: Extended Node lifecycle** (3 tools — framework has start/stop/status/mine, missing these)

| Tool ID | Description |
|---------|-------------|
| `cfxdevkit_node_restart` | Restart node without wiping |
| `cfxdevkit_node_wipe_restart` | Wipe chain state then restart |
| `cfxdevkit_node_wipe` | Wipe chain state only |

**Group 8: Bootstrap catalog (production contract deployment)** (5 tools)

| Tool ID | Description |
|---------|-------------|
| `conflux_bootstrap_catalog` | List all known production token contracts |
| `conflux_bootstrap_entry` | Get details for one bootstrap entry |
| `conflux_bootstrap_prepare` | Prepare (compile) a bootstrap contract |
| `conflux_bootstrap_deploy` | Deploy one bootstrap contract |
| `conflux_bootstrap_deploy_multi` | Deploy multiple bootstrap contracts in sequence |

**Location to add:** `repos/cfx-tools/packages/mcp-server/src/tools/`  
**Effort:** Each tool group is 1 file, 100–300 lines. Groups 1–5 require devnode-server route additions first.

---

### GAP B — devnode-server: Missing Route Groups 🔴 HIGH

**Framework has:** 6 routes (node start/stop/restart/wipe/mine + health)  
**DevKit-workspace backend has:** 15+ route groups

#### Missing Route Groups

| Route Group | Endpoints | Notes |
|-------------|-----------|-------|
| **Keystore** | `GET /keystore/status`, `POST /keystore/setup`, `POST /keystore/unlock`, `POST /keystore/lock`, `GET /keystore/wallets`, `POST /keystore/wallets`, `PUT /keystore/wallets/:id/activate`, `DELETE /keystore/wallets/:id`, `PATCH /keystore/wallets/:id/rename` | Full wallet management |
| **Accounts** | `GET /accounts`, `POST /accounts/fund`, `GET /accounts/faucet` | Pre-funded genesis accounts |
| **Contracts** | `GET /contracts`, `GET /contracts/:id`, `DELETE /contracts/:id`, `DELETE /contracts`, `POST /contracts/register`, `POST /contracts/call`, `POST /contracts/deploy` | Deployed contract registry |
| **Network** | `GET /network/current`, `GET /network/capabilities`, `GET /network/config`, `POST /network/config`, `POST /network/set` | Network/chain switching |
| **Mining** | `GET /mining/status`, `POST /mining/start`, `POST /mining/stop` | Continuous mining mode |
| **Bootstrap** | `GET /bootstrap/catalog`, `POST /bootstrap/deploy`, `POST /bootstrap/deploy-multi` | Production contract catalog |
| **DEX** | `GET /dex/status`, `POST /dex/deploy`, `GET /dex/pools`, `GET /dex/manifest`, `GET /dex/translation-table`, `POST /dex/reset`, `POST /dex/seed` | Swappi V2 lifecycle |

**Location:** `repos/cfx-tools/packages/devnode-server/src/app.ts` (extend) + new route files  
**Note:** Some routes need the `@cfxdevkit/services` keystore wired in. The devnode-server currently only wraps `@cfxdevkit/devnode`.

---

### GAP C — VS Code Extension: Missing Tree Views and Commands 🔴 HIGH

**Framework has:** 1 tree view (`mainView`), full keystore/contract/node commands  
**DevKit-workspace has:** 5 tree views + DEX status bar + Docker/stack commands

#### Missing Tree Views

| View ID | Provider | Displays |
|---------|----------|---------|
| `cfxdevkit.networkView` | `NetworkProvider` | Selected network (Local/Testnet/Mainnet) with switch action |
| `cfxdevkit.nodeView` | `NodeControlProvider` | Node status (running/stopped), start/stop/restart/wipe actions |
| `cfxdevkit.accountsView` | `AccountsProvider` | Genesis accounts with eSpace+Core balances |
| `cfxdevkit.dexView` | `DexPoolsProvider` | Deployed DEX pools with reserves and prices |

**Note:** `cfxdevkit.contractsView` appears to already exist in the framework extension. The above 4 are missing.

#### Missing Status Bars

| Status Bar | Shows |
|-----------|-------|
| `registerDexUiStatusBar()` | DEX running state + "Start DEX UI" button |

#### Missing Command Groups

| Command Group | Commands | Source file |
|-------------|---------|-------------|
| **Stack (Docker)** | `cfxdevkit.stack.start`, `.stop`, `.logs`, `.status` | `conflux-stack-commands.ts` |
| **Dev Container** | `cfxdevkit.devcontainer.rebuild`, `.open` | `conflux-devcontainer-commands.ts` |
| **DEX** | `cfxdevkit.dex.deploy`, `.status`, `.openUI`, `.reset` | `conflux-dex-commands.ts` |
| **Bootstrap** | `cfxdevkit.bootstrap.deploy`, `.catalog` | (new) |

**Location:** `repos/cfx-tools/packages/vscode-extension/src/`

---

### GAP D — `@cfxdevkit/defi-react`: Missing DEX Data Hooks 🟡 MEDIUM

**Framework has:** `SwapWidget`, `PortfolioTable`, `TokenPicker`, `TxStatusToast/List`, `Button/Card/Badge/Tabs/NetworkBadge`  
**DevKit has:** `usePoolTokens()`, `useTokenPrice()`, `getPairedTokens()`, `PoolsProvider`

The framework `defi-react` has DeFi UI widgets but no actual DEX data integration hooks. `SwapWidget` uses a `DexAdapter` interface that consumers must implement — the actual Swappi adapter is not included.

#### Missing

| Export | Description | Source |
|--------|-------------|--------|
| `usePoolTokens(address)` | Resolve pool token pair + user balances from Swappi | `devkit/packages/defi-react/src/` |
| `useTokenPrice(address)` | Fetch price from Swappi oracle | same |
| `getPairedTokens(tokens, address)` | Filter tokens involved in a pool pair | same |
| `PoolsProvider` | Context provider for pool state | same |
| `SwappiAdapter` | Concrete `DexAdapter` implementation for Swappi V2 | missing — needs devnode-server DEX routes |
| `createSwappiAdapter(chainId)` | Factory to create a Swappi DexAdapter | missing |

**Location:** `repos/cfx-ui/packages/defi-react/src/`

---

### GAP E — `ui-shared`: Missing 16 Components 🟡 MEDIUM

**Framework has:** `Button`, `Card`, `Badge`, `Tabs`, `NetworkBadge` (in `defi-react/primitives`)  
**DevKit-workspace `ui-shared` has:** 21 components including DEX trade widgets

#### Missing Components

| Component | Description | Used by |
|-----------|-------------|---------|
| `ConnectButton` | Full wallet connect button (shows address when connected) | dApp templates |
| `CopyButton` | Icon button that copies text to clipboard | everywhere |
| `AppToaster` | Toast notification container (wraps sonner/toast) | app layout |
| `DevkitStatus` | Composite status panel (node + keystore + DEX) | dashboard |
| `Faucet` / `FaucetWidget` | UI to request test tokens from devnode faucet | dApp templates |
| `Input` | Styled text input with label + error state | forms |
| `MetricCard` | KPI card (label + value + optional delta) | analytics |
| `SectionHeader` | Section title with optional subtitle and action | layout |
| `SegmentedControl` | Toggle between N named options | trade UI |
| `SelectableListItem` | List item with radio/checkbox selection | wallet picker |
| `SelectMenu` | Dropdown select with `SelectMenuOption` type | network/token selectors |
| `ShellOverview` | Full-page overview panel (system health) | devkit dashboard |
| `StatusBanner` | Inline status alert (info/warning/error/success) | connection states |
| `TradeActionBar` | Swap/Provide action bar with slippage control | DEX |
| `TradeSummaryGrid` | Route + price impact + fee summary table | DEX |
| `TradeTokenField` | Token amount input with token picker trigger | DEX swap |

**Also missing:**
- `AuthProvider` + `useAuth()` hook — authentication state for dApp sessions

**Location to add:** `repos/cfx-ui/packages/defi-react/src/primitives/` (extend existing) or new `repos/cfx-ui/packages/ui-shared/` package

---

### GAP F — Scaffold Templates: Fidelity Gap 🟡 MEDIUM

**Framework templates** are inline string content (minimal files, simple structure)  
**DevKit-workspace templates** are full directory trees with production infrastructure

#### What the Real Templates Include (That Framework Doesn't)

| File / Directory | Template | Description |
|----------------|----------|-------------|
| `.mcp.json` | all | MCP server config for Copilot/Claude/OpenCode agents |
| `AGENTS.md` | project-example | AI agent instructions for the scaffolded project |
| `CLAUDE.md` | all | Claude Code instructions |
| `.vscode/` | all | VS Code settings + recommended extensions |
| `.github/workflows/` | project-example | CI/CD workflows (build, test, deploy) |
| `.opencode/` | project-example | OpenCode agent config |
| `biome.json` | project-example | Biome linter config |
| `pnpm-workspace.yaml` | project-example | pnpm workspace config |
| `scripts/deploy-contract.mjs` | project-example | Contract deployment helper |
| `scripts/sync-project-network.mjs` | project-example | Sync deployed addresses to dApp |
| `scripts/doctor.mjs` | project-example | Project health check |
| `scripts/list-contracts.mjs` | project-example | List deployed contracts |
| `deployments/contracts.json` | project-example | Deployment tracking file |
| `docker-compose.yml` | project-example | Full stack compose |
| `vercel.json` | project-example | Vercel deployment config |
| `dapp/wagmi.config.ts` | project-example | Wagmi + wagmi-cli code-gen config |
| `dapp/src/components/` | project-example | Pre-built React components |

**Current framework templates** only generate: package.json, tsconfig.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, README.md.

**Recommendation:** Port the full template directory trees from devkit-workspace into the scaffold-cli `templates/` sub-files, or implement file-system-based template reading (disk templates that ship with the package).

---

### GAP G — `@cfxdevkit/defi-react`: SwapService / DEX Integration 🟡 MEDIUM

**Devkit `@cfxdevkit/services`** exports a `SwapService` class that wraps Swappi DEX:
- `getQuote(params)` — get swap quote with route
- `executeSwap(params)` — execute swap with slippage
- `getPoolTokens(pairAddress)` — resolve pair tokens + reserves
- `getTokenPrice(address)` — price via Swappi router

The framework has no concrete DEX service implementation. The `SwapWidget` uses a `DexAdapter` interface but no implementation ships with the framework.

**Missing:**
- `SwapService` class wrapping Swappi V2 Router/Factory ABIs
- `createSwapService(client, config)` factory
- Swappi V2 ABIs (Factory, Router, Pair) — currently only in devkit-workspace `contracts/`

**Location:** `repos/cfx-ui/packages/defi-react/src/` or new `repos/cfx-core/packages/` package

---

### GAP H — `@cfxdevkit/shared` HTTP Client 🟡 MEDIUM

**Devkit-workspace `@devkit/shared`** provides:
- `ConfluxDevkitClient` — typed HTTP client for the devnode-server API
- `DexFeed` / `DexMirror` utilities — DEX price feed, reserve sync
- `DexSimulation` — local DEX trade simulation without on-chain calls
- `DockerUtils` — `getComposeStatus()`, `runCompose()`, `isDockerAvailable()`
- `WorkspaceDetector` — detect which project type is in cwd
- `NetworkConfig` — typed network configuration

The framework has no equivalent. All tools (MCP, CLI) call the devnode-server directly via `fetch`. A typed client makes integration safer and enables the MCP workspace tools in GAP A.

**Missing:**
- `@cfxdevkit/client` package (or add to existing package) with typed HTTP client for devnode-server
- DEX simulation utilities (useful for local development without wallet)
- Docker compose utilities (needed by MCP workspace tools and VS Code stack commands)

---

### GAP I — `@cfxdevkit/compiler` Templates: Remaining Gaps 🟢 LOW

**Framework has:** 9 templates (simple-storage, counter, erc20, erc721, payable-vault, escrow, multisig, name-registry, ballot)  
**Devkit has:** 8 templates (counter, erc721, voting, escrow, multisig, registry + simple-storage + TestToken)

The framework template coverage is broader. The only devkit templates not ported:
- `getTestTokenContract()` — pre-configured ERC-20 for testing (mint-on-demand)
- `getVotingContract()` — convenience alias for Ballot (different name in devkit)

These are minor and low priority.

---

### GAP J — DEX UI App: Not Ported 🔴 (Tracked Separately)

**DevKit-workspace has:** A full standalone DEX UI (`apps/dex-ui`) built with React + Vite, featuring:
- Swap interface (multi-hop route aggregation)
- Portfolio view (token balances)
- Pools management (add/remove liquidity, `AddLiquidity.tsx`, `Pools.tsx`)
- Analytics (pair reserves, price impact)
- Faucet widget
- Token icon manager (`TokenIconManager.tsx`)
- Local DEX status panel
- Vault operations (`Vault.tsx`)

**Framework has:** `SwapWidget`, `PortfolioTable` as embeddable components in `defi-react`, but no standalone DEX app.

**Assessment:** The DEX UI app is used in the devkit-workspace devcontainer to provide a local trading interface. Porting it would go into `projects/` or a new `repos/cfx-ui/apps/dex-ui/`. Lower priority than MCP/server gaps but important for the full "local DEX" experience.

---

### GAP K — `@cfxdevkit/protocol`: Swappi Contract ABIs 🟢 LOW

**Devkit `@cfxdevkit/protocol`** re-exports production contract ABIs:
- `automationManagerAbi`, `permitHandlerAbi`, `swappiPriceAdapterAbi`
- `automationManagerAddress`, `permitHandlerAddress`, `swappiPriceAdapterAddress`

These are needed by the DEX service (GAP G) and the automation strategies. The framework `@cfxdevkit/protocol` has only precompile ABIs. The Swappi adapter ABIs should be added here.

---

## Part 3 — Implementation Order

Ordered by dependency and user impact:

```
Priority 1 — Core infrastructure (unblocks everything else):
  GAP B  devnode-server routes     🔴 HIGH  keystore/accounts/contracts/network/mining
  GAP A  MCP tools (groups 1-5)   🔴 HIGH  requires GAP B routes first

Priority 2 — AI agent experience:
  GAP A  MCP tools (groups 6-8)   🔴 HIGH  keystore/wallet/bootstrap/DEX tools
  GAP C  VS Code extension views  🔴 HIGH  network/node/accounts/DEX tree views

Priority 3 — DeFi / DEX completeness:
  GAP G  SwapService / DEX ABIs   🟡 MEDIUM  Swappi V2 integration
  GAP D  defi-react DEX hooks     🟡 MEDIUM  usePoolTokens/useTokenPrice/SwappiAdapter
  GAP J  DEX UI app               🔴 MEDIUM  standalone trading interface

Priority 4 — DX / scaffolding:
  GAP F  Template fidelity        🟡 MEDIUM  full file trees with scripts/MCP/CI
  GAP E  ui-shared components     🟡 MEDIUM  ConnectButton/Faucet/TradeWidgets

Priority 5 — Polish:
  GAP H  Shared HTTP client       🟡 MEDIUM  typed devnode-server client
  GAP I  Compiler templates       🟢 LOW     TestToken/Voting templates
  GAP K  Protocol ABIs            🟢 LOW     Swappi adapter ABIs
```

---

## Part 4 — Already Ported (Detailed)

All items below require no further action.

### `cfx-core` packages
- `@cfxdevkit/core` — RPC clients, address utils, chains, BIP-44 derivation, Wei type
- `@cfxdevkit/devnode` — local dual-space node lifecycle via `@xcfx/node`
- `@cfxdevkit/automation` — generic async job runner (replaces devkit executor; enhanced with DCA/limit/TWAP/Keeper)
- `@cfxdevkit/protocol` — precompile ABIs (adminControl, sponsorWhitelist, staking, crossSpaceCall, posRegister)
- `@cfxdevkit/testing` — test fixtures, mock client, waitFor utilities

### `cfx-keys` packages
- `@cfxdevkit/services` — KeystoreProvider (file/memory/Ledger/OS/KMS), auth tokens
- `@cfxdevkit/wallet` — signerFromKeystore, hardware wallets (Ledger/OneKey/Satochip), session keys, batcher

### `cfx-domain` packages
- `@cfxdevkit/automation` — DCA/LimitOrder/TWAP strategies, Keeper, PriceChecker, RetryQueue, SafetyGuard

### `cfx-solidity` packages
- `@cfxdevkit/compiler` — compile(), 9 Solidity templates, resolver composition
- `@cfxdevkit/abis` — ERC-20/721/1155/4626, Multicall3 (viem re-exports)
- `@cfxdevkit/contracts` — contract read/write/deploy facades

### `cfx-ui` packages
- `@cfxdevkit/react` — hooks-only redesign (useAccount, useBalance, useContract, useTx, useWatchEvent, CfxProvider)
- `@cfxdevkit/theme` — CSS variable tokens, ThemeProvider, dark mode, design tokens
- `@cfxdevkit/wallet-connect` — wagmi config, useCoreWallet, useEspaceConnectors, SIWE, WalletPickerModal, switchEspaceChain
- `@cfxdevkit/defi-react` — SwapWidget, PortfolioTable, TokenPicker, TxStatusToast, DexAdapter interface, Button/Card/Badge/Tabs/NetworkBadge

### `cfx-tools` packages
- `@cfxdevkit/cli` — `cfx status`, `cfx derive`, `cfx generate` CLI
- `@cfxdevkit/create` (scaffold-cli) — project scaffolder, 3 templates, target system
- `@cfxdevkit/devnode-server` — Hono REST control plane (node lifecycle — 6 routes)
- `@cfxdevkit/mcp-server` — 34 MCP tools (node, accounts, blockchain R/W, keystore, compiler, wallet)
- VS Code extension — node mgmt, keystore, contract deploy/call, account derivation, tree view

### `cfx-llm` packages
- `@cfxdevkit/llm-tools` — LLM commit quality gates, hotspot detection, test/lint/typecheck runner
