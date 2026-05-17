// ── Static documentation strings ──────────────────────────────────────────

const OVERVIEW_MD = `# cfxdevkit Framework Overview

**cfxdevkit** is a TypeScript monorepo toolkit for building, testing, and deploying on the Conflux Network.
It provides a local devnode, Solidity compiler, wallet utilities, and React component library — all
wired together and accessible through this MCP server.

## Quick Start

\`\`\`
cfxdevkit_node_start
cfxdevkit_accounts_list
cfxdevkit_compiler_compile_and_deploy { source: "...", contractName: "Counter" }
cfxdevkit_blockchain_call_contract_espace { address, abi, method: "count", args: [] }
\`\`\`

## Devnode

The local devnode runs a full Conflux node with:
- eSpace (EVM-compatible): http://127.0.0.1:8545
- Core Space: http://127.0.0.1:12537
- Pre-funded test accounts (indices 0–9) + a faucet account
- Instant block mining on demand via cfxdevkit_node_mine

## Workflow Patterns

### Deploy & Interact
1. cfxdevkit_node_start → start the chain
2. cfxdevkit_compiler_compile_and_deploy → compile + deploy
3. cfxdevkit_blockchain_call_contract_espace → read state
4. cfxdevkit_blockchain_write_contract → mutate state
5. cfxdevkit_node_mine → confirm transactions

### Scaffold a New Project
1. cfxdevkit_scaffold_list_templates → see available templates
2. cfxdevkit_scaffold_preview_template → preview file tree
3. cfxdevkit_scaffold_create_project → generate project on disk
4. cfxdevkit_scaffold_add_mcp_config → add .mcp.json to project

### Wallet Operations
1. cfxdevkit_wallet_generate_mnemonic → create a new mnemonic
2. cfxdevkit_wallet_derive_accounts → get eSpace + Core addresses
3. cfxdevkit_keystore_setup → store securely in keystore
4. cfxdevkit_keystore_unlock → unlock for signing

## Network IDs

| Network | Chain ID | RPC |
|---------|----------|-----|
| eSpace local | 2030 | http://127.0.0.1:8545 |
| Core Space local | 2029 | http://127.0.0.1:12537 |
| eSpace testnet | 71 | https://evmtestnet.confluxrpc.com |
| Core Space testnet | 1 | https://test.confluxrpc.com |
`;

const PACKAGES_MD = `# cfxdevkit Packages

## @cfxdevkit/core
RPC client, account management, chain utilities.
- createClient({ chain, transport }) → EspaceClient | CoreSpaceClient
- client.getBalance(address) → bigint (wei)
- client.sendRawTransaction(signedTx: Hex) → Hash
- formatCFX(wei), parseCFX(str)
- signerFromPrivateKey(privateKey) → Signer
- generateMnemonic(strength), validateMnemonic(mnemonic)
- deriveDualAccounts({ mnemonic, count, startIndex }) → DualAddressAccount[]
- DualAddressAccount: { evmAddress, coreAddress, privateKey }

## @cfxdevkit/client + @cfxdevkit/devnode-server
Shared control-plane client and backend runtime.
- createConfluxDevkitClient({ baseUrl }) → ConfluxDevkitClient
- client.node.start() / stop() / mine({ blocks }) / status()
- client.accounts.list() / fund({ address, space, amount })
- client.compiler.compileSources(...) / client.deploy.run(...)
- MCP can embed createDevnodeServerApp() for local operation, while handlers use the client surface

## @cfxdevkit/compiler
Solidity compilation with bundled solc.
- compile({ sources, solcVersion }) → { artifacts, warnings }
- artifacts[].abi, .bytecode (Hex), .contractName
- listTemplates() → TemplateMeta[]
- getTemplate(id) → TemplateMeta

## @cfxdevkit/services
Higher-level services including keystore provider.
- createFileKeystore({ path, passphrase }) → KeystoreProvider
- initFileKeystore({ path, passphrase, mnemonic })
- provider.getSigner({ service, account }) → Signer
- provider.list({}) → StoredSecret[]

## @cfxdevkit/create
Project scaffolding templates.
- listTemplates() → TemplateDefinition[]
- scaffoldProject(dir, templateName, { name, skipInstall }) → Promise<void>
- getTemplateFiles(template, target?) → TemplateFile[]

## @cfxdevkit/defi-react
React component library for DeFi UIs.
- AppNavBar, NavBrand, NavWalletActions (nav bar)
- Button, Card, Badge (core primitives)
- TokenPicker (token selection modal)
- TxStatus (transaction status display)
`;

const TEMPLATES_MD = `# cfxdevkit Scaffold Templates

## minimal-dapp
Vite + React frontend with @cfxdevkit/react, wagmi, wallet connect.
Best for: Learning, quick prototypes, frontend-only dApps.

## project-example
Full-stack: frontend + devnode backend server + contracts directory.
Includes AGENTS.md and CLAUDE.md with MCP tool documentation.
Best for: Full-stack dApp development with local blockchain.

## wallet-probe
Wallet interaction testing utility script.
Best for: Testing wallet connections, signing flows, account derivation.

## Usage

cfxdevkit_scaffold_list_templates        → list all templates
cfxdevkit_scaffold_preview_template      → preview file tree
cfxdevkit_scaffold_create_project        → generate on disk
cfxdevkit_scaffold_add_mcp_config        → add .mcp.json

After scaffolding, set cwd in your MCP client config to the project directory
so the server can detect project context (package.json, deployments/, etc.).
`;

// ── Resource definitions ──────────────────────────────────────────────────

export const docsResources = [
  {
    uri: 'cfxdevkit://docs/overview',
    name: 'Framework Overview',
    description: 'cfxdevkit framework overview, quick start, and workflow patterns.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'cfxdevkit://docs/packages',
    name: 'Package Reference',
    description: 'All @cfxdevkit/* packages with API summaries.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'cfxdevkit://docs/templates',
    name: 'Scaffold Templates',
    description: 'Available project templates and how to use them.',
    mimeType: 'text/markdown',
  },
];

const DOC_MAP: Record<string, string> = {
  'cfxdevkit://docs/overview': OVERVIEW_MD,
  'cfxdevkit://docs/packages': PACKAGES_MD,
  'cfxdevkit://docs/templates': TEMPLATES_MD,
};

// ── Handler ───────────────────────────────────────────────────────────────

function md(uri: string, text: string) {
  return { contents: [{ uri, mimeType: 'text/markdown', text }] };
}

export function readDocsResource(uri: string) {
  const content = DOC_MAP[uri];
  if (content) return md(uri, content);
  return md(uri, `Unknown docs resource: ${uri}`);
}
