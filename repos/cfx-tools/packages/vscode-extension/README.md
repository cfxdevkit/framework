# platform/vscode-extension

**Scope:** VS Code integration for Conflux infrastructure workflows.

**Responsibilities**
- Select local, testnet, or mainnet network targets
- Keep Core Space and eSpace available under each active network, matching the old extension model
- Manage the local dev node lifecycle
- Select a keystore backend (`file`, `onekey`, `satoshi`), select a file keystore, and initialize/unlock or connect it
- Create a file wallet from a generated or imported mnemonic and reuse that seed for the local dev node
- Deploy contracts from built-in templates or workspace Solidity files
- Import deployed contracts from manual input or environment variables and manage ABI read/write calls from the contracts tree
- Show dual-space accounts and deployed contracts in tree views

**Current implementation notes**
- Excludes project/stack commands and DEX workflows on purpose
- Uses the current framework packages directly (`devnode`, `wallet`, `compiler`, `contracts`)
- Persists deploy records under `.cfxdevkit/deployments.json` in the workspace
- Uses `.cfxdevkit/keystore.json` by default, with a command to select another keystore file
- Network selection is exactly `local`, `testnet`, or `mainnet`; deploy/import flows choose eSpace or Core Space as the operation target
- Account rows are tied to the active network and remain visible for local, testnet, and mainnet without requiring the local node to be running
- Hardware wallet backends currently support eSpace signing; use the file backend for Core Space writes
