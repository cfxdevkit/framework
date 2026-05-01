# platform/vscode-extension

**Scope:** VS Code integration for Conflux infrastructure workflows.

**Responsibilities**
- Select local, testnet, or mainnet network targets
- Keep Core Space and eSpace available under each active network, matching the old extension model
- Manage the local dev node lifecycle
- Select a keystore backend (`file`, `onekey`, `satoshi`) and initialize/unlock or connect it
- Deploy contracts from built-in templates or workspace Solidity files
- Import deployed contracts from manual input or environment variables and manage ABI read/write calls from the contracts tree
- Show dual-space accounts and deployed contracts in tree views

**Current implementation notes**
- Excludes project/stack commands and DEX workflows on purpose
- Uses the current framework packages directly (`devnode`, `wallet`, `compiler`, `contracts`)
- Persists deploy records under `.cfxdevkit/deployments.json` in the workspace
- Network selection is exactly `local`, `testnet`, or `mainnet`; deploy/import flows choose eSpace or Core Space as the operation target
- Hardware wallet backends currently support eSpace signing; use the file backend for Core Space writes
