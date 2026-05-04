// @ts-nocheck
import { vscode } from './extension-helper-shared.js';

export function registerCommands(this: ExtensionRuntime): void {
  this.context.subscriptions.push(
    vscode.commands.registerCommand('cfxdevkit.selectNetwork', (network?: NetworkSelection) =>
      this.selectNetwork(network),
    ),
    vscode.commands.registerCommand(
      'cfxdevkit.selectKeystoreBackend',
      (backend?: KeystoreBackend) => this.selectKeystoreBackend(backend),
    ),
    vscode.commands.registerCommand('cfxdevkit.selectKeystoreFile', () =>
      this.selectKeystoreFile(),
    ),
    vscode.commands.registerCommand('cfxdevkit.serverStart', () => this.startRuntime()),
    vscode.commands.registerCommand('cfxdevkit.serverStop', () => this.stopNode()),
    vscode.commands.registerCommand('cfxdevkit.initializeSetup', () => this.initializeWallet()),
    vscode.commands.registerCommand('cfxdevkit.addWallet', () => this.addWallet()),
    vscode.commands.registerCommand('cfxdevkit.selectWallet', (target?: WalletCommandTarget) =>
      this.selectWallet(target),
    ),
    vscode.commands.registerCommand('cfxdevkit.removeWallet', (target?: WalletCommandTarget) =>
      this.removeWallet(target),
    ),
    vscode.commands.registerCommand('cfxdevkit.unlockKeystore', (target?: WalletCommandTarget) =>
      this.unlockKeystore(target),
    ),
    vscode.commands.registerCommand('cfxdevkit.lockKeystore', () => this.lockKeystore()),
    vscode.commands.registerCommand('cfxdevkit.rotateKeystorePassphrase', () =>
      this.rotateKeystorePassphrase(),
    ),
    vscode.commands.registerCommand('cfxdevkit.nodeStart', () => this.startNode()),
    vscode.commands.registerCommand('cfxdevkit.nodeStop', () => this.stopNode()),
    vscode.commands.registerCommand('cfxdevkit.nodeRestart', () => this.restartNode()),
    vscode.commands.registerCommand('cfxdevkit.nodeWipe', () => this.wipeNode()),
    vscode.commands.registerCommand('cfxdevkit.nodeWipeRestart', () => this.wipeNodeAndRestart()),
    vscode.commands.registerCommand('cfxdevkit.shutdown', () => this.stopNode()),
    vscode.commands.registerCommand('cfxdevkit.mineBlocks', () => this.mineBlocks()),
    vscode.commands.registerCommand('cfxdevkit.viewAccounts', () => this.showAccountsQuickPick()),
    vscode.commands.registerCommand('cfxdevkit.deployContract', () => this.deployContractCommand()),
    vscode.commands.registerCommand('cfxdevkit.importContract', () => this.importContractCommand()),
    vscode.commands.registerCommand('cfxdevkit.listContracts', () => this.showContractsQuickPick()),
    vscode.commands.registerCommand('cfxdevkit.refreshAccounts', () => this.refreshAll()),
    vscode.commands.registerCommand('cfxdevkit.refreshContracts', () => this.refreshAll()),
    vscode.commands.registerCommand('cfxdevkit.copyAddress', (address?: string) =>
      this.copyAddress(address),
    ),
    vscode.commands.registerCommand('cfxdevkit.copyContractAddress', (address?: string) =>
      this.copyAddress(address),
    ),
    vscode.commands.registerCommand(
      'cfxdevkit.abiCallRead',
      (fn: AbiFunctionTreeRecord, contract: ContractTreeRecord) => this.abiCallRead(fn, contract),
    ),
    vscode.commands.registerCommand(
      'cfxdevkit.abiCallWrite',
      (fn: AbiFunctionTreeRecord, contract: ContractTreeRecord) => this.abiCallWrite(fn, contract),
    ),
  );
}
