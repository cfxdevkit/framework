import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';
import * as vscode from 'vscode';
import { hexToBase32 } from '@cfxdevkit/core/address';
import {
  coreSpaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  espaceLocal,
  espaceMainnet,
  espaceTestnet,
  type ChainConfig,
} from '@cfxdevkit/core/chains';
import { createClient, http } from '@cfxdevkit/core/client';
import { generateMnemonic, signerFromPrivateKey, type Signer } from '@cfxdevkit/core/wallet';
import { compile, listTemplates, npmResolver, type Artifact } from '@cfxdevkit/compiler';
import { deployContract } from '@cfxdevkit/contracts/deploy';
import { createDevNode, type DevNode } from '@cfxdevkit/devnode';
import { initLocalWallet, openLocalWallet, type OpenLocalWalletResult } from '@cfxdevkit/wallet/init';
import {
  StaticTreeProvider,
  makeAccountItems,
  makeContractItems,
  makeNetworkItems,
  makeNodeItems,
  type AccountTreeRecord,
  type ContractTreeRecord,
  type ViewSnapshot,
} from './views.js';

type NetworkSelection = 'local' | 'testnet' | 'mainnet';
type ChainTarget = 'espace' | 'core';

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
const STATE_NODE_MNEMONIC = 'cfxdevkit.localNodeMnemonic';

class ExtensionRuntime implements vscode.Disposable {
  private node: DevNode | null = null;
  private unlockedPassphrase: string | null = null;
  private readonly output = vscode.window.createOutputChannel('Conflux DevKit');
  private readonly networkStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  private readonly nodeStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
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
        this.log(`Auto-start node failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  }

  private registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('cfxdevkit.selectNetwork', () => this.selectNetwork()),
      vscode.commands.registerCommand('cfxdevkit.initializeSetup', () => this.initializeWallet()),
      vscode.commands.registerCommand('cfxdevkit.unlockKeystore', () => this.unlockKeystore()),
      vscode.commands.registerCommand('cfxdevkit.nodeStart', () => this.startNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeStop', () => this.stopNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeRestart', () => this.restartNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeWipe', () => this.wipeNode()),
      vscode.commands.registerCommand('cfxdevkit.nodeWipeRestart', () => this.wipeNodeAndRestart()),
      vscode.commands.registerCommand('cfxdevkit.mineBlocks', () => this.mineBlocks()),
      vscode.commands.registerCommand('cfxdevkit.viewAccounts', () => this.showAccountsQuickPick()),
      vscode.commands.registerCommand('cfxdevkit.deployContract', () => this.deployContractCommand()),
      vscode.commands.registerCommand('cfxdevkit.listContracts', () => this.showContractsQuickPick()),
      vscode.commands.registerCommand('cfxdevkit.refreshAccounts', () => this.refreshAll()),
      vscode.commands.registerCommand('cfxdevkit.refreshContracts', () => this.refreshAll()),
      vscode.commands.registerCommand('cfxdevkit.copyAddress', (address?: string) => this.copyAddress(address)),
      vscode.commands.registerCommand('cfxdevkit.copyContractAddress', (address?: string) => this.copyAddress(address)),
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
    return (this.context.workspaceState.get<NetworkSelection>(STATE_NETWORK) ?? 'local');
  }

  private async setSelectedNetwork(network: NetworkSelection): Promise<void> {
    await this.context.workspaceState.update(STATE_NETWORK, network);
    await this.refreshAll();
  }

  private keystorePath(): string {
    return join(this.workspaceRoot(), this.config().get<string>('keystorePath', '.cfxdevkit/keystore.json'));
  }

  private deploymentsPath(): string {
    return join(this.workspaceRoot(), this.config().get<string>('deploymentsPath', '.cfxdevkit/deployments.json'));
  }

  private nodeDataDir(): string {
    return join(this.workspaceRoot(), this.config().get<string>('nodeDataDir', '.cfxdevkit/devnode'));
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

  private currentChains(): { espace: ChainConfig; core: ChainConfig } {
    switch (this.selectedNetwork()) {
      case 'mainnet':
        return { espace: espaceMainnet, core: coreSpaceMainnet };
      case 'testnet':
        return { espace: espaceTestnet, core: coreSpaceTestnet };
      case 'local':
      default:
        return { espace: espaceLocal, core: coreSpaceLocal };
    }
  }

  private async createClientFor(target: ChainTarget) {
    const chains = this.currentChains();
    if (this.selectedNetwork() === 'local') {
      if (!this.node?.isRunning()) throw new Error('Start the local node before using the local network.');
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

  private async walletSignerFor(target: ChainTarget): Promise<Signer> {
    const unlocked = await this.ensureUnlockedWallet();
    const signer = unlocked.signer;
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

  private async refreshAll(): Promise<void> {
    const snapshot = await this.buildSnapshot();
    this.networkProvider.setItems(makeNetworkItems(snapshot));
    this.nodeProvider.setItems(makeNodeItems(snapshot));
    this.accountsProvider.setItems(makeAccountItems(snapshot));
    this.contractsProvider.setItems(makeContractItems(snapshot));
    this.networkStatus.text = `$(globe) ${snapshot.selectedNetworkLabel}`;
    this.nodeStatus.text = `$(server) ${snapshot.nodeStatusLabel}`;
    this.nodeStatus.tooltip = 'Conflux local node status';
    await vscode.commands.executeCommand('setContext', 'cfxdevkit.nodeRunning', this.node?.isRunning() ?? false);
  }

  private async buildSnapshot(): Promise<ViewSnapshot> {
    const network = this.selectedNetwork();
    const deployments = await this.readDeployments();
    const accounts: AccountTreeRecord[] = [];

    if (network === 'local' && this.node?.isRunning()) {
      accounts.push(
        ...this.node.accounts.map((account, index) => ({
          label: `Local #${index}`,
          description: account.evmAddress,
          address: account.evmAddress,
          detail: account.coreAddress,
        })),
      );
    } else if (await this.keystoreExists()) {
      if (this.unlockedPassphrase) {
        try {
          const unlocked = await openLocalWallet({
            passphrase: this.unlockedPassphrase,
            path: this.keystorePath(),
          });
          accounts.push({
            label: 'Workspace wallet',
            description: unlocked.signer.account.address,
            address: unlocked.signer.account.address,
            detail: hexToBase32(
              unlocked.signer.account.address as `0x${string}`,
              this.currentChains().core.id,
            ),
          });
        } catch {
          accounts.push({
            label: 'Workspace wallet',
            description: 'locked',
            address: this.keystorePath(),
            detail: 'Use Conflux: Unlock Keystore',
          });
        }
      } else {
        accounts.push({
          label: 'Workspace wallet',
          description: 'locked',
          address: this.keystorePath(),
          detail: 'Use Conflux: Unlock Keystore',
        });
      }
    }

    const contracts: ContractTreeRecord[] = deployments
      .filter((entry) => entry.network === network)
      .map((entry) => ({
        id: entry.id,
        label: entry.name,
        description: `${entry.target} • ${entry.address}`,
        address: entry.address,
        detail: `${entry.txHash} • ${entry.deployedAt}`,
      }));

    return {
      selectedNetworkLabel: network,
      nodeStatusLabel: this.node?.isRunning() ? 'running' : 'stopped',
      nodeActions: [
        { label: 'Start node', command: 'cfxdevkit.nodeStart' },
        { label: 'Stop node', command: 'cfxdevkit.nodeStop' },
        { label: 'Restart node', command: 'cfxdevkit.nodeRestart' },
        { label: 'Wipe and restart', command: 'cfxdevkit.nodeWipeRestart' },
        { label: 'Mine blocks', command: 'cfxdevkit.mineBlocks', detail: 'local network only' },
      ],
      accounts,
      contracts,
    };
  }

  private async selectNetwork(): Promise<void> {
    const pick = await vscode.window.showQuickPick(
      [
        { label: 'Local', description: 'Use the workspace dev node', value: 'local' as const },
        { label: 'Testnet', description: 'Connect to Conflux testnet RPCs', value: 'testnet' as const },
        { label: 'Mainnet', description: 'Connect to Conflux mainnet RPCs', value: 'mainnet' as const },
      ],
      {
        title: 'Conflux: Select Network',
        placeHolder: 'Choose the active target network',
      },
    );
    if (!pick) return;
    await this.setSelectedNetwork(pick.value);
  }

  private async initializeWallet(): Promise<void> {
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
    const unlocked = await this.ensureUnlockedWallet();
    await vscode.window.showInformationMessage(`Keystore unlocked for ${unlocked.signer.account.address}`);
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
      validateInput: (value) => (/^\d+$/.test(value) && Number(value) > 0 ? null : 'Enter a positive integer'),
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
    const picked = await vscode.window.showQuickPick(
      snapshot.accounts.map((account) => ({
        label: account.label,
        description: account.description,
        detail: account.detail,
        address: account.address,
      })),
      { title: 'Conflux Accounts', placeHolder: 'Pick an account to copy its address' },
    );
    if (picked) await this.copyAddress(picked.address);
  }

  private async showContractsQuickPick(): Promise<void> {
    const deployments = (await this.readDeployments()).filter(
      (entry) => entry.network === this.selectedNetwork(),
    );
    if (!deployments.length) {
      await vscode.window.showInformationMessage('No deployed contracts recorded for the selected network.');
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

    const artifact = source.value === 'template' ? await this.pickTemplateArtifact() : await this.pickWorkspaceArtifact();
    if (!artifact) return;

    const chainPick = await vscode.window.showQuickPick(
      [
        { label: 'eSpace', description: '0x address deployment', value: 'espace' as const },
        { label: 'Core Space', description: 'base32 address deployment', value: 'core' as const },
      ],
      { title: `Deploy ${artifact.contractName}`, placeHolder: 'Choose the target chain family' },
    );
    if (!chainPick) return;

    const args = await this.promptConstructorArgs(artifact);
    if (!args) return;

    const client = await this.createClientFor(chainPick.value);
    const signer =
      this.selectedNetwork() === 'local'
        ? signerFromPrivateKey(
            this.node?.accounts[0]?.privateKey ?? (() => { throw new Error('Local node account unavailable.'); })(),
            chainPick.value === 'core' ? this.currentChains().core.id : undefined,
          )
        : await this.walletSignerFor(chainPick.value);

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
      target: chainPick.value,
      network: this.selectedNetwork(),
      chainId: chainPick.value === 'core' ? this.currentChains().core.id : this.currentChains().espace.id,
      txHash: result.hash,
      deployedAt: new Date().toISOString(),
      abi: artifact.abi as unknown[],
    });
    await this.writeDeployments(deployments);
    this.log(`Deployed ${artifact.contractName} to ${chainPick.value} at ${result.address}`);
    await vscode.window.showInformationMessage(`Deployed ${artifact.contractName} at ${result.address}`);
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
    return output.artifacts.find((artifact) => artifact.contractName === picked.template.contractName) ?? null;
  }

  private async pickWorkspaceArtifact(): Promise<Artifact | null> {
    const workspace = this.workspaceRoot();
    const files = await vscode.workspace.findFiles('**/*.sol', '**/{node_modules,dist,coverage,.git}/**');
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
    ).find(
      (entry) => entry.type === 'constructor',
    );
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

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  runtime = new ExtensionRuntime(context);
  context.subscriptions.push(runtime);
  await runtime.activate();
}

export async function deactivate(): Promise<void> {
  runtime?.dispose();
  runtime = null;
}