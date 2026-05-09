# MCP Server — Full Implementation Plan

> **Status:** Ready for implementation review  
> **Spec version:** MCP 2025-06-18  
> **Package:** `@cfxdevkit/mcp-server`

---

## 1. Decisions Made (Answers to Clarifying Questions)

| Concern | Decision |
|---|---|
| Transport | **stdio only** — works with Claude Desktop, Cursor, VS Code Copilot, Windsurf, etc. |
| Packaging | **`npx @cfxdevkit/mcp-server`** — Node.js required on host; single npm publish |
| Runtime model | **Direct-package mode** — import `@cfxdevkit/devnode`, `@cfxdevkit/compiler`, etc. directly |
| Protocol features | **Tools + Resources** — 37 tools + CWD-aware resource endpoints |
| Project awareness | **Yes** — reads `.mcp.json`, `deployments/contracts.json`, `pnpm-workspace.yaml` at startup |
| Scaffold | **Yes** — `cfxdevkit_scaffold_*` tools using `@cfxdevkit/scaffold-cli` |
| Authentication | **None** — stdio isolation; out of scope for initial implementation |
| Target clients | Claude Desktop, VS Code Copilot Agent, Cursor, any MCP-compatible client |

---

## 2. Current State vs. Target State

### Current State

The `@cfxdevkit/mcp-server` package currently contains:
- **33 tool definitions** (schemas only — `name`, `description`, `inputSchema`, `group`, `mutability`)
- **`OperationLedger`** class for tracking in-flight operations
- **No runtime handlers** — tool calls would produce no response
- **No transport** — no stdio or HTTP binding
- **No `@modelcontextprotocol/sdk`** dependency
- **No `bin` entry** — not runnable via `npx`

### Target State

A fully-functional standalone MCP server:
- **37 tools** with runtime handlers (33 existing + 4 new scaffold tools)
- **8 resource endpoints** exposing live chain state, ABIs, docs, project context
- **stdio transport** via `@modelcontextprotocol/sdk`
- **`bin` entry** pointing to `dist/bin/server.js` — runnable via `npx @cfxdevkit/mcp-server`
- **CWD-aware** context loading from scaffolded project directories
- **Framework knowledge** embedded as static resources

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  AI Client (Claude Desktop / Copilot / Cursor)      │
│  config: { command: "npx", args: ["-y",             │
│            "@cfxdevkit/mcp-server"] }               │
└────────────────────┬────────────────────────────────┘
                     │ stdio (JSON-RPC, newline-delimited)
┌────────────────────▼────────────────────────────────┐
│            @cfxdevkit/mcp-server                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  bin/server.ts  (entry point)                │   │
│  │    · load project context from CWD           │   │
│  │    · create McpServer instance               │   │
│  │    · register tools + resources              │   │
│  │    · start StdioServerTransport              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  src/                                               │
│  ├── server.ts          McpServer factory           │
│  ├── context/                                       │
│  │   ├── loader.ts      CWD context detection       │
│  │   └── types.ts       ProjectContext type         │
│  ├── handlers/          Tool runtime handlers       │
│  │   ├── node.ts        devnode start/stop/status   │
│  │   ├── accounts.ts    list/get/fund               │
│  │   ├── keystore.ts    status/setup/unlock/list    │
│  │   ├── blockchain.ts  read + write ops            │
│  │   ├── compiler.ts    compile / deploy            │
│  │   ├── wallet.ts      mnemonic / derive           │
│  │   └── scaffold.ts    list/create/preview         │
│  ├── resources/         Resource endpoint handlers  │
│  │   ├── registry.ts    registerAllResources()      │
│  │   ├── chain.ts       node status, accounts       │
│  │   ├── contracts.ts   deployed ABIs               │
│  │   ├── project.ts     project.json, workspace     │
│  │   └── docs.ts        embedded framework docs     │
│  └── tools/             (existing — schemas only)   │
│      ├── registry.ts    MCP_TOOL_DEFINITIONS        │
│      ├── types.ts       McpToolDefinition           │
│      ├── node.ts  accounts.ts  keystore.ts          │
│      ├── blockchain.ts  compiler.ts  wallet.ts      │
│      └── scaffold.ts    NEW                         │
└──────────┬──────────────────────────────────────────┘
           │ direct package imports (no HTTP hop)
┌──────────▼──────────────────────────────────────────┐
│  @cfxdevkit/* packages                              │
│  ├── @cfxdevkit/devnode   node lifecycle            │
│  ├── @cfxdevkit/core      RPC, account, mnemonic    │
│  ├── @cfxdevkit/compiler  solidity compile/deploy   │
│  ├── @cfxdevkit/wallet    signer, key management    │
│  ├── @cfxdevkit/services  higher-level services     │
│  ├── @cfxdevkit/contracts ERC-20, ABIs              │
│  ├── @cfxdevkit/scaffold-cli  NEW dependency        │
│  └── @cfxdevkit/protocol  chain types               │
└─────────────────────────────────────────────────────┘
```

---

## 4. Package Changes

### 4.1 Add Dependencies

```json
// repos/cfx-tools/packages/mcp-server/package.json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.15.0",   // ADD
    "@cfxdevkit/scaffold-cli": "workspace:^",  // ADD
    // existing deps remain unchanged
  },
  "bin": {
    "cfxdevkit-mcp": "./dist/bin/server.js"   // ADD
  }
}
```

### 4.2 Add `bin` Export

The compiled `dist/bin/server.js` will be executable. The `files` array already includes `dist`.

### 4.3 Vite Build Update

The `vite.config.ts` must add a second library entry for the bin target:
```ts
// Multiple entry points: index (library) + bin/server (CLI)
build: {
  lib: {
    entry: {
      index: 'src/index.ts',
      'bin/server': 'src/bin/server.ts',
    }
  }
}
```

---

## 5. Directory Structure (new files)

```
repos/cfx-tools/packages/mcp-server/src/
├── index.ts                    MODIFY: add server export
├── server.ts                   NEW: McpServer factory
├── bin/
│   └── server.ts               NEW: CLI entry (shebang, stdio start)
├── context/
│   ├── types.ts                NEW: ProjectContext interface
│   └── loader.ts               NEW: detectProjectContext()
├── handlers/
│   ├── node.ts                 NEW: ~120 lines
│   ├── accounts.ts             NEW: ~100 lines
│   ├── keystore.ts             NEW: ~130 lines
│   ├── blockchain.ts           NEW: ~200 lines (split into read + write)
│   ├── compiler.ts             NEW: ~150 lines
│   ├── wallet.ts               NEW: ~100 lines
│   └── scaffold.ts             NEW: ~130 lines
├── resources/
│   ├── registry.ts             NEW: ~80 lines
│   ├── chain.ts                NEW: ~120 lines
│   ├── contracts.ts            NEW: ~100 lines
│   ├── project.ts              NEW: ~100 lines
│   └── docs.ts                 NEW: ~120 lines
└── tools/
    ├── registry.ts             MODIFY: add scaffoldTools
    ├── types.ts                (unchanged)
    ├── node.ts                 (unchanged)
    ├── accounts.ts             (unchanged)
    ├── keystore.ts             (unchanged)
    ├── blockchain.ts           (unchanged)
    ├── compiler.ts             (unchanged)
    ├── wallet.ts               (unchanged)
    └── scaffold.ts             NEW: 4 tool definitions
```

All new handler files are kept under 250 lines to pass the precommit gate.

---

## 6. Tool Inventory (37 total)

### Group 1 — node-control (4 tools)

| Tool Name | Input | Action | Packages |
|---|---|---|---|
| `cfxdevkit_node_start` | `{ port?: number }` | Start devnode subprocess, wait for ready | `@cfxdevkit/devnode` |
| `cfxdevkit_node_stop` | `{}` | Graceful shutdown of devnode | `@cfxdevkit/devnode` |
| `cfxdevkit_node_status` | `{}` | Return node health, epoch, peer count | `@cfxdevkit/devnode` + `@cfxdevkit/core` |
| `cfxdevkit_node_mine` | `{ blocks: number }` | Mine N blocks on demand | `@cfxdevkit/devnode` |

Handler notes: The devnode is managed as a singleton within the MCP server process lifetime. Use an in-memory registry (`Map<pid, ChildProcess>`) protected by mutex. On `node_stop`, terminate the child process and clean up. All stderr from devnode goes to MCP server's stderr.

### Group 2 — accounts (3 tools)

| Tool Name | Input | Action |
|---|---|---|
| `cfxdevkit_accounts_list` | `{ network?: "espace"\|"core" }` | List all funded test accounts with balances |
| `cfxdevkit_account_get` | `{ index: number, network?: string }` | Get single account details |
| `cfxdevkit_account_fund` | `{ address: string, amount: string, network?: string }` | Fund address from faucet |

### Group 3 — keystore (4 tools)

| Tool Name | Input | Action |
|---|---|---|
| `cfxdevkit_keystore_status` | `{}` | Is keystore initialized, unlocked? |
| `cfxdevkit_keystore_setup` | `{ mnemonic?: string }` | Initialize keystore (auto-generates mnemonic if omitted) |
| `cfxdevkit_keystore_unlock` | `{ password: string }` | Unlock keystore for signing |
| `cfxdevkit_keystore_list_wallets` | `{}` | List wallet entries without exposing private keys |

Security: private keys and raw mnemonics are never returned in tool output. Masked/truncated values only.

### Group 4 — blockchain-read (8 tools)

| Tool Name | Input |
|---|---|
| `cfxdevkit_blockchain_espace_balance` | `{ address: string }` |
| `cfxdevkit_blockchain_core_balance` | `{ address: string }` |
| `cfxdevkit_blockchain_espace_block` | `{ blockNumber?: number }` |
| `cfxdevkit_blockchain_core_epoch` | `{ epochNumber?: number }` |
| `cfxdevkit_blockchain_call_contract_espace` | `{ address, abi, method, args }` |
| `cfxdevkit_blockchain_call_contract_core` | `{ address, abi, method, args }` |
| `cfxdevkit_blockchain_read_erc20` | `{ address: string, field: "name"\|"symbol"\|"totalSupply"\|"decimals" }` |
| `cfxdevkit_blockchain_get_receipt` | `{ txHash: string, network?: string }` |

### Group 5 — blockchain-write (6 tools, `requiresConfirmation: true`)

| Tool Name | Input |
|---|---|
| `cfxdevkit_blockchain_send_cfx_espace` | `{ to, amount, from? }` |
| `cfxdevkit_blockchain_send_cfx_core` | `{ to, amount, from? }` |
| `cfxdevkit_blockchain_write_contract` | `{ address, abi, method, args, from? }` |
| `cfxdevkit_blockchain_deploy_contract` | `{ bytecode, abi, constructorArgs?, from? }` |
| `cfxdevkit_blockchain_erc20_transfer` | `{ token, to, amount, from? }` |
| `cfxdevkit_blockchain_erc20_approve` | `{ token, spender, amount, from? }` |

All write tools:
- Require keystore to be unlocked
- Return transaction hash + receipt summary
- Use `@cfxdevkit/wallet` for signing, `@cfxdevkit/core` for submission

### Group 6 — compiler (4 tools)

| Tool Name | Input | Action |
|---|---|---|
| `cfxdevkit_compiler_list_templates` | `{}` | List available contract templates (Counter, ERC-20, etc.) |
| `cfxdevkit_compiler_get_template` | `{ name: string }` | Return Solidity source of a named template |
| `cfxdevkit_compiler_compile_solidity` | `{ source: string, contractName?: string }` | Compile Solidity, return ABI + bytecode |
| `cfxdevkit_compiler_compile_and_deploy` | `{ source, contractName, constructorArgs?, from? }` | Compile + deploy in one step |

### Group 7 — wallet-utils (4 tools)

| Tool Name | Input | Action |
|---|---|---|
| `cfxdevkit_wallet_generate_mnemonic` | `{ strength?: 128\|256 }` | Generate BIP-39 mnemonic |
| `cfxdevkit_wallet_validate_mnemonic` | `{ mnemonic: string }` | Validate phrase, return `isValid` |
| `cfxdevkit_wallet_derive_accounts` | `{ mnemonic, count?, path? }` | Derive eSpace + Core address pairs |
| `cfxdevkit_wallet_sign_message` | `{ message: string, walletIndex?: number }` | Sign via managed signer |

Security: `derive_accounts` never returns private keys — only public addresses. Sign message returns signature only.

### Group 8 — scaffold (4 tools, NEW)

| Tool Name | Input | Action |
|---|---|---|
| `cfxdevkit_scaffold_list_templates` | `{}` | List available project templates with descriptions |
| `cfxdevkit_scaffold_preview_template` | `{ template: string }` | Show file tree that would be generated |
| `cfxdevkit_scaffold_create_project` | `{ template, name, outputDir, version?, description? }` | Scaffold a new project on disk |
| `cfxdevkit_scaffold_add_mcp_config` | `{ outputDir }` | Add `.mcp.json` to an existing project pointing to this server |

The scaffold tool writes to `outputDir` (absolute or relative to CWD). It uses `@cfxdevkit/scaffold-cli` logic directly (same templates as `@cfxdevkit/scaffold-cli`). After creation, it returns a resource link to the generated project directory.

---

## 7. Resource Endpoints (8 resources)

Resources expose read-only context to AI clients. They are fetched on demand and not subscribed to (static snapshot model for Phase 1).

### URI Scheme: `cfxdevkit://`

| URI | MIME | Content | Live? |
|---|---|---|---|
| `cfxdevkit://node/status` | `application/json` | Node health, epoch, peer count | Yes (calls devnode) |
| `cfxdevkit://accounts/list` | `application/json` | All funded test accounts (addresses, balances) | Yes |
| `cfxdevkit://contracts/deployed` | `application/json` | Contents of `deployments/contracts.json` | CWD-read |
| `cfxdevkit://contracts/{address}/abi` | `application/json` | ABI for a deployed contract | CWD-read |
| `cfxdevkit://project/context` | `application/json` | Package name, version, deps, scripts | CWD-read |
| `cfxdevkit://docs/overview` | `text/markdown` | Framework overview (embedded static text) | Static |
| `cfxdevkit://docs/packages` | `text/markdown` | Package descriptions and usage | Static |
| `cfxdevkit://docs/templates` | `text/markdown` | Available templates + what they scaffold | Static |

**Resource template** (parameterized):
```
cfxdevkit://contracts/{address}/abi
```
This allows clients to request the ABI for any known deployed contract address.

### Content Strategy

- **Live resources** (`node/status`, `accounts/list`): call packages on each `resources/read` request. Return `isError: true` equivalent if devnode is not running — include a helpful message explaining how to start it.
- **CWD resources** (`contracts/deployed`, `project/context`): read from disk on each `resources/read`. If the project directory doesn't have the file, return a 404-equivalent with a helpful message.
- **Static resources** (`docs/*`): compiled into the bundle as string constants. The docs are authored in `src/resources/docs/` as `.md` files and imported at build time via Vite's `?raw` import.

---

## 8. Project Context Loading

### Detection Logic (`src/context/loader.ts`)

```
detectProjectContext(cwd: string): ProjectContext
```

1. Look for `.mcp.json` in `cwd` (project marker)
2. Look for `package.json` in `cwd` (project name, version, dependencies)
3. Look for `pnpm-workspace.yaml` in `cwd` (monorepo detection)
4. Look for `deployments/contracts.json` in `cwd` (deployed contracts registry)
5. Look for `wagmi.config.ts` or `wagmi.config.js` in `cwd` (frontend project)

### ProjectContext Shape

```typescript
interface ProjectContext {
  cwd: string;
  isProject: boolean;                     // has .mcp.json or package.json
  projectName: string | null;
  projectVersion: string | null;
  isMonorepo: boolean;                    // has pnpm-workspace.yaml
  deployedContracts: DeployedContracts | null;
  hasFrontend: boolean;                   // has wagmi.config.ts
  mcpConfig: McpConfig | null;            // parsed .mcp.json
}
```

### Startup Flow

1. `bin/server.ts` calls `detectProjectContext(process.cwd())`
2. Context is passed to `McpServer` factory
3. `McpServer` registers all tools and resources
4. Resources use context to decide which CWD-relative files to expose
5. If `isProject: false`, CWD resources return empty/null with a helpful note

---

## 9. Implementation Phases

### Phase 1 — Core Infrastructure (estimated 6 files, ~600 total lines)

**Goal:** The server starts, connects via stdio, lists tools, responds to `ping`.

Files to create:
1. `src/bin/server.ts` (~60 lines) — shebang, startup, error handling
2. `src/server.ts` (~120 lines) — `McpServer` class, SDK wiring, tool dispatch table
3. `src/context/types.ts` (~50 lines) — `ProjectContext` interface
4. `src/context/loader.ts` (~120 lines) — `detectProjectContext()`
5. `src/tools/scaffold.ts` (~100 lines) — 4 scaffold tool definitions
6. Update `src/tools/registry.ts` — add `scaffoldTools`
7. Update `src/index.ts` — export server factory

**Test:** `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}' | node dist/bin/server.js`

### Phase 2 — Node + Accounts Handlers (~300 lines)

**Goal:** `cfxdevkit_node_*` and `cfxdevkit_accounts_*` tools return real data.

Files to create:
1. `src/handlers/node.ts` (~120 lines) — devnode lifecycle (singleton child process)
2. `src/handlers/accounts.ts` (~100 lines) — list/get/fund

**Test:** Start server, call `cfxdevkit_node_start`, then `cfxdevkit_accounts_list`.

### Phase 3 — Keystore + Wallet Handlers (~230 lines)

Files to create:
1. `src/handlers/keystore.ts` (~130 lines) — status/setup/unlock/list_wallets
2. `src/handlers/wallet.ts` (~100 lines) — mnemonic/derive/sign

**Security checkpoint:** Confirm no private key leakage in outputs.

### Phase 4 — Blockchain Handlers (~200 lines)

Files to create:
1. `src/handlers/blockchain.ts` (~200 lines) — split into `handleBlockchainRead()` and `handleBlockchainWrite()`

Notes:
- Read handlers: no wallet required, no confirmation
- Write handlers: check keystore unlocked before proceeding; return `isError: true` with guidance if not

### Phase 5 — Compiler + Scaffold Handlers (~280 lines)

Files to create:
1. `src/handlers/compiler.ts` (~150 lines) — compile/deploy via `@cfxdevkit/compiler`
2. `src/handlers/scaffold.ts` (~130 lines) — list/preview/create/add-mcp-config

### Phase 6 — Resources (~540 lines)

Files to create:
1. `src/resources/registry.ts` (~80 lines) — `registerAllResources()`, resource template handling
2. `src/resources/chain.ts` (~120 lines) — node status + accounts resources
3. `src/resources/contracts.ts` (~100 lines) — deployed contracts + ABI template
4. `src/resources/project.ts` (~100 lines) — project context resource
5. `src/resources/docs.ts` (~120 lines) — static markdown docs
6. `src/resources/docs/overview.md` — framework overview doc
7. `src/resources/docs/packages.md` — package descriptions
8. `src/resources/docs/templates.md` — scaffold template guide

### Phase 7 — Polish + Distribution (~120 lines)

1. Update `package.json` — add `bin`, `@modelcontextprotocol/sdk`, `@cfxdevkit/scaffold-cli`
2. Update `vite.config.ts` — dual entry point (library + bin)
3. Add `shebang` to `bin/server.ts`
4. Add comprehensive error handling and timeout guards
5. Add README usage section for each AI client (Claude Desktop, VS Code, Cursor)
6. Validate `npx @cfxdevkit/mcp-server` works end-to-end

---

## 10. Error Handling Strategy

### Tool Execution Errors

All handlers return MCP-compliant error responses (not throw):
```typescript
return {
  isError: true,
  content: [{ type: 'text', text: `Error: ${err.message}\n\nHint: ${hint}` }]
};
```

Common error classes and their hints:
- **Node not running**: "Run `cfxdevkit_node_start` first or start devnode manually"
- **Keystore locked**: "Run `cfxdevkit_keystore_unlock` with your password first"
- **Compile error**: Returns Solidity compiler error verbatim + line number
- **Deploy failed**: Returns revert reason + tx hash if available
- **Invalid address**: Returns validation error with expected format

### Timeout Guards

All handlers that call into packages use `AbortController` with configurable timeouts:
- Node start: 30 seconds
- RPC calls: 10 seconds
- Compilation: 60 seconds
- Deploy: 120 seconds

---

## 11. Security Considerations

| Risk | Mitigation |
|---|---|
| Private key leakage | All key material masked in outputs; `list_wallets` returns addresses only |
| Mnemonic exposure in logs | Handlers write to `stderr` only; mnemonics truncated in logs |
| Arbitrary file write via scaffold | `outputDir` is validated to be within allowed paths; no path traversal |
| RPC injection via contract calls | `method` and `args` are validated against ABI before dispatch |
| Stdout pollution | All logging uses `process.stderr`; nothing prints to stdout except MCP JSON-RPC |

---

## 12. Testing Strategy

### Unit Tests (per handler file)

Each handler file gets a `__tests__/handlers/NAME.test.ts`:
- Mock `@cfxdevkit/devnode` / `@cfxdevkit/core` etc. with vitest mocks
- Test happy path, error path, timeout path
- Test that private keys never appear in output text

### Integration Tests

`__tests__/integration/server.test.ts`:
- Spawn `node dist/bin/server.js` as child process
- Write MCP `initialize` → `tools/list` → `tools/call` sequences via stdin
- Read and parse JSON-RPC responses from stdout
- Tests run against a real (but ephemeral) devnode instance

### Smoke Test

Add to `scripts` in package.json:
```json
"test:smoke": "echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"smoke\",\"version\":\"1\"}}}' | node dist/bin/server.js"
```

---

## 13. npm Distribution

### package.json `bin` field

```json
{
  "bin": {
    "cfxdevkit-mcp": "./dist/bin/server.js"
  }
}
```

### npx Usage (no install)

```bash
# In Claude Desktop claude_desktop_config.json:
{
  "mcpServers": {
    "cfxdevkit": {
      "command": "npx",
      "args": ["-y", "@cfxdevkit/mcp-server"]
    }
  }
}
```

### VS Code `.mcp.json` (in scaffolded projects)

```json
{
  "servers": {
    "cfxdevkit": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@cfxdevkit/mcp-server"],
      "env": {}
    }
  }
}
```

The scaffold-cli templates will be updated to include this `.mcp.json` by default.

### AGENTS.md / CLAUDE.md (in scaffolded projects)

The `project-example` and `minimal-dapp` templates will include guidance in `AGENTS.md` explaining:
- What the cfxdevkit MCP server provides
- Which tools are available and when to use them
- How to start the devnode
- How to deploy contracts via MCP tools

---

## 14. Template Integration

### Files to Update in scaffold-cli

1. **`project-example-config.ts`** — update `.mcp.json` content to use `npx @cfxdevkit/mcp-server` (currently points to local path)
2. **`minimal-dapp.ts`** — add `.mcp.json` entry
3. **`project-example-core.ts`** — update `AGENTS.md` content with MCP tool documentation
4. **`project-example-core.ts`** — update `CLAUDE.md` with devkit usage instructions

---

## 15. Embedded Framework Docs

The static resources (`cfxdevkit://docs/*`) will contain:

### `docs/overview.md`
- What the cfxdevkit framework is
- Which packages exist and their purpose
- How to start a devnode, fund accounts, compile and deploy
- Link to full docs

### `docs/packages.md`
- `@cfxdevkit/core` — RPC client, account management
- `@cfxdevkit/devnode` — local blockchain node lifecycle
- `@cfxdevkit/compiler` — Solidity compilation + deployment
- `@cfxdevkit/wallet` — key management, BIP-39, signing
- `@cfxdevkit/services` — higher-level services
- `@cfxdevkit/contracts` — ERC-20 and other standard contract helpers
- `@cfxdevkit/scaffold-cli` — project scaffolding

### `docs/templates.md`
- `minimal-dapp` — Vite + React + cfxdevkit/react, no backend
- `project-example` — Full-stack: frontend + backend devnode server + contracts
- `wallet-probe` — Wallet interaction testing utility

---

## 16. Implementation Order (Priority)

1. ✅ Clarifying questions answered (this document)
2. 🔲 Phase 1: Core infrastructure (bin entry, server factory, context loader)
3. 🔲 Phase 2: Node + Accounts handlers (highest value, needed for all other operations)
4. 🔲 Phase 3: Keystore + Wallet handlers
5. 🔲 Phase 4: Blockchain handlers
6. 🔲 Phase 5: Compiler + Scaffold handlers
7. 🔲 Phase 6: Resources
8. 🔲 Phase 7: Distribution, template integration, AGENTS/CLAUDE.md updates
9. 🔲 End-to-end test with real Claude Desktop

---

## 17. Out of Scope (Future Work)

- **Streamable HTTP transport** — can be added later without changing handlers
- **Compiled binary** (bun/pkg) — npx is sufficient for Phase 1
- **MCP Prompts** — pre-written agent prompt templates (e.g. "deploy Counter contract") 
- **Resource subscriptions** — live push notifications when node state changes
- **Multi-chain support** — mainnet/testnet targeting (currently localhost devnode only)
- **mTLS / bearer token auth** — needed if HTTP transport is added
- **VS Code tree view integration** (GAP C) — separate track

---

*Review this plan, then signal "start implementation" to begin Phase 1.*
