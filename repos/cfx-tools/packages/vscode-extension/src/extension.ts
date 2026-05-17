// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedPrivateClassMembers: runtime state is accessed through extracted helper functions.
// biome-ignore-all format: compact bridge imports and wrappers stay below hotspot limits.
// biome-ignore-all assist/source/organizeImports: bridge imports are intentionally grouped by helper module.
import { abiArgsPlaceholder, abiCallRead, abiCallWrite, parseArgValue, placeholderForSolidityType, promptAbiArgs, promptPayableValue, pickTemplateArtifact, pickWorkspaceArtifact, promptConstructorArgs, readDeployments, writeDeployments, chainsFor, currentChains, currentChain, selectedNetworkLabel, pickChainTarget, createClientFor, withCoreAddress, deriveRunningNodeAccounts, walletSignerFor, ensureUnlockedWallet, registerCommands, showAccountsQuickPick, showContractsQuickPick, copyAddress, deployContractCommand, importContractCommand, createAppendOnlyAuditLogger, type createSharedNodeRuntime, StaticTreeProvider, vscode, startRuntime, getOrCreateNodeMnemonic, startNode, stopNode, restartNode, wipeNode, wipeNodeAndRestart, mineBlocks, startMining, stopMining, selectNetwork, workspaceRoot, config, selectedNetwork, selectedSpace, selectedBackend, selectedFileRef, selectedAccountIndex, derivationPath, setSelectedNetwork, setSelectedSpace, setSelectedBackend, keystorePath, keystorePathLabel, deploymentsPath, nodeDataDir, ensureWorkspaceDir, auditLogPath, log, keystoreExists, fileKeystore, refKey, walletTarget, promptKeystorePassphrase, promptNewKeystorePassphrase, listFileWallets, ensureFileBackend, ensureFileKeystoreUnlocked, currentCapability, refreshAll, buildSnapshot, populateAccountBalances, initializeWallet, addWallet, selectWallet, removeWallet, lockKeystore, rotateKeystorePassphrase, sanitizeAccountName, unlockKeystore } from './helpers/index.js';
class ExtensionRuntime implements vscode.Disposable {
  private node: ReturnType<typeof createSharedNodeRuntime> | null = null;
  private unlockedPassphrase: string | null = null;
  private fileProvider: KeystoreProvider | null = null;
  private cachedSigner: CachedSigner | null = null;
  private localNodeMnemonic: string | null = null;
  private readonly auditLogger = createAppendOnlyAuditLogger({
    path: this.auditLogPath(),
    onError: (error: unknown) => this.log(`Failed to write keystore audit event: ${String(error)}`),
  });
  private readonly output = vscode.window.createOutputChannel('Conflux DevKit');
  private readonly mainProvider = new StaticTreeProvider<vscode.TreeItem>();
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.disposables.push(
      this.output,
      vscode.window.createTreeView('cfxdevkit.mainView', {
        treeDataProvider: this.mainProvider,
        showCollapseAll: false,
      }),
    );
  }

  dispose(): void {
    for (const disposable of this.disposables) disposable.dispose();
    // Node stop is handled by deactivate() which awaits it properly.
    // dispose() is intentionally synchronous; don't fire-and-forget stop here.
    this.node = null;
  }

  async stopNodeForDeactivation(): Promise<void> {
    if (this.node) {
      await this.node.stop().catch(() => {});
      this.node = null;
    }
  }

  async activate(): Promise<void> {
    this.registerCommands();
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
    registerCommands.call(this);
  }
  private workspaceRoot(): string { return workspaceRoot.call(this); }
  private config(): vscode.WorkspaceConfiguration { return config.call(this); }
  private selectedNetwork(): NetworkSelection { return selectedNetwork.call(this); }
  private selectedSpace(): ChainTarget { return selectedSpace.call(this); }
  private selectedBackend(): KeystoreBackend { return selectedBackend.call(this); }
  private selectedFileRef(): SecretRef { return selectedFileRef.call(this); }
  private selectedAccountIndex(): number { return selectedAccountIndex.call(this); }
  private derivationPath(index = this.selectedAccountIndex()): string { return derivationPath.call(this, index); }
  private async setSelectedNetwork(network: NetworkSelection): Promise<void> { return setSelectedNetwork.call(this, network); }
  private async setSelectedSpace(target: ChainTarget): Promise<void> { return setSelectedSpace.call(this, target); }
  private async setSelectedBackend(backend: KeystoreBackend): Promise<void> { return setSelectedBackend.call(this, backend); }
  private keystorePath(): string { return keystorePath.call(this); }
  private keystorePathLabel(): string { return keystorePathLabel.call(this); }
  private deploymentsPath(): string { return deploymentsPath.call(this); }
  private nodeDataDir(): string { return nodeDataDir.call(this); }
  private async ensureWorkspaceDir(): Promise<void> { return ensureWorkspaceDir.call(this); }
  private auditLogPath(): string { return auditLogPath.call(this); }
  private log(message: string): void { log.call(this, message); }
  private async keystoreExists(): Promise<boolean> { return keystoreExists.call(this); }
  private fileKeystore(passphrase: string): KeystoreProvider { return fileKeystore.call(this, passphrase); }
  private refKey(ref: SecretRef): string { return refKey.call(this, ref); }
  private walletTarget(target?: WalletCommandTarget): WalletCommandTarget | null { return walletTarget.call(this, target); }
  private async promptKeystorePassphrase(title: string): Promise<string | null> { return promptKeystorePassphrase.call(this, title); }
  private async promptNewKeystorePassphrase(): Promise<string | null> { return promptNewKeystorePassphrase.call(this); }
  private async listFileWallets(): Promise<StoredSecret[]> { return listFileWallets.call(this); }
  private async ensureFileBackend(): Promise<boolean> { return ensureFileBackend.call(this); }
  private async ensureFileKeystoreUnlocked(): Promise<KeystoreProvider> { return ensureFileKeystoreUnlocked.call(this); }
  private currentCapability() { return currentCapability.call(this); }
  private async readDeployments(): Promise<DeploymentRecord[]> { return readDeployments.call(this); }
  private async writeDeployments(records: DeploymentRecord[]): Promise<void> { return writeDeployments.call(this, records); }
  private chainsFor(network: NetworkSelection): { espace: ChainConfig; core: ChainConfig } { return chainsFor.call(this, network); }
  private currentChains(): { espace: ChainConfig; core: ChainConfig } { return currentChains.call(this); }
  private currentChain(target: ChainTarget = this.selectedSpace()): ChainConfig { return currentChain.call(this, target); }
  private selectedNetworkLabel(): string { return selectedNetworkLabel.call(this); }
  private async pickChainTarget(title: string): Promise<ChainTarget | null> { return pickChainTarget.call(this, title); }
  private async createClientFor(target: ChainTarget = this.selectedSpace()) { return createClientFor.call(this, target); }
  private withCoreAddress(signer: Signer, networkId: number): Signer { return withCoreAddress.call(this, signer, networkId); }
  private deriveRunningNodeAccounts(): AccountTreeRecord[] { return deriveRunningNodeAccounts.call(this); }
  private async walletSignerFor(target: ChainTarget): Promise<Signer> { return walletSignerFor.call(this, target); }
  private async ensureUnlockedWallet(): Promise<OpenLocalWalletResult> { return ensureUnlockedWallet.call(this); }
  private async refreshAll(): Promise<void> { return refreshAll.call(this); }
  private async buildSnapshot(): Promise<ViewSnapshot> { return buildSnapshot.call(this); }
  private async populateAccountBalances(accounts: AccountTreeRecord[]): Promise<void> { return populateAccountBalances.call(this, accounts); }
  private async selectNetwork(network?: NetworkSelection): Promise<void> { return selectNetwork.call(this, network); }
  private async initializeWallet(): Promise<void> { return initializeWallet.call(this); }
  private async addWallet(): Promise<void> { return addWallet.call(this); }
  private async selectWallet(target?: WalletCommandTarget): Promise<void> { return selectWallet.call(this, target); }
  private async removeWallet(target?: WalletCommandTarget): Promise<void> { return removeWallet.call(this, target); }
  private async lockKeystore(): Promise<void> { return lockKeystore.call(this); }
  private async rotateKeystorePassphrase(): Promise<void> { return rotateKeystorePassphrase.call(this); }
  private sanitizeAccountName(label: string): string { return sanitizeAccountName.call(this, label); }
  private async unlockKeystore(target?: WalletCommandTarget): Promise<void> { return unlockKeystore.call(this, target); }
  private async startRuntime(): Promise<void> { return startRuntime.call(this); }
  private async getOrCreateNodeMnemonic(): Promise<string> { return getOrCreateNodeMnemonic.call(this); }
  private async startNode(): Promise<void> { return startNode.call(this); }
  private async stopNode(): Promise<void> { return stopNode.call(this); }
  private async restartNode(): Promise<void> { return restartNode.call(this); }
  private async wipeNode(): Promise<void> { return wipeNode.call(this); }
  private async wipeNodeAndRestart(): Promise<void> { return wipeNodeAndRestart.call(this); }
  private async mineBlocks(): Promise<void> { return mineBlocks.call(this); }
  private async startMining(): Promise<void> { return startMining.call(this); }
  private async stopMining(): Promise<void> { return stopMining.call(this); }
  private async showAccountsQuickPick(): Promise<void> { return showAccountsQuickPick.call(this); }
  private async showContractsQuickPick(): Promise<void> { return showContractsQuickPick.call(this); }
  private async copyAddress(address?: string): Promise<void> { return copyAddress.call(this, address); }
  private async deployContractCommand(): Promise<void> { return deployContractCommand.call(this); }
  private async importContractCommand(): Promise<void> { return importContractCommand.call(this); }
  private async pickTemplateArtifact(): Promise<Artifact | null> { return pickTemplateArtifact.call(this); }
  private async pickWorkspaceArtifact(): Promise<Artifact | null> { return pickWorkspaceArtifact.call(this); }
  private async promptConstructorArgs(artifact: Artifact): Promise<unknown[] | null> { return promptConstructorArgs.call(this, artifact); }
  private async abiCallRead( fn: AbiFunctionTreeRecord, contract: ContractTreeRecord, ): Promise<void> { return abiCallRead.call(this, fn, contract); }
  private async abiCallWrite( fn: AbiFunctionTreeRecord, contract: ContractTreeRecord, ): Promise<void> { return abiCallWrite.call(this, fn, contract); }
  private async promptAbiArgs(fn: AbiFunctionTreeRecord): Promise<unknown[] | null> { return promptAbiArgs.call(this, fn); }
  private abiArgsPlaceholder(inputs: ReadonlyArray<{ name?: string; type: string }>): string { return abiArgsPlaceholder.call(this, inputs); }
  private placeholderForSolidityType(type: string): string { return placeholderForSolidityType.call(this, type); }
  private async promptPayableValue(): Promise<bigint | undefined | null> { return promptPayableValue.call(this); }
  private parseArgValue(value: string, solidityType: string): unknown { return parseArgValue.call(this, value, solidityType); }
}

let runtime: ExtensionRuntime | null = null;
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  runtime = new ExtensionRuntime(context);
  context.subscriptions.push(runtime);
  await runtime.activate();
}

export async function deactivate(): Promise<void> {
  // Await the node stop so ports are released before VS Code restarts the
  // extension host (e.g. after a reload). Swallow errors so deactivation
  // always completes cleanly.
  await runtime?.stopNodeForDeactivation();
  runtime?.dispose();
  runtime = null;
}
