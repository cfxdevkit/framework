# `@cfxdevkit/vscode-extension` — API Reference

> VS Code extension package. The public surface is the extension entry plus its contributed command set.

## Commands

- `cfxdevkit.selectNetwork`
- `cfxdevkit.initializeSetup`
- `cfxdevkit.unlockKeystore`
- `cfxdevkit.nodeStart`
- `cfxdevkit.nodeStop`
- `cfxdevkit.nodeRestart`
- `cfxdevkit.nodeWipe`
- `cfxdevkit.nodeWipeRestart`
- `cfxdevkit.mineBlocks`
- `cfxdevkit.viewAccounts`
- `cfxdevkit.deployContract`
- `cfxdevkit.listContracts`
- `cfxdevkit.refreshAccounts`
- `cfxdevkit.refreshContracts`
- `cfxdevkit.copyAddress`
- `cfxdevkit.copyContractAddress`

## Views

- `cfxdevkit.networkView`
- `cfxdevkit.nodeView`
- `cfxdevkit.accountsView`
- `cfxdevkit.contractsView`

## Persistent workspace state

- Selected network: VS Code workspace state
- Local node mnemonic: VS Code workspace state
- Deployments registry: `.cfxdevkit/deployments.json`
- Keystore file: `.cfxdevkit/keystore.json` by default