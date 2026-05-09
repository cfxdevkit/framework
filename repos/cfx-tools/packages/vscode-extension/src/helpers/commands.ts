// @ts-nocheck
import { vscode } from './shared.js';

/** Commands that are currently running. Re-entrant calls are silently dropped. */
const inFlight = new Set<string>();

function guard(id: string, fn: () => Promise<void> | void): void {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  let result: Promise<void> | void;
  try {
    result = fn();
  } catch (err: unknown) {
    inFlight.delete(id);
    void vscode.window.showErrorMessage(
      `Conflux: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }
  if (result instanceof Promise) {
    result
      .catch((err: unknown) => {
        void vscode.window.showErrorMessage(
          `Conflux: ${err instanceof Error ? err.message : String(err)}`,
        );
      })
      .finally(() => inFlight.delete(id));
  } else {
    inFlight.delete(id);
  }
}

export function registerCommands(this: ExtensionRuntime): void {
  this.context.subscriptions.push(
    vscode.commands.registerCommand('cfxdevkit.selectNetwork', (network?: NetworkSelection) =>
      guard('selectNetwork', () => this.selectNetwork(network)),
    ),
    vscode.commands.registerCommand('cfxdevkit.initializeSetup', () =>
      guard('initializeSetup', () => this.initializeWallet()),
    ),
    vscode.commands.registerCommand('cfxdevkit.addWallet', () =>
      guard('addWallet', () => this.addWallet()),
    ),
    vscode.commands.registerCommand('cfxdevkit.selectAccount', (item?: AccountTreeItem) =>
      guard('selectWallet', () => this.selectWallet(item)),
    ),
    vscode.commands.registerCommand('cfxdevkit.selectWallet', (target?: WalletCommandTarget) =>
      guard('selectWallet', () => this.selectWallet(target)),
    ),
    vscode.commands.registerCommand('cfxdevkit.removeWallet', (target?: WalletCommandTarget) =>
      guard('removeWallet', () => this.removeWallet(target)),
    ),
    vscode.commands.registerCommand('cfxdevkit.unlockKeystore', (target?: WalletCommandTarget) =>
      guard('unlockKeystore', () => this.unlockKeystore(target)),
    ),
    vscode.commands.registerCommand('cfxdevkit.lockKeystore', () =>
      guard('lockKeystore', () => this.lockKeystore()),
    ),
    vscode.commands.registerCommand('cfxdevkit.rotateKeystorePassphrase', () =>
      guard('rotateKeystorePassphrase', () => this.rotateKeystorePassphrase()),
    ),
    vscode.commands.registerCommand('cfxdevkit.nodeStart', () =>
      guard('nodeStart', () => this.startNode()),
    ),
    vscode.commands.registerCommand('cfxdevkit.nodeStop', () =>
      guard('nodeStop', () => this.stopNode()),
    ),
    vscode.commands.registerCommand('cfxdevkit.nodeRestart', () =>
      guard('nodeRestart', () => this.restartNode()),
    ),
    vscode.commands.registerCommand('cfxdevkit.nodeWipe', () =>
      guard('nodeWipe', () => this.wipeNode()),
    ),
    vscode.commands.registerCommand('cfxdevkit.nodeWipeRestart', () =>
      guard('nodeWipeRestart', () => this.wipeNodeAndRestart()),
    ),
    vscode.commands.registerCommand('cfxdevkit.mineBlocks', () =>
      guard('mineBlocks', () => this.mineBlocks()),
    ),
    vscode.commands.registerCommand('cfxdevkit.mining.start', () =>
      guard('mining.start', () => this.startMining()),
    ),
    vscode.commands.registerCommand('cfxdevkit.mining.stop', () =>
      guard('mining.stop', () => this.stopMining()),
    ),
    vscode.commands.registerCommand('cfxdevkit.viewAccounts', () =>
      guard('viewAccounts', () => this.showAccountsQuickPick()),
    ),
    vscode.commands.registerCommand('cfxdevkit.deployContract', () =>
      guard('deployContract', () => this.deployContractCommand()),
    ),
    vscode.commands.registerCommand('cfxdevkit.importContract', () =>
      guard('importContract', () => this.importContractCommand()),
    ),
    vscode.commands.registerCommand('cfxdevkit.listContracts', () =>
      guard('listContracts', () => this.showContractsQuickPick()),
    ),
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
