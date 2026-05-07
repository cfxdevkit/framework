// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export async function startRuntime(this: ExtensionRuntime): Promise<void> {
  await vscode.window
    .showInformationMessage(
      'Conflux DevKit runtime is built into this extension. Start the local node when you need local RPCs.',
      'Start Node',
    )
    .then((action) => {
      if (action === 'Start Node') void this.startNode();
    });
  await this.refreshAll();
}

export async function getOrCreateNodeMnemonic(this: ExtensionRuntime): Promise<string> {
  if (this.localNodeMnemonic && validateMnemonic(this.localNodeMnemonic)) {
    return this.localNodeMnemonic;
  }
  await this.ensureUnlockedWallet().catch(() => null);
  if (this.localNodeMnemonic && validateMnemonic(this.localNodeMnemonic)) {
    return this.localNodeMnemonic;
  }
  const action = await vscode.window.showWarningMessage(
    'Start the local node from a mnemonic wallet stored in the encrypted keystore. Add or import a wallet first.',
    'Add Wallet',
  );
  if (action !== 'Add Wallet') throw new Error('Local node start cancelled.');
  await this.addWallet();
  if (!this.localNodeMnemonic || !validateMnemonic(this.localNodeMnemonic)) {
    throw new Error('Local node requires a mnemonic-backed active wallet.');
  }
  return this.localNodeMnemonic;
}

export async function startNode(this: ExtensionRuntime): Promise<void> {
  if (this.node?.isRunning()) {
    await vscode.window.showInformationMessage('The local Conflux node is already running.');
    return;
  }
  const mnemonic = await this.getOrCreateNodeMnemonic();
  await this.ensureUnlockedWallet();
  await fs.mkdir(this.nodeDataDir(), { recursive: true });
  const node = createDevNode({
    mnemonic,
    dataDir: this.nodeDataDir(),
    accounts: this.config().get<number>('nodeAccounts', 10),
    logging: this.config().get<boolean>('nodeLogging', false),
  });
  this.log('Starting local dev node…');
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Starting Conflux local node…',
    },
    () => node.start(),
  );
  this.node = node;
  this.log(`Node started. Core RPC: ${node.urls.core} eSpace RPC: ${node.urls.espace}`);
  await vscode.window.showInformationMessage(
    `Conflux local node running. eSpace: ${node.urls.espace}`,
  );
  await this.refreshAll();
}

export async function stopNode(this: ExtensionRuntime): Promise<void> {
  if (!this.node) {
    await vscode.window.showInformationMessage('The local node is not running.');
    return;
  }
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Stopping Conflux local node…' },
    () => this.node?.stop(),
  );
  this.node = null;
  this.log('Node stopped.');
  await this.refreshAll();
}

export async function restartNode(this: ExtensionRuntime): Promise<void> {
  if (!this.node) {
    await this.startNode();
    return;
  }
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Restarting Conflux local node…' },
    () => this.node?.restart(),
  );
  this.log('Node restarted.');
  await this.refreshAll();
}

export async function wipeNode(this: ExtensionRuntime): Promise<void> {
  if (this.node) {
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Stopping Conflux local node…' },
      () => this.node?.stop(),
    );
    this.node = null;
  }
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Wiping Conflux node data…' },
    () => fs.rm(this.nodeDataDir(), { recursive: true, force: true }),
  );
  this.log('Node data wiped.');
  await this.refreshAll();
}

export async function wipeNodeAndRestart(this: ExtensionRuntime): Promise<void> {
  await this.wipeNode();
  await this.startNode();
}

export async function mineBlocks(this: ExtensionRuntime): Promise<void> {
  if (!this.node?.isRunning()) {
    throw new Error('The local node must be running to mine blocks.');
  }
  const raw = await vscode.window.showInputBox({
    title: 'Conflux: Mine Blocks',
    prompt: 'Enter the number of empty blocks to mine',
    value: '1',
    validateInput: (value) =>
      /^\d+$/.test(value) && Number(value) > 0 ? null : 'Enter a positive integer',
  });
  if (!raw) return;
  const count = Number(raw);
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Mining ${count} block(s)…` },
    () => this.node?.mine(count),
  );
  this.log(`Mined ${raw} block(s).`);
  await vscode.window.showInformationMessage(`Mined ${count} block(s).`);
}
