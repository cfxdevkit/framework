# `cfxdevkit-vscode-extension` — API Reference

> VS Code extension package. The public surface is the extension entry plus its contributed command set.

## Commands

- `cfxdevkit.selectNetwork`
- `cfxdevkit.selectKeystoreBackend`
- `cfxdevkit.selectKeystoreFile`
- `cfxdevkit.serverStart`
- `cfxdevkit.serverStop`
- `cfxdevkit.initializeSetup`
- `cfxdevkit.addWallet`
- `cfxdevkit.selectWallet`
- `cfxdevkit.removeWallet`
- `cfxdevkit.unlockKeystore`
- `cfxdevkit.lockKeystore`
- `cfxdevkit.rotateKeystorePassphrase`
- `cfxdevkit.nodeStart`
- `cfxdevkit.nodeStop`
- `cfxdevkit.nodeRestart`
- `cfxdevkit.nodeWipe`
- `cfxdevkit.nodeWipeRestart`
- `cfxdevkit.shutdown`
- `cfxdevkit.mineBlocks`
- `cfxdevkit.viewAccounts`
- `cfxdevkit.deployContract`
- `cfxdevkit.importContract`
- `cfxdevkit.listContracts`
- `cfxdevkit.refreshAccounts`
- `cfxdevkit.refreshContracts`
- `cfxdevkit.copyAddress`
- `cfxdevkit.copyContractAddress`
- `cfxdevkit.abiCallRead`
- `cfxdevkit.abiCallWrite`

## Views

- `cfxdevkit.networkView`
- `cfxdevkit.nodeView`
- `cfxdevkit.accountsView`
- `cfxdevkit.contractsView`

## Persistent workspace state

- Selected network: VS Code workspace state (`local`, `testnet`, or `mainnet`)
- Last used contract target space: VS Code workspace state (`espace` or `core`)
- Selected keystore backend: VS Code workspace state (`file`, `onekey`, or `satoshi`, shown as Satochip)
- Active file-keystore mnemonic root reference: VS Code workspace state (`service/account` path)
- Active derived account index: VS Code workspace state
- Local node mnemonic: VS Code workspace state, set from generated/imported mnemonic-root setup when available
- Deployments registry: `.cfxdevkit/deployments.json`
- Keystore file: `.cfxdevkit/keystore.json` by default

## Network and space targets

The network selector follows the old extension model and exposes exactly three active networks:

- Local (`Core 2029`, `eSpace 2030`)
- Testnet (`Core 1`, `eSpace 71`)
- Mainnet (`Core 1029`, `eSpace 1030`)

Both Core Space and eSpace are available inside the active network. Contract deployment and import commands ask for the target space, and stored contracts are grouped by network and space in the Contracts view.

## Keystore backends

- `file`: encrypted workspace keystore, supports mnemonic-root creation/import, unlock, eSpace signing, and Core Space signing.
- `onekey`: OneKey hardware signer through an installed OneKey SDK, eSpace signing.
- `satoshi`: Satochip bridge signer, eSpace signing.

The Wallets view presents two distinct choices. The Keystore section selects the signing backend (`file`, OneKey, or Satochip) and, only when File is active, the encrypted keystore file. The Wallets section lists file-keystore mnemonic roots; clicking a wallet selects it, inline row actions unlock/lock the active wallet and remove any wallet, and the add-wallet entry sits at the end of the list. The file backend stores each wallet as a `kind: "mnemonic"` root; derived account rows are relative children selected by derivation path. New mnemonic-root setup also stores the mnemonic in workspace state for the local dev node, so local genesis accounts are derived from the same seed. Account rows are derived for the active network and remain visible on local, testnet, and mainnet even when the local node is stopped; balances are filled only when the active network RPCs are reachable.