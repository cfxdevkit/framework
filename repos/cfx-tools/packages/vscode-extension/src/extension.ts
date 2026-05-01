import { promises as fs } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { type Artifact, compile, listTemplates, npmResolver } from '@cfxdevkit/compiler';
import { deployContract } from '@cfxdevkit/contracts/deploy';
import { readContract } from '@cfxdevkit/contracts/read';
import { sendWrite } from '@cfxdevkit/contracts/write';
import { hexToBase32 } from '@cfxdevkit/core/address';
import {
  type ChainConfig,
  coreSpaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  espaceLocal,
  espaceMainnet,
  espaceTestnet,
} from '@cfxdevkit/core/chains';
import {
  type CoreSpaceClient,
  createClient,
  type EspaceClient,
  http,
} from '@cfxdevkit/core/client';
import { formatCFX } from '@cfxdevkit/core/units';
import {
  coreAddressFromPrivateKey,
  deriveAccount,
  generateMnemonic,
  type Signer,
  signerFromPrivateKey,
  validateMnemonic,
} from '@cfxdevkit/core/wallet';
import { createDevNode, type DevNode } from '@cfxdevkit/devnode';
import { type OneKeySdkLike, signerFromOneKey } from '@cfxdevkit/wallet/hardware/onekey';
import { signerFromSatochip } from '@cfxdevkit/wallet/hardware/satochip';
import {
  initLocalWallet,
  type OpenLocalWalletResult,
  openLocalWallet,
} from '@cfxdevkit/wallet/init';
import * as vscode from 'vscode';
import {
  type AbiFunctionTreeRecord,
  type AccountTreeRecord,
  type ContractTreeRecord,
  makeAccountItems,
  makeContractItems,
  makeNetworkItems,
  makeNodeItems,
  StaticTreeProvider,
  type ViewSnapshot,
} from './views.js';

type NetworkSelection = 'local' | 'testnet' | 'mainnet';
type ChainTarget = 'espace' | 'core';
type KeystoreBackend = 'file' | 'onekey' | 'satoshi';

interface NetworkOption {
  network: NetworkSelection;
  label: string;
  description: string;
  coreChainId: number;
  espaceChainId: number;
}

interface DeploymentRecord {
  id: string;
  name: string;
  address: string;
  target: ChainTarget;
  network: NetworkSelection;
  chainId: number;
  txHash: string;
  deployedAt: string;
  abi?: unknown[];
}

const STATE_NETWORK = 'cfxdevkit.selectedNetwork';
const STATE_SPACE = 'cfxdevkit.selectedSpace';
const STATE_KEYSTORE_BACKEND = 'cfxdevkit.selectedKeystoreBackend';
const STATE_NODE_MNEMONIC = 'cfxdevkit.localNodeMnemonic';

const NETWORKS: readonly NetworkOption[] = [
  {
    network: 'local',
    label: 'Local (dev)',
    description: 'Core 2029 / eSpace 2030',
    coreChainId: 2029,
    espaceChainId: 2030,
  },
  {
    network: 'testnet',
    label: 'Testnet',
    description: 'Core 1 / eSpace 71',
    coreChainId: 1,
    espaceChainId: 71,
  },
  {
    network: 'mainnet',
    label: 'Mainnet',
    description: 'Core 1029 / eSpace 1030',
    coreChainId: 1029,
    espaceChainId: 1030,
  },
];

const BACKEND_LABELS: Record<KeystoreBackend, string> = {
  file: 'File',
  onekey: 'OneKey',
  satoshi: 'Satoshi / Satochip',
};

interface CachedSigner {
  backend: KeystoreBackend;
  signer: Signer;
}

class ExtensionRuntime implements vscode.Disposable {
  private node: DevNode | null = null;
  private unlockedPassphrase: string | null = null;
  private cachedSigner: CachedSigner | null = null;
  private readonly output = vscode.window.createOutputChannel('Conflux DevKit');
  private readonly networkStatus = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  private readonly nodeStatus = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    99,
  );
  private readonly networkProvider = new StaticTreeProvider<vscode.TreeItem>();
  private readonly nodeProvider = new StaticTreeProvider<vscode.TreeItem>();
  private readonly accountsProvider = new StaticTreeProvider<vscode.TreeItem>();
  private readonly contractsProvider = new StaticTreeProvider<vscode.TreeItem>();
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.networkStatus.command = 'cfxdevkit.selectNetwork';
    this.nodeStatus.command = 'cfxdevkit.nodeStart';
    this.disposables.push(
      this.output,
      this.networkStatus,
      this.nodeStatus,
      vscode.window.createTreeView('cfxdevkit.networkView', {
        treeDataProvider: this.networkProvider,
        showCollapseAll: false,
      }),
      vscode.window.createTreeView('cfxdevkit.nodeView', {
        treeDataProvider: this.nodeProvider,
        showCollapseAll: false,
      }),
      vscode.window.createTreeView('cfxdevkit.accountsView', {
        treeDataProvider: this.accountsProvider,
        showCollapseAll: false,
      }),
      vscode.window.createTreeView('cfxdevkit.contractsView', {
        treeDataProvider: this.contractsProvider,
        showCollapseAll: false,
      }),
    );
  }

  dispose(): void {
    for (const disposable of this.disposables) disposable.dispose();
    if (this.node) {
      void this.node.stop();
      this.node = null;
    }
  }

  async activate(): Promise<void> {
    this.registerCommands();
    this.networkStatus.show();
    this.nodeStatus.show();
    await this.refreshAll();
    if (this.selectedNetwork() === 'local' && this.config().get<boolean>('autoStartNode', false)) {
      await this.startNode().catch((error) => {
        this.log(
          `Auto-start node failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }
  }

  private registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('cfxdevkit.selectNetwork', (network?: NetworkSelection) =>
        this.selectNetwork(network),
      ),
      vscode.commands.registerCommand('cfxdevkit.selectKeystoreBackend', () =>
        this.selectKeystoreBackend(),
      ),
      vscode.commands.registerCommand('cfxdevkit.selectKeystoreFile', () =>
        this.selectKeystoreFile(),
      ),
      vscode.commands.registerCommand('cfxdevkit.serverStart', () => this.startRuntime()),
      vscode.commands.registerCommand('cfxdevkit.serverStop', () => this.stopNode()),
      vscode.commands.registerCommand('cfxdevkit.initializeSetup', () => this.initializeWallet()),
      vscode.commands.registerCommand('cfxdevkit.unlockKeystore', () => this.unlockKeystore()),
      vscode.commands.registerCommand('cfxdevkit.nodeStart', () => this.startNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeStop', () => this.stopNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeRestart', () => this.restartNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeWipe', () => this.wipeNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeWipeRestart', () => this.wipeNodeAndRestart()),
      vscode.commands.registerCommand('cfxdevkit.shutdown', () => this.stopNode()),
      vscode.commands.registerCommand('cfxdevkit.mineBlocks', () => this.mineBlocks()),
      vscode.commands.registerCommand('cfxdevkit.viewAccounts', () => this.showAccountsQuickPick()),
      vscode.commands.registerCommand('cfxdevkit.deployContract', () =>
        this.deployContractCommand(),
      ),
      vscode.commands.registerCommand('cfxdevkit.importContract', () =>
        this.importContractCommand(),
      ),
      vscode.commands.registerCommand('cfxdevkit.listContracts', () =>
        this.showContractsQuickPick(),
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
        (fn: AbiFunctionTreeRecord, contract: ContractTreeRecord) =>
          this.abiCallWrite(fn, contract),
      ),
    );
  }

  private workspaceRoot(): string {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) throw new Error('Open a workspace folder to use the Conflux DevKit extension.');
    return folder.uri.fsPath;
  }

  private config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('cfxdevkit');
  }

  private selectedNetwork(): NetworkSelection {
    return this.context.workspaceState.get<NetworkSelection>(STATE_NETWORK) ?? 'local';
  }

  private selectedSpace(): ChainTarget {
    return this.context.workspaceState.get<ChainTarget>(STATE_SPACE) ?? 'espace';
  }

  private selectedBackend(): KeystoreBackend {
    return this.context.workspaceState.get<KeystoreBackend>(STATE_KEYSTORE_BACKEND) ?? 'file';
  }

  private async setSelectedNetwork(network: NetworkSelection): Promise<void> {
    await this.context.workspaceState.update(STATE_NETWORK, network);
    await this.refreshAll();
  }

  private async setSelectedSpace(target: ChainTarget): Promise<void> {
    await this.context.workspaceState.update(STATE_SPACE, target);
  }

  private async setSelectedBackend(backend: KeystoreBackend): Promise<void> {
    if (backend !== this.selectedBackend()) {
      this.unlockedPassphrase = null;
      this.cachedSigner = null;
    }
    await this.context.workspaceState.update(STATE_KEYSTORE_BACKEND, backend);
    await this.refreshAll();
  }

  private keystorePath(): string {
    const configured = this.config().get<string>('keystorePath', '.cfxdevkit/keystore.json');
    return isAbsolute(configured) ? configured : join(this.workspaceRoot(), configured);
  }

  private keystorePathLabel(): string {
    const path = this.keystorePath();
    return isInsideWorkspace(path, this.workspaceRoot())
      ? relative(this.workspaceRoot(), path)
      : path;
  }

  private deploymentsPath(): string {
    return join(
      this.workspaceRoot(),
      this.config().get<string>('deploymentsPath', '.cfxdevkit/deployments.json'),
    );
  }

  private nodeDataDir(): string {
    return join(
      this.workspaceRoot(),
      this.config().get<string>('nodeDataDir', '.cfxdevkit/devnode'),
    );
  }

  private async ensureWorkspaceDir(): Promise<void> {
    await fs.mkdir(join(this.workspaceRoot(), '.cfxdevkit'), { recursive: true });
  }

  private log(message: string): void {
    const ts = new Date().toISOString().slice(11, 19);
    this.output.appendLine(`[${ts}] ${message}`);
  }

  private async keystoreExists(): Promise<boolean> {
    try {
      await fs.access(this.keystorePath());
      return true;
    } catch {
      return false;
    }
  }

  private async readDeployments(): Promise<DeploymentRecord[]> {
    try {
      const text = await fs.readFile(this.deploymentsPath(), 'utf8');
      const data = JSON.parse(text) as DeploymentRecord[];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  private async writeDeployments(records: DeploymentRecord[]): Promise<void> {
    await this.ensureWorkspaceDir();
    await fs.writeFile(this.deploymentsPath(), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  }

  private chainsFor(network: NetworkSelection): { espace: ChainConfig; core: ChainConfig } {
    switch (network) {
      case 'mainnet':
        return { espace: espaceMainnet, core: coreSpaceMainnet };
      case 'testnet':
        return { espace: espaceTestnet, core: coreSpaceTestnet };
      default:
        return { espace: espaceLocal, core: coreSpaceLocal };
    }
  }

  private currentChains(): { espace: ChainConfig; core: ChainConfig } {
    return this.chainsFor(this.selectedNetwork());
  }

  private currentChain(target: ChainTarget = this.selectedSpace()): ChainConfig {
    const chains = this.currentChains();
    return target === 'core' ? chains.core : chains.espace;
  }

  private selectedNetworkLabel(): string {
    return NETWORKS.find((option) => option.network === this.selectedNetwork())?.label ?? 'Local';
  }

  private async pickChainTarget(title: string): Promise<ChainTarget | null> {
    const chains = this.currentChains();
    const pick = await vscode.window.showQuickPick(
      [
        {
          label: 'eSpace',
          description: `chainId ${chains.espace.id}`,
          detail: 'EVM-compatible 0x addresses',
          target: 'espace' as const,
          picked: this.selectedSpace() === 'espace',
        },
        {
          label: 'Core Space',
          description: `chainId ${chains.core.id}`,
          detail: 'Conflux-native base32 addresses',
          target: 'core' as const,
          picked: this.selectedSpace() === 'core',
        },
      ],
      { title, placeHolder: 'Select the target chain' },
    );
    if (!pick) return null;
    await this.setSelectedSpace(pick.target);
    return pick.target;
  }

  private async createClientFor(target: ChainTarget = this.selectedSpace()) {
    const chains = this.currentChains();
    if (this.selectedNetwork() === 'local') {
      if (!this.node?.isRunning())
        throw new Error('Start the local node before using the local network.');
      const url = target === 'core' ? this.node.urls.core : this.node.urls.espace;
      return createClient({
        chain: target === 'core' ? chains.core : chains.espace,
        transport: http({ url }),
      });
    }

    const chain = target === 'core' ? chains.core : chains.espace;
    return createClient({
      chain,
      transport: http({ url: chain.rpc.http[0] }),
    });
  }

  private withCoreAddress(signer: Signer, networkId: number): Signer {
    return {
      ...signer,
      account: {
        ...signer.account,
        coreAddress: hexToBase32(signer.account.address as `0x${string}`, networkId),
      },
    };
  }

  private deriveMnemonicAccounts(mnemonic: string): AccountTreeRecord[] {
    const count = this.config().get<number>('nodeAccounts', 10);
    const coreNetworkId = this.currentChains().core.id;
    const accounts: AccountTreeRecord[] = [];
    for (let index = 0; index < count; index++) {
      const { account, privateKey } = deriveAccount({
        mnemonic,
        path: `m/44'/60'/0'/0/${index}`,
      });
      const coreAddress = coreAddressFromPrivateKey(privateKey, coreNetworkId);
      accounts.push({
        label: `Wallet #${index}`,
        description: account.address,
        espaceAddress: account.address,
        coreAddress,
        detail: `${this.selectedNetworkLabel()}\neSpace: ${account.address}\nCore: ${coreAddress}`,
        state: 'ready',
      });
    }
    return accounts;
  }

  private deriveRunningNodeAccounts(): AccountTreeRecord[] {
    const coreNetworkId = this.currentChains().core.id;
    return (this.node?.accounts ?? []).map((account) => {
      const coreAddress = coreAddressFromPrivateKey(
        account.privateKey as `0x${string}`,
        coreNetworkId,
      );
      return {
        label: `Local #${account.index}`,
        description: account.evmAddress,
        espaceAddress: account.evmAddress,
        coreAddress,
        detail: `${this.selectedNetworkLabel()}\neSpace: ${account.evmAddress}\nCore: ${coreAddress}`,
        state: 'ready' as const,
      };
    });
  }

  private async walletSignerFor(target: ChainTarget): Promise<Signer> {
    const backend = this.selectedBackend();
    const signer =
      backend === 'file'
        ? (await this.ensureUnlockedWallet()).signer
        : await this.ensureHardwareSigner();
    if (target === 'core' && backend !== 'file') {
      throw new Error(
        'Hardware keystore backends currently support eSpace signing only. Select the file backend for Core Space writes.',
      );
    }
    if (target === 'core') {
      return this.withCoreAddress(signer, this.currentChains().core.id);
    }
    return signer;
  }

  private async ensureUnlockedWallet(): Promise<OpenLocalWalletResult> {
    if (!(await this.keystoreExists())) {
      throw new Error('Initialize the keystore wallet first.');
    }

    if (!this.unlockedPassphrase) {
      const password = await vscode.window.showInputBox({
        title: 'Conflux: Unlock Keystore',
        prompt: 'Enter your keystore password',
        password: true,
        ignoreFocusOut: true,
      });
      if (!password) throw new Error('Keystore unlock cancelled.');
      this.unlockedPassphrase = password;
    }

    try {
      return await openLocalWallet({
        passphrase: this.unlockedPassphrase,
        path: this.keystorePath(),
      });
    } catch (error) {
      this.unlockedPassphrase = null;
      throw error;
    }
  }

  private async ensureHardwareSigner(): Promise<Signer> {
    const backend = this.selectedBackend();
    if (this.cachedSigner?.backend === backend) return this.cachedSigner.signer;
    const signer =
      backend === 'onekey' ? await this.connectOneKeySigner() : await this.connectSatoshiSigner();
    this.cachedSigner = { backend, signer };
    return signer;
  }

  private async connectOneKeySigner(): Promise<Signer> {
    const connectId = await vscode.window.showInputBox({
      title: 'OneKey connect id',
      prompt: 'Device connect id returned by the OneKey SDK',
      ignoreFocusOut: true,
    });
    if (!connectId) throw new Error('OneKey connection cancelled.');
    const deviceId = await vscode.window.showInputBox({
      title: 'OneKey device id',
      prompt: 'Device id returned by the OneKey SDK',
      ignoreFocusOut: true,
    });
    if (!deviceId) throw new Error('OneKey connection cancelled.');
    const path = await vscode.window.showInputBox({
      title: 'OneKey derivation path',
      value: "m/44'/60'/0'/0/0",
      ignoreFocusOut: true,
    });
    const sdkModule = await dynamicImport('@onekeyfe/hd-common-sdk').catch((cause) => {
      throw new Error(
        `OneKey SDK is not installed in the extension host (${cause instanceof Error ? cause.message : String(cause)}).`,
      );
    });
    const sdk = (sdkModule.default ?? sdkModule) as OneKeySdkLike & {
      init?: (input: { debug: boolean }) => Promise<void>;
    };
    await sdk.init?.({ debug: false });
    return signerFromOneKey({
      sdk,
      connectId,
      deviceId,
      chainId: this.currentChain('espace').id,
      ...(path ? { path } : {}),
    });
  }

  private async connectSatoshiSigner(): Promise<Signer> {
    const bridgeUrl = await vscode.window.showInputBox({
      title: 'Satoshi/Satochip bridge URL',
      value: this.config().get<string>('satoshiBridgeUrl', 'http://127.0.0.1:8397'),
      ignoreFocusOut: true,
    });
    if (!bridgeUrl) throw new Error('Satoshi connection cancelled.');
    const pin = await vscode.window.showInputBox({
      title: 'Satoshi/Satochip PIN',
      prompt: 'Leave empty if the card is already unlocked',
      password: true,
      ignoreFocusOut: true,
    });
    const keypath = await vscode.window.showInputBox({
      title: 'Satoshi/Satochip derivation path',
      value: "m/44'/60'/0'/0/0",
      ignoreFocusOut: true,
    });
    return signerFromSatochip({
      bridgeUrl,
      ...(pin ? { pin } : {}),
      ...(keypath ? { keypath } : {}),
    });
  }

  private async refreshAll(): Promise<void> {
    const snapshot = await this.buildSnapshot();
    this.networkProvider.setItems(makeNetworkItems(snapshot));
    this.nodeProvider.setItems(makeNodeItems(snapshot));
    this.accountsProvider.setItems(makeAccountItems(snapshot));
    this.contractsProvider.setItems(makeContractItems(snapshot));
    this.networkStatus.text = `$(globe) ${this.selectedNetworkLabel()}`;
    this.nodeStatus.text = `$(server) ${snapshot.nodeStatusLabel}`;
    this.nodeStatus.tooltip = 'Conflux local node status';
    await vscode.commands.executeCommand(
      'setContext',
      'cfxdevkit.nodeRunning',
      this.node?.isRunning() ?? false,
    );
  }

  private async buildSnapshot(): Promise<ViewSnapshot> {
    const network = this.selectedNetwork();
    const deployments = await this.readDeployments();
    const accounts: AccountTreeRecord[] = [];

    if (this.selectedBackend() === 'file') {
      const mnemonic = this.context.workspaceState.get<string>(STATE_NODE_MNEMONIC);
      if (mnemonic && validateMnemonic(mnemonic)) {
        accounts.push(...this.deriveMnemonicAccounts(mnemonic));
      } else if (network === 'local' && this.node?.isRunning()) {
        accounts.push(...this.deriveRunningNodeAccounts());
      }

      if (await this.keystoreExists()) {
        if (!accounts.length && this.unlockedPassphrase) {
          try {
            const unlocked = await openLocalWallet({
              passphrase: this.unlockedPassphrase,
              path: this.keystorePath(),
            });
            const coreAddress = hexToBase32(
              unlocked.signer.account.address as `0x${string}`,
              this.currentChains().core.id,
            );
            accounts.push({
              label: 'Workspace wallet',
              description: unlocked.signer.account.address,
              espaceAddress: unlocked.signer.account.address,
              coreAddress,
              detail: `File keystore\neSpace: ${unlocked.signer.account.address}\nCore: ${coreAddress}`,
              state: 'ready',
            });
          } catch {
            accounts.push({
              label: 'Workspace wallet',
              description: 'locked',
              detail: 'Use Conflux: Unlock Keystore',
              state: 'locked',
            });
          }
        } else if (!accounts.length) {
          accounts.push({
            label: 'Workspace wallet',
            description: 'locked',
            detail: 'Use Conflux: Unlock Keystore',
            state: 'locked',
          });
        }
      }
    } else if (this.cachedSigner?.backend === this.selectedBackend()) {
      const coreAddress = hexToBase32(
        this.cachedSigner.signer.account.address as `0x${string}`,
        this.currentChains().core.id,
      );
      accounts.push({
        label: `${BACKEND_LABELS[this.selectedBackend()]} account`,
        description: this.cachedSigner.signer.account.address,
        espaceAddress: this.cachedSigner.signer.account.address,
        coreAddress,
        detail: `eSpace: ${this.cachedSigner.signer.account.address}\nCore: ${coreAddress}`,
        state: 'ready',
      });
    } else {
      accounts.push({
        label: `${BACKEND_LABELS[this.selectedBackend()]} account`,
        description: 'not connected',
        detail: 'Use Conflux: Unlock Keystore to connect this backend',
        state: 'unavailable',
      });
    }

    await this.populateAccountBalances(accounts);

    const contracts: ContractTreeRecord[] = deployments.map((entry) => ({
      id: entry.id,
      label: entry.name,
      description: `${entry.chainId} • ${entry.address}`,
      address: entry.address,
      network: entry.network,
      target: entry.target,
      chainId: entry.chainId,
      detail: `${entry.txHash} • ${entry.deployedAt}`,
      abi: entry.abi,
    }));

    return {
      selectedNetworkLabel: this.selectedNetworkLabel(),
      selectedSpaceLabel: this.selectedSpace() === 'core' ? 'Core Space' : 'eSpace',
      selectedKeystoreBackendLabel: BACKEND_LABELS[this.selectedBackend()],
      selectedKeystorePathLabel:
        this.selectedBackend() === 'file' ? this.keystorePathLabel() : 'hardware backend',
      networkOptions: NETWORKS.map((option) => ({
        ...option,
        selected: option.network === this.selectedNetwork(),
      })),
      nodeStatusLabel: this.node?.isRunning() ? 'running' : 'stopped',
      nodeActions: [
        { label: 'Start node', command: 'cfxdevkit.nodeStart' },
        { label: 'Stop node', command: 'cfxdevkit.nodeStop' },
        { label: 'Restart node', command: 'cfxdevkit.nodeRestart' },
        { label: 'Wipe and restart', command: 'cfxdevkit.nodeWipeRestart' },
        { label: 'Mine blocks', command: 'cfxdevkit.mineBlocks', detail: 'local network only' },
      ],
      accountActions: [
        { label: 'Select keystore file', command: 'cfxdevkit.selectKeystoreFile', icon: 'folder' },
        { label: 'Initialize wallet', command: 'cfxdevkit.initializeSetup', icon: 'key' },
        { label: 'Unlock / connect', command: 'cfxdevkit.unlockKeystore', icon: 'unlock' },
      ],
      accounts,
      contracts,
    };
  }

  private async populateAccountBalances(accounts: AccountTreeRecord[]): Promise<void> {
    if (!accounts.length) return;
    if (this.selectedNetwork() === 'local' && !this.node?.isRunning()) return;

    const [espaceClient, coreClient] = await Promise.all([
      this.createClientFor('espace')
        .then((client) => client as EspaceClient)
        .catch(() => null),
      this.createClientFor('core')
        .then((client) => client as CoreSpaceClient)
        .catch(() => null),
    ]);

    await Promise.all(
      accounts.map(async (account) => {
        if (account.espaceAddress && espaceClient) {
          account.espaceBalance = await espaceClient
            .getBalance(account.espaceAddress as `0x${string}`)
            .then(formatBalance)
            .catch(() => undefined);
        }
        if (account.coreAddress && coreClient) {
          account.coreBalance = await coreClient
            .getBalance(account.coreAddress)
            .then(formatBalance)
            .catch(() => undefined);
        }
      }),
    );
  }

  private async selectNetwork(network?: NetworkSelection): Promise<void> {
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

  private async selectKeystoreBackend(): Promise<void> {
    const pick = await vscode.window.showQuickPick(
      [
        { label: 'File', description: 'Encrypted workspace keystore', backend: 'file' as const },
        {
          label: 'OneKey',
          description: 'OneKey hardware wallet through the OneKey SDK',
          backend: 'onekey' as const,
        },
        {
          label: 'Satoshi / Satochip',
          description: 'Satochip-compatible local bridge',
          backend: 'satoshi' as const,
        },
      ].map((item) => ({ ...item, picked: item.backend === this.selectedBackend() })),
      { title: 'Conflux: Select Keystore Backend', placeHolder: 'Choose the signing backend' },
    );
    if (!pick) return;
    await this.setSelectedBackend(pick.backend);
  }

  private async selectKeystoreFile(): Promise<void> {
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

  private async initializeWallet(): Promise<void> {
    if (this.selectedBackend() !== 'file') {
      const action = await vscode.window.showWarningMessage(
        'Wallet initialization is only available for the encrypted file backend.',
        'Switch to File',
      );
      if (action !== 'Switch to File') return;
      await this.setSelectedBackend('file');
    }

    if (await this.keystoreExists()) {
      const action = await vscode.window.showInformationMessage(
        'The workspace keystore already exists.',
        'Unlock Keystore',
      );
      if (action === 'Unlock Keystore') await this.unlockKeystore();
      return;
    }

    const source = await vscode.window.showQuickPick(
      [
        { label: 'Generate new mnemonic', value: 'generate' as const },
        { label: 'Import existing mnemonic', value: 'import' as const },
      ],
      { title: 'Conflux: Initialize Wallet', placeHolder: 'Choose a wallet source' },
    );
    if (!source) return;

    const label =
      (await vscode.window.showInputBox({
        title: 'Wallet label',
        prompt: 'Optional label for the stored account',
        value: 'default',
      })) ?? 'default';

    const passphrase = await vscode.window.showInputBox({
      title: 'Create keystore password',
      prompt: 'Use at least 8 characters',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => (value.length >= 8 ? null : 'Use at least 8 characters'),
    });
    if (!passphrase) return;

    const confirm = await vscode.window.showInputBox({
      title: 'Confirm keystore password',
      prompt: 'Repeat the password',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => (value === passphrase ? null : 'Passwords do not match'),
    });
    if (!confirm || confirm !== passphrase) return;

    let mnemonic: string | undefined;
    if (source.value === 'import') {
      mnemonic = await vscode.window.showInputBox({
        title: 'Import mnemonic',
        prompt: 'Enter your 12 or 24-word BIP-39 mnemonic phrase',
        ignoreFocusOut: true,
      });
      if (!mnemonic) return;
    }

    await this.ensureWorkspaceDir();
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Initializing Conflux wallet…',
      },
      () =>
        initLocalWallet({
          passphrase,
          path: this.keystorePath(),
          label,
          ...(mnemonic ? { mnemonic } : {}),
        }),
    );

    this.unlockedPassphrase = passphrase;
    await this.context.workspaceState.update(STATE_NODE_MNEMONIC, result.mnemonic);
    this.output.clear();
    this.output.appendLine('Conflux DevKit wallet initialized.');
    this.output.appendLine(`Address: ${result.address}`);
    this.output.appendLine(`Keystore: ${result.path}`);
    this.output.appendLine('');
    this.output.appendLine('Recovery mnemonic:');
    this.output.appendLine(result.mnemonic);
    this.output.show(true);

    await vscode.window.showInformationMessage(
      'Wallet initialized. Save the recovery mnemonic from the Conflux DevKit output channel.',
    );
    await this.refreshAll();
  }

  private async unlockKeystore(): Promise<void> {
    const signer =
      this.selectedBackend() === 'file'
        ? (await this.ensureUnlockedWallet()).signer
        : await this.ensureHardwareSigner();
    await vscode.window.showInformationMessage(
      `${BACKEND_LABELS[this.selectedBackend()]} ready for ${signer.account.address}`,
    );
    await this.refreshAll();
  }

  private async startRuntime(): Promise<void> {
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

  private async getOrCreateNodeMnemonic(): Promise<string> {
    const existing = this.context.workspaceState.get<string>(STATE_NODE_MNEMONIC);
    if (existing) return existing;
    const mnemonic = generateMnemonic(128);
    await this.context.workspaceState.update(STATE_NODE_MNEMONIC, mnemonic);
    return mnemonic;
  }

  private async startNode(): Promise<void> {
    if (this.node?.isRunning()) {
      await vscode.window.showInformationMessage('The local Conflux node is already running.');
      return;
    }
    const mnemonic = await this.getOrCreateNodeMnemonic();
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
    await this.refreshAll();
  }

  private async stopNode(): Promise<void> {
    if (!this.node) {
      await vscode.window.showInformationMessage('The local node is not running.');
      return;
    }
    await this.node.stop();
    this.node = null;
    this.log('Node stopped.');
    await this.refreshAll();
  }

  private async restartNode(): Promise<void> {
    if (!this.node) {
      await this.startNode();
      return;
    }
    await this.node.restart();
    this.log('Node restarted.');
    await this.refreshAll();
  }

  private async wipeNode(): Promise<void> {
    if (this.node) {
      await this.node.stop();
      this.node = null;
    }
    await fs.rm(this.nodeDataDir(), { recursive: true, force: true });
    this.log('Node data wiped.');
    await this.refreshAll();
  }

  private async wipeNodeAndRestart(): Promise<void> {
    await this.wipeNode();
    await this.startNode();
  }

  private async mineBlocks(): Promise<void> {
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
    await this.node.mine(Number(raw));
    this.log(`Mined ${raw} block(s).`);
  }

  private async showAccountsQuickPick(): Promise<void> {
    const snapshot = await this.buildSnapshot();
    if (!snapshot.accounts.length) {
      await vscode.window.showInformationMessage('No accounts available yet.');
      return;
    }
    const items: Array<vscode.QuickPickItem & { address: string }> = snapshot.accounts.flatMap(
      (account) => {
        const out: Array<vscode.QuickPickItem & { address: string }> = [];
        if (account.espaceAddress) {
          out.push({
            label: `${account.label} eSpace`,
            description: account.espaceAddress,
            detail: account.detail,
            address: account.espaceAddress,
          });
        }
        if (account.coreAddress) {
          out.push({
            label: `${account.label} Core Space`,
            description: account.coreAddress,
            detail: account.detail,
            address: account.coreAddress,
          });
        }
        return out;
      },
    );
    const picked = await vscode.window.showQuickPick(items, {
      title: 'Conflux Accounts',
      placeHolder: 'Pick an account to copy its address',
    });
    if (picked) await this.copyAddress(picked.address);
  }

  private async showContractsQuickPick(): Promise<void> {
    const deployments = (await this.readDeployments()).filter(
      (entry) => entry.network === this.selectedNetwork(),
    );
    if (!deployments.length) {
      await vscode.window.showInformationMessage(
        'No deployed contracts recorded for the selected network.',
      );
      return;
    }
    const picked = await vscode.window.showQuickPick(
      deployments.map((entry) => ({
        label: entry.name,
        description: `${entry.target} • ${entry.address}`,
        detail: entry.txHash,
        address: entry.address,
      })),
      { title: 'Deployed Contracts', placeHolder: 'Pick a contract to copy its address' },
    );
    if (picked) await this.copyAddress(picked.address);
  }

  private async copyAddress(address?: string): Promise<void> {
    if (!address) return;
    await vscode.env.clipboard.writeText(address);
    await vscode.window.showInformationMessage(`Copied ${address}`);
  }

  private async deployContractCommand(): Promise<void> {
    if (this.selectedNetwork() === 'local' && !this.node?.isRunning()) {
      const action = await vscode.window.showWarningMessage(
        'The local network is selected but the local node is not running.',
        'Start Node',
      );
      if (action !== 'Start Node') return;
      await this.startNode();
    }

    const source = await vscode.window.showQuickPick(
      [
        { label: 'Built-in template', value: 'template' as const },
        { label: 'Workspace Solidity file', value: 'file' as const },
      ],
      { title: 'Conflux: Deploy Contract', placeHolder: 'Choose a contract source' },
    );
    if (!source) return;

    const artifact =
      source.value === 'template'
        ? await this.pickTemplateArtifact()
        : await this.pickWorkspaceArtifact();
    if (!artifact) return;

    const target = await this.pickChainTarget(`Deploy ${artifact.contractName}`);
    if (!target) return;

    const args = await this.promptConstructorArgs(artifact);
    if (!args) return;

    const client = await this.createClientFor(target);
    const signer =
      this.selectedNetwork() === 'local'
        ? signerFromPrivateKey(
            this.node?.accounts[0]?.privateKey ??
              (() => {
                throw new Error('Local node account unavailable.');
              })(),
            target === 'core' ? this.currentChains().core.id : undefined,
          )
        : await this.walletSignerFor(target);

    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Deploying ${artifact.contractName}…`,
      },
      () =>
        deployContract({
          client,
          signer,
          abi: artifact.abi as never,
          bytecode: artifact.bytecode as `0x${string}`,
          args: args as never,
          waitForReceipt: true,
          receiptTimeoutMs: this.selectedNetwork() === 'local' ? 30_000 : 120_000,
        }),
    );

    if (!result.address) throw new Error('Deployment completed without a contract address.');

    const deployments = await this.readDeployments();
    deployments.unshift({
      id: `${Date.now()}-${artifact.contractName}`,
      name: artifact.contractName,
      address: result.address,
      target,
      network: this.selectedNetwork(),
      chainId: this.currentChain(target).id,
      txHash: result.hash,
      deployedAt: new Date().toISOString(),
      abi: artifact.abi as unknown[],
    });
    await this.writeDeployments(deployments);
    this.log(
      `Deployed ${artifact.contractName} to ${this.selectedNetworkLabel()} ${target === 'core' ? 'Core Space' : 'eSpace'} at ${result.address}`,
    );
    await vscode.window.showInformationMessage(
      `Deployed ${artifact.contractName} at ${result.address}`,
    );
    await this.refreshAll();
  }

  private async importContractCommand(): Promise<void> {
    const source = await vscode.window.showQuickPick(
      [
        { label: 'Manual input', value: 'manual' as const },
        { label: 'From environment variable', value: 'env' as const },
      ],
      { title: 'Import Contract', placeHolder: 'Choose contract address source' },
    );
    if (!source) return;

    let address: string;
    if (source.value === 'env') {
      const envVar = await vscode.window.showInputBox({
        title: 'Import Contract Environment Variable',
        prompt: 'Enter the env var name containing the contract address',
        value: 'CONTRACT_ADDRESS',
        validateInput: (value) => (value.trim() ? null : 'Environment variable name is required'),
      });
      if (!envVar) return;
      const value = process.env[envVar.trim()];
      if (!value) {
        await vscode.window.showErrorMessage(`Environment variable ${envVar.trim()} is not set.`);
        return;
      }
      address = value.trim();
    } else {
      const input = await vscode.window.showInputBox({
        title: 'Import Contract Address',
        prompt: 'Enter the deployed Core or eSpace contract address',
        placeHolder: '0x... or cfx:/cfxtest:/net...:',
        validateInput: (value) => (value.trim() ? null : 'Address is required'),
      });
      if (!input) return;
      address = input.trim();
    }

    const inferredTarget: ChainTarget = address.toLowerCase().startsWith('0x') ? 'espace' : 'core';
    const targetPick = await vscode.window.showQuickPick(
      [
        {
          label: 'eSpace',
          description: 'EVM-compatible 0x address',
          target: 'espace' as const,
          picked: inferredTarget === 'espace',
        },
        {
          label: 'Core Space',
          description: 'Conflux-native base32 address',
          target: 'core' as const,
          picked: inferredTarget === 'core',
        },
      ],
      { title: 'Import Contract Chain', placeHolder: 'Select chain for this contract' },
    );
    if (!targetPick) return;

    if (targetPick.target !== inferredTarget) {
      const keep = await vscode.window.showWarningMessage(
        `Address format suggests ${inferredTarget === 'espace' ? 'eSpace' : 'Core Space'}, but you selected ${targetPick.label}. Continue?`,
        'Continue',
        'Cancel',
      );
      if (keep !== 'Continue') return;
    }

    const networkPick = await vscode.window.showQuickPick(
      NETWORKS.map((network) => ({
        label: network.label,
        description: network.description,
        network: network.network,
        picked: network.network === this.selectedNetwork(),
      })),
      { title: 'Import Contract Network', placeHolder: 'Select deployment network' },
    );
    if (!networkPick) return;

    const name = await vscode.window.showInputBox({
      title: 'Import Contract Name',
      value: 'ImportedContract',
      validateInput: (value) => (value.trim() ? null : 'Name is required'),
    });
    if (!name) return;

    const abiText = await vscode.window.showInputBox({
      title: 'Contract ABI',
      prompt: 'Optional JSON ABI for read/write function management',
      placeHolder: '[{"type":"function",...}]',
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value.trim()) return null;
        try {
          const parsed = JSON.parse(value) as unknown;
          return Array.isArray(parsed) ? null : 'ABI must be a JSON array';
        } catch {
          return 'ABI must be valid JSON';
        }
      },
    });
    if (abiText === undefined) return;

    const txHash = await vscode.window.showInputBox({
      title: 'Deployment Transaction Hash',
      prompt: 'Optional',
    });

    const deployments = await this.readDeployments();
    const chains = this.chainsFor(networkPick.network);
    deployments.unshift({
      id: `${Date.now()}-${name.trim()}`,
      name: name.trim(),
      address: address.trim(),
      target: targetPick.target,
      network: networkPick.network,
      chainId: targetPick.target === 'core' ? chains.core.id : chains.espace.id,
      txHash: txHash?.trim() || 'imported',
      deployedAt: new Date().toISOString(),
      abi: abiText.trim() ? (JSON.parse(abiText) as unknown[]) : undefined,
    });
    await this.writeDeployments(deployments);
    await vscode.window.showInformationMessage(
      `Imported ${name.trim()} on ${networkPick.label} ${targetPick.label}.`,
    );
    await this.refreshAll();
  }

  private async pickTemplateArtifact(): Promise<Artifact | null> {
    const templates = listTemplates();
    const picked = await vscode.window.showQuickPick(
      templates.map((template) => ({
        label: template.name,
        description: template.description,
        template,
      })),
      { title: 'Built-in Templates', placeHolder: 'Choose a built-in contract template' },
    );
    if (!picked) return null;

    const output = await compile({
      sources: picked.template.sources,
      solcVersion: picked.template.solcVersion,
    });
    return (
      output.artifacts.find((artifact) => artifact.contractName === picked.template.contractName) ??
      null
    );
  }

  private async pickWorkspaceArtifact(): Promise<Artifact | null> {
    const workspace = this.workspaceRoot();
    const files = await vscode.workspace.findFiles(
      '**/*.sol',
      '**/{node_modules,dist,coverage,.git}/**',
    );
    if (!files.length) {
      throw new Error('No Solidity files were found in the current workspace.');
    }
    const picked = await vscode.window.showQuickPick(
      files.map((file) => ({
        label: relative(workspace, file.fsPath),
        file,
      })),
      { title: 'Workspace Solidity Files', placeHolder: 'Choose a Solidity source file' },
    );
    if (!picked) return null;

    const solcVersion =
      (await vscode.window.showInputBox({
        title: 'Solc version',
        prompt: 'Exact Solidity compiler version to use',
        value: '0.8.26',
      })) ?? '0.8.26';

    const content = await fs.readFile(picked.file.fsPath, 'utf8');
    const output = await compile({
      sources: [{ path: relative(workspace, picked.file.fsPath), content }],
      solcVersion,
      resolver: npmResolver({ rootDir: workspace }),
    });

    if (output.warnings.length) {
      this.log(output.warnings.map((warning) => warning.message).join('\n'));
    }

    if (output.artifacts.length === 1) return output.artifacts[0] ?? null;

    const artifactPick = await vscode.window.showQuickPick(
      output.artifacts.map((artifact) => ({
        label: artifact.contractName,
        description: artifact.path,
        artifact,
      })),
      { title: 'Compiled Artifacts', placeHolder: 'Choose the contract artifact to deploy' },
    );
    return artifactPick?.artifact ?? null;
  }

  private async promptConstructorArgs(artifact: Artifact): Promise<unknown[] | null> {
    const constructorAbi = (
      artifact.abi as unknown as ReadonlyArray<{
        type?: string;
        inputs?: ReadonlyArray<{ name?: string; type: string }>;
      }>
    ).find((entry) => entry.type === 'constructor');
    const inputs = constructorAbi?.inputs ?? [];
    const args: unknown[] = [];

    for (const input of inputs) {
      const raw = await vscode.window.showInputBox({
        title: `${artifact.contractName} constructor`,
        prompt: `${input.name || '(arg)'}: ${input.type}`,
        placeHolder: input.type,
        ignoreFocusOut: true,
      });
      if (raw === undefined) return null;
      args.push(this.parseArgValue(raw, input.type));
    }

    return args;
  }

  private async abiCallRead(
    fn: AbiFunctionTreeRecord,
    contract: ContractTreeRecord,
  ): Promise<void> {
    if (contract.network !== this.selectedNetwork()) {
      const action = await vscode.window.showWarningMessage(
        `Switch active network to ${contract.network} before calling this contract?`,
        'Switch',
      );
      if (action !== 'Switch') return;
      await this.setSelectedNetwork(contract.network as NetworkSelection);
    }
    const args = await this.promptAbiArgs(fn);
    if (!args) return;
    const client = await this.createClientFor(contract.target);
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Calling ${contract.label}.${fn.name}...`,
      },
      () =>
        readContract({
          client,
          address: contract.address,
          abi: contract.abi as never,
          functionName: fn.name as never,
          args: args as never,
        }),
    );
    this.output.appendLine(`[READ] ${contract.label}.${fn.name} -> ${stringifyResult(result)}`);
    this.output.show(true);
  }

  private async abiCallWrite(
    fn: AbiFunctionTreeRecord,
    contract: ContractTreeRecord,
  ): Promise<void> {
    if (contract.network !== this.selectedNetwork()) {
      const action = await vscode.window.showWarningMessage(
        `Switch active network to ${contract.network} before sending this transaction?`,
        'Switch',
      );
      if (action !== 'Switch') return;
      await this.setSelectedNetwork(contract.network as NetworkSelection);
    }
    const args = await this.promptAbiArgs(fn);
    if (!args) return;
    const value = fn.stateMutability === 'payable' ? await this.promptPayableValue() : undefined;
    if (value === null) return;
    const client = await this.createClientFor(contract.target);
    const signer =
      this.selectedNetwork() === 'local'
        ? signerFromPrivateKey(
            this.node?.accounts[0]?.privateKey ??
              (() => {
                throw new Error('Local node account unavailable.');
              })(),
            contract.target === 'core' ? this.currentChains().core.id : undefined,
          )
        : await this.walletSignerFor(contract.target);
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Sending ${contract.label}.${fn.name}...`,
      },
      () =>
        sendWrite({
          client,
          signer,
          address: contract.address,
          abi: contract.abi as never,
          functionName: fn.name as never,
          args: args as never,
          ...(value !== undefined ? { value } : {}),
          waitForReceipt: true,
          receiptTimeoutMs: this.selectedNetwork() === 'local' ? 30_000 : 120_000,
        }),
    );
    this.output.appendLine(`[WRITE] ${contract.label}.${fn.name} -> ${result.hash}`);
    this.output.show(true);
    await vscode.window.showInformationMessage(`${fn.name} transaction sent: ${result.hash}`);
  }

  private async promptAbiArgs(fn: AbiFunctionTreeRecord): Promise<unknown[] | null> {
    const inputs = fn.inputs ?? [];
    if (!inputs.length) return [];
    const raw = await vscode.window.showInputBox({
      title: `${fn.name} arguments`,
      prompt: inputs.map((input) => `${input.name || '(arg)'}: ${input.type}`).join(', '),
      placeHolder: this.abiArgsPlaceholder(inputs),
      ignoreFocusOut: true,
      validateInput: (value) => {
        try {
          const parsed = value.trim() ? (JSON.parse(value) as unknown) : [];
          return Array.isArray(parsed) ? null : 'Enter a JSON array';
        } catch {
          return 'Enter valid JSON';
        }
      },
    });
    if (raw === undefined) return null;
    return raw.trim() ? (JSON.parse(raw) as unknown[]) : [];
  }

  private abiArgsPlaceholder(inputs: ReadonlyArray<{ name?: string; type: string }>): string {
    return `[${inputs.map((input) => this.placeholderForSolidityType(input.type)).join(', ')}]`;
  }

  private placeholderForSolidityType(type: string): string {
    if (type.endsWith('[]')) return '[]';
    if (type.includes('address')) return '"0x..."';
    if (type.includes('bool')) return 'true';
    if (type.includes('string')) return '"text"';
    if (type.includes('bytes')) return '"0x"';
    if (type.includes('int')) return '"0"';
    return 'null';
  }

  private async promptPayableValue(): Promise<bigint | undefined | null> {
    const raw = await vscode.window.showInputBox({
      title: 'Payable value',
      prompt: 'Value in wei/drip. Leave empty for 0.',
      validateInput: (value) =>
        value.trim() === '' || /^\d+$/.test(value.trim()) ? null : 'Enter a non-negative integer',
    });
    if (raw === undefined) return null;
    return raw.trim() ? BigInt(raw.trim()) : undefined;
  }

  private parseArgValue(value: string, solidityType: string): unknown {
    if (solidityType.endsWith('[]')) {
      return JSON.parse(value);
    }
    if (solidityType.startsWith('uint') || solidityType.startsWith('int')) {
      return BigInt(value);
    }
    if (solidityType === 'bool') {
      return value.toLowerCase() === 'true';
    }
    return value;
  }
}

let runtime: ExtensionRuntime | null = null;

function dynamicImport(specifier: string): Promise<Record<string, unknown>> {
  const importer = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<Record<string, unknown>>;
  return importer(specifier);
}

function stringifyResult(value: unknown): string {
  return JSON.stringify(value, (_key, inner) =>
    typeof inner === 'bigint' ? inner.toString() : inner,
  );
}

function formatBalance(value: bigint): string {
  const formatted = formatCFX(value);
  const [whole, fraction = ''] = formatted.split('.');
  const trimmedFraction = fraction.replace(/0+$/, '').slice(0, 4);
  return `${trimmedFraction ? `${whole}.${trimmedFraction}` : whole} CFX`;
}

function isInsideWorkspace(path: string, workspaceRoot: string): boolean {
  const relativePath = relative(workspaceRoot, path);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  runtime = new ExtensionRuntime(context);
  context.subscriptions.push(runtime);
  await runtime.activate();
}

export async function deactivate(): Promise<void> {
  runtime?.dispose();
  runtime = null;
}
