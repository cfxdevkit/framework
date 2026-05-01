# `cfxdevkit-vscode-extension` — API Reference

> VS Code extension package. The public surface is the extension entry plus its contributed command set.

## Commands

- `cfxdevkit.selectNetwork`
- `cfxdevkit.selectKeystoreBackend`
- `cfxdevkit.serverStart`
- `cfxdevkit.serverStop`
- `cfxdevkit.initializeSetup`
- `cfxdevkit.unlockKeystore`
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
- Selected keystore backend: VS Code workspace state (`file`, `onekey`, or `satoshi`)
- Local node mnemonic: VS Code workspace state
- Deployments registry: `.cfxdevkit/deployments.json`
- Keystore file: `.cfxdevkit/keystore.json` by default

## Network and space targets

The network selector follows the old extension model and exposes exactly three active networks:

- Local (`Core 2029`, `eSpace 2030`)
- Testnet (`Core 1`, `eSpace 71`)
- Mainnet (`Core 1029`, `eSpace 1030`)

Both Core Space and eSpace are available inside the active network. Contract deployment and import commands ask for the target space, and stored contracts are grouped by network and space in the Contracts view.

## Keystore backends

- `file`: encrypted workspace keystore, supports initialization, unlock, eSpace signing, and Core Space signing.
- `onekey`: OneKey hardware signer through an installed OneKey SDK, eSpace signing.
- `satoshi`: Satoshi/Satochip bridge signer, eSpace signing.