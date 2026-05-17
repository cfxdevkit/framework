# platform/vscode-extension

**Scope:** VS Code integration for Conflux infrastructure workflows.

**Responsibilities**
- Select local, testnet, or mainnet network targets
- Keep Core Space and eSpace available under each active network, matching the old extension model
- Manage the local dev node lifecycle
- Choose the keystore type first: file, OneKey, or Satochip
- Manage wallet roots separately from the keystore type: click a wallet root to select it, use inline row icons to unlock/lock or remove it, and add wallet roots from the end of the wallet list
- Select derived accounts under the active wallet root for signing
- Reuse mnemonic-root setup for the local dev node seed
- Deploy contracts from built-in templates or workspace Solidity files
- Import deployed contracts from manual input or environment variables and manage ABI read/write calls from the contracts tree
- Show dual-space accounts and deployed contracts in tree views

**Current implementation notes**
- Excludes project/stack commands and DEX workflows on purpose
- Uses `@cfxdevkit/client` for shared control-plane operations while `@cfxdevkit/devnode-server` owns local runtime state
- Persists deploy records under `.cfxdevkit/deployments.json` in the workspace
- Treats `@cfxdevkit/devnode-server` as the canonical backend contract for
	local, testnet, and mainnet operations; the extension follows the same
	wallet-scoped network profile, deploy, and tracked-contract semantics as
	showcase-local and MCP
- The Wallets view is split into Keystore, Wallets, and Accounts sections so backend choice and wallet choice are distinct; wallet rows use VS Code inline item actions instead of separate action rows
- The Wallets view follows the shared backend terminology: keystore, wallet roots, then derived accounts
- Uses `.cfxdevkit/keystore.json` by default, with commands to select another keystore file and maintain wallets
- Network selection is exactly `local`, `testnet`, or `mainnet`; deploy/import flows choose eSpace or Core Space as the operation target
- Account rows are tied to the active network and remain visible for local, testnet, and mainnet without requiring the local node to be running
- Hardware wallet backends currently support eSpace signing; use the file backend for Core Space writes
- Local and remote writes resolve through the active mnemonic root and derived account instead of bypassing the keystore with a devnode-only account

## Shared backend contract

The extension should assume the backend, not the UI, owns network mode and
tracked contract state.

- Network profile is wallet-scoped. Switching wallets changes the effective
	backend profile, including public RPC overrides and chain ID overrides.
- `local` mode enables faucet and mining operations; `testnet` and `mainnet`
	are `public` mode and reuse the configured RPC endpoints for deploy and
	contract calls.
- Public writes follow the shared signer precedence: environment override,
	request-provided private key, then the active keystore account.
- Tracked contracts persist per wallet and can be called through the generic
	ABI routes or the tracked `POST /contracts/:id/call` flow.

## Reset and recovery

The extension should use the same destructive reset model as showcase-local and
MCP when it is attached to the shared backend contract.

- Reset is operator-only. Do not add a passwordless HTTP or command-palette reset
	that bypasses backend safeguards.
- Stop the local node or backend first, then remove the configured keystore file
	and its sibling `.runtime` directory to return to the blank keystore state.
- Use the backend status response after restart to confirm the blank, locked,
	unlocked, or active-wallet phase instead of inferring state locally.
