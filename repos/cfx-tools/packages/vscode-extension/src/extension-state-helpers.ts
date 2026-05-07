// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export function workspaceRoot(this: ExtensionRuntime): string {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error('Open a workspace folder to use the Conflux DevKit extension.');
  return folder.uri.fsPath;
}

export function config(this: ExtensionRuntime): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('cfxdevkit');
}

export function selectedNetwork(this: ExtensionRuntime): NetworkSelection {
  return this.context.workspaceState.get<NetworkSelection>(STATE_NETWORK) ?? 'local';
}

export function selectedSpace(this: ExtensionRuntime): ChainTarget {
  return this.context.workspaceState.get<ChainTarget>(STATE_SPACE) ?? 'espace';
}

export function selectedBackend(this: ExtensionRuntime): KeystoreBackend {
  return 'file';
}

export function selectedFileRef(this: ExtensionRuntime): SecretRef {
  return (
    this.context.workspaceState.get<SecretRef>(STATE_ACTIVE_FILE_REF) ?? {
      service: KEYSTORE_SERVICE,
      account: 'mnemonic-default',
    }
  );
}

export function selectedAccountIndex(this: ExtensionRuntime): number {
  return this.context.workspaceState.get<number>(STATE_ACTIVE_ACCOUNT_INDEX) ?? 0;
}

export function derivationPath(
  this: ExtensionRuntime,
  index = this.selectedAccountIndex(),
): string {
  return `${DERIVATION_BASE}/${index}`;
}

export async function setSelectedNetwork(
  this: ExtensionRuntime,
  network: NetworkSelection,
): Promise<void> {
  this.cachedSigner = null;
  if (network !== 'local' && this.node?.isRunning()) {
    await this.node.stop();
    this.node = null;
    this.log('Node stopped: switched to a non-local network.');
  }
  await this.context.workspaceState.update(STATE_NETWORK, network);
  await this.refreshAll();
}

export async function setSelectedSpace(this: ExtensionRuntime, target: ChainTarget): Promise<void> {
  await this.context.workspaceState.update(STATE_SPACE, target);
}

export async function setSelectedBackend(
  this: ExtensionRuntime,
  backend: KeystoreBackend,
): Promise<void> {
  if (backend !== 'file') return;
  await this.context.workspaceState.update(STATE_KEYSTORE_BACKEND, null);
  await this.refreshAll();
}

export function keystorePath(this: ExtensionRuntime): string {
  const configured = this.config().get<string>('keystorePath', '.cfxdevkit/keystore.json');
  return isAbsolute(configured) ? configured : join(this.workspaceRoot(), configured);
}

export function keystorePathLabel(this: ExtensionRuntime): string {
  const path = this.keystorePath();
  return isInsideWorkspace(path, this.workspaceRoot())
    ? relative(this.workspaceRoot(), path)
    : path;
}

export function deploymentsPath(this: ExtensionRuntime): string {
  return join(
    this.workspaceRoot(),
    this.config().get<string>('deploymentsPath', '.cfxdevkit/deployments.json'),
  );
}

export function nodeDataDir(this: ExtensionRuntime): string {
  return join(this.workspaceRoot(), this.config().get<string>('nodeDataDir', '.cfxdevkit/devnode'));
}

export async function ensureWorkspaceDir(this: ExtensionRuntime): Promise<void> {
  await fs.mkdir(join(this.workspaceRoot(), '.cfxdevkit'), { recursive: true });
}

export function auditLogPath(this: ExtensionRuntime): string {
  return join(this.workspaceRoot(), '.cfxdevkit', 'audit.log');
}

export function log(this: ExtensionRuntime, message: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  this.output.appendLine(`[${ts}] ${message}`);
}

export async function keystoreExists(this: ExtensionRuntime): Promise<boolean> {
  try {
    await fs.access(this.keystorePath());
    return true;
  } catch {
    return false;
  }
}

export function fileKeystore(this: ExtensionRuntime, passphrase: string): KeystoreProvider {
  return createFileKeystore({
    path: this.keystorePath(),
    unlock: async () => ({ passphrase }),
    audit: this.auditLogger,
  });
}

export function refKey(this: ExtensionRuntime, ref: SecretRef): string {
  return `${ref.service}/${ref.account}`;
}

export function walletTarget(
  this: ExtensionRuntime,
  target?: WalletCommandTarget,
): WalletCommandTarget | null {
  if (!target?.walletRef) return null;
  return {
    walletRef: target.walletRef,
    accountIndex: Number.isInteger(target.accountIndex) ? target.accountIndex : 0,
  };
}

export async function promptKeystorePassphrase(
  this: ExtensionRuntime,
  title: string,
): Promise<string | null> {
  return (
    (await vscode.window.showInputBox({
      title,
      prompt: 'Enter your keystore password',
      password: true,
      ignoreFocusOut: true,
    })) ?? null
  );
}

export async function promptNewKeystorePassphrase(this: ExtensionRuntime): Promise<string | null> {
  const passphrase = await vscode.window.showInputBox({
    title: 'Create keystore password',
    prompt: 'Use at least 8 characters',
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => (value.length >= 8 ? null : 'Use at least 8 characters'),
  });
  if (!passphrase) return null;

  const confirm = await vscode.window.showInputBox({
    title: 'Confirm keystore password',
    prompt: 'Repeat the password',
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => (value === passphrase ? null : 'Passwords do not match'),
  });
  return confirm === passphrase ? passphrase : null;
}

export async function listFileWallets(this: ExtensionRuntime): Promise<StoredSecret[]> {
  if (!(await this.keystoreExists())) return [];
  const stored = await this.fileKeystore(this.unlockedPassphrase ?? '').list({
    service: KEYSTORE_SERVICE,
  });
  return stored.filter((secret) => secret.kind === 'mnemonic');
}

export async function ensureFileBackend(this: ExtensionRuntime): Promise<boolean> {
  return true;
}

export async function ensureFileKeystoreUnlocked(
  this: ExtensionRuntime,
): Promise<KeystoreProvider> {
  if (!(await this.keystoreExists())) {
    throw new Error('Create or select a file keystore first.');
  }
  if (this.fileProvider && this.unlockedPassphrase) return this.fileProvider;

  const passphrase = await this.promptKeystorePassphrase('Conflux: Unlock Keystore');
  if (!passphrase) throw new Error('Keystore unlock cancelled.');

  const provider = this.fileKeystore(passphrase);
  const wallets = await provider.list({ service: KEYSTORE_SERVICE });
  if (wallets.length) {
    const selected = this.selectedFileRef();
    const ref = wallets.some((wallet) => this.refKey(wallet.ref) === this.refKey(selected))
      ? selected
      : wallets[0]?.ref;
    if (ref) {
      await provider.getSigner(ref, this.currentCapability(), {
        derivationPath: this.derivationPath(),
      });
    }
  }

  this.unlockedPassphrase = passphrase;
  this.fileProvider = provider;
  return provider;
}

export function currentCapability(this: ExtensionRuntime) {
  const chains = this.currentChains();
  return { chains: [chains.core.id, chains.espace.id] };
}
