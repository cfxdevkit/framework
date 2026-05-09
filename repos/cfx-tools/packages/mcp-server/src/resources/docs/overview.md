# cfxdevkit Framework Overview

**cfxdevkit** is a TypeScript monorepo toolkit for building, testing, and deploying on the Conflux Network.
It provides a local devnode, Solidity compiler, wallet utilities, and React component library — all
wired together and accessible through this MCP server.

## Quick Start

```ts
// 1. Start a local devnode
cfxdevkit_node_start

// 2. List funded test accounts
cfxdevkit_accounts_list

// 3. Compile and deploy a contract
cfxdevkit_compiler_compile_and_deploy { source: "...", contractName: "Counter" }

// 4. Read contract state
cfxdevkit_blockchain_call_contract_espace { address, abi, method: "count", args: [] }
```

## Devnode

The local devnode runs a full Conflux node in memory with:
- **eSpace** (EVM-compatible): `http://127.0.0.1:8545`
- **Core Space**: `http://127.0.0.1:12537`
- Pre-funded test accounts (indices 0–9) + a faucet account
- Instant block mining on demand via `cfxdevkit_node_mine`

## Workflow Patterns

### Deploy & Interact
1. `cfxdevkit_node_start` → start the chain
2. `cfxdevkit_compiler_compile_and_deploy` → compile + deploy
3. `cfxdevkit_blockchain_call_contract_espace` → read state
4. `cfxdevkit_blockchain_write_contract` → mutate state
5. `cfxdevkit_node_mine` → confirm transactions

### Scaffold a New Project
1. `cfxdevkit_scaffold_list_templates` → see available templates
2. `cfxdevkit_scaffold_preview_template` → preview file tree
3. `cfxdevkit_scaffold_create_project` → generate project on disk
4. `cfxdevkit_scaffold_add_mcp_config` → add `.mcp.json` to project

### Wallet Operations
1. `cfxdevkit_wallet_generate_mnemonic` → create a new mnemonic
2. `cfxdevkit_wallet_derive_accounts` → get eSpace + Core addresses
3. `cfxdevkit_keystore_setup` → store securely in keystore
4. `cfxdevkit_keystore_unlock` → unlock for signing

## Network IDs

| Network | Chain ID | RPC |
|---------|----------|-----|
| eSpace local | 2030 | `http://127.0.0.1:8545` |
| Core Space local | 2029 | `http://127.0.0.1:12537` |
| eSpace testnet | 71 | `https://evmtestnet.confluxrpc.com` |
| Core Space testnet | 1 | `https://test.confluxrpc.com` |
