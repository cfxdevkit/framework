# platform/vscode-extension

**Scope:** VS Code integration for Conflux infrastructure workflows.

**Responsibilities**
- Select local, testnet, or mainnet network targets
- Manage the local dev node lifecycle
- Initialize and unlock a workspace-local keystore wallet
- Deploy contracts from built-in templates or workspace Solidity files
- Show accounts and deployed contracts in tree views

**Current implementation notes**
- Excludes project/stack commands and DEX workflows on purpose
- Uses the current framework packages directly (`devnode`, `wallet`, `compiler`, `contracts`)
- Persists deploy records under `.cfxdevkit/deployments.json` in the workspace
