// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export async function selectNetwork(
  this: ExtensionRuntime,
  network?: NetworkSelection,
): Promise<void> {
  if (network) {
    await this.setSelectedNetwork(network);
    return;
  }

  const pick = await vscode.window.showQuickPick(
    NETWORKS.map((option) => ({
      label: option.label,
      description: option.description,
      detail: `Core Space chainId ${option.coreChainId}; eSpace chainId ${option.espaceChainId}`,
      option,
      picked: option.network === this.selectedNetwork(),
    })),
    {
      title: 'Conflux: Select Network',
      placeHolder: 'Choose the active Conflux network',
    },
  );
  if (!pick) return;
  await this.setSelectedNetwork(pick.option.network);
}

export async function selectKeystoreBackend(
  this: ExtensionRuntime,
  backend?: KeystoreBackend,
): Promise<void> {
  if (backend) {
    await this.setSelectedBackend(backend);
    return;
  }

  const pick = await vscode.window.showQuickPick(
    [
      { label: 'File', description: 'Encrypted workspace keystore', backend: 'file' as const },
      {
        label: 'OneKey',
        description: 'OneKey hardware wallet through the OneKey SDK',
        backend: 'onekey' as const,
      },
      {
        label: 'Satochip',
        description: 'Satochip-compatible local bridge',
        backend: 'satoshi' as const,
      },
    ].map((item) => ({ ...item, picked: item.backend === this.selectedBackend() })),
    { title: 'Conflux: Select Keystore Backend', placeHolder: 'Choose the signing backend' },
  );
  if (!pick) return;
  await this.setSelectedBackend(pick.backend);
}

export async function selectKeystoreFile(this: ExtensionRuntime): Promise<void> {
  if (this.selectedBackend() !== 'file') {
    const action = await vscode.window.showWarningMessage(
      'Keystore file selection is available for the file backend.',
      'Switch to File',
    );
    if (action !== 'Switch to File') return;
    await this.setSelectedBackend('file');
  }

  const picked = await vscode.window.showOpenDialog({
    title: 'Conflux: Select Keystore File',
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: { 'JSON keystore': ['json'], 'All files': ['*'] },
    defaultUri: vscode.Uri.file(this.keystorePath()),
  });
  const file = picked?.[0];
  if (!file) return;

  const path = file.fsPath;
  const value = isInsideWorkspace(path, this.workspaceRoot())
    ? relative(this.workspaceRoot(), path)
    : path;
  await this.config().update('keystorePath', value, vscode.ConfigurationTarget.Workspace);
  this.unlockedPassphrase = null;
  this.cachedSigner = null;
  await this.refreshAll();
}
