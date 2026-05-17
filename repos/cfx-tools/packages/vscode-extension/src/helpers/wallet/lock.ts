// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from '../shared.js';

export async function lockKeystore(this: ExtensionRuntime): Promise<void> {
  this.unlockedPassphrase = null;
  this.fileProvider = null;
  this.cachedSigner = null;
  this.localNodeMnemonic = null;
  await this.refreshAll();
  void vscode.window.showInformationMessage('Keystore locked.');
}

export async function rotateKeystorePassphrase(this: ExtensionRuntime): Promise<void> {
  if (!(await this.keystoreExists())) {
    await vscode.window.showInformationMessage('Create a wallet first.');
    return;
  }
  const oldPassphrase = await this.promptKeystorePassphrase('Conflux: Current Keystore Password');
  if (!oldPassphrase) return;
  const newPassphrase = await this.promptNewKeystorePassphrase();
  if (!newPassphrase) return;
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Changing keystore password…' },
    () =>
      rotateLocalPassphrase({
        oldPassphrase,
        newPassphrase,
        path: this.keystorePath(),
      }),
  );
  this.unlockedPassphrase = newPassphrase;
  this.fileProvider = this.fileKeystore(newPassphrase);
  this.cachedSigner = null;
  await this.refreshAll();
  void vscode.window.showInformationMessage('Keystore password changed.');
}

export function sanitizeAccountName(this: ExtensionRuntime, label: string): string {
  const clean = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'mnemonic-default';
}

export async function unlockKeystore(
  this: ExtensionRuntime,
  target?: WalletCommandTarget,
): Promise<void> {
  const selectedTarget = this.walletTarget(target);
  if (selectedTarget?.walletRef) {
    await this.context.workspaceState.update(STATE_ACTIVE_FILE_REF, selectedTarget.walletRef);
    await this.context.workspaceState.update(
      STATE_ACTIVE_ACCOUNT_INDEX,
      selectedTarget.accountIndex ?? 0,
    );
  }
  const signer = (await this.ensureUnlockedWallet()).signer;
  void vscode.window.showInformationMessage(`Wallet ready for ${signer.account.address}`);
  await this.refreshAll();
}
