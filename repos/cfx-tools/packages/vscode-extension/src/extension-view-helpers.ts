// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeMainItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export async function refreshAll(this: ExtensionRuntime): Promise<void> {
  const snapshot = await this.buildSnapshot();
  this.mainProvider.setItems(makeMainItems(snapshot));
  this.networkStatus.text = `$(globe) ${this.selectedNetworkLabel()}`;
  this.nodeStatus.text = `$(server) ${snapshot.nodeStatusLabel}`;
  this.nodeStatus.tooltip = 'Conflux local node status';
  await vscode.commands.executeCommand(
    'setContext',
    'cfxdevkit.nodeRunning',
    this.node?.isRunning() ?? false,
  );
}

export async function buildSnapshot(this: ExtensionRuntime): Promise<ViewSnapshot> {
  const deployments = await this.readDeployments();
  const accounts: AccountTreeRecord[] = [];
  const walletRoots: WalletRootRecord[] = [];
  const keystoreExists = await this.keystoreExists();
  const unlockedProvider = this.unlockedPassphrase
    ? this.fileKeystore(this.unlockedPassphrase)
    : null;
  let keystoreLocked = true;

  if (keystoreExists) {
    const wallets = await this.listFileWallets().catch(() => []);
    const activeRef = this.selectedFileRef();
    const activeIndex = this.selectedAccountIndex();
    keystoreLocked = wallets.length > 0 && !unlockedProvider;

    for (const wallet of wallets) {
      const isActive = this.refKey(wallet.ref) === this.refKey(activeRef);
      const label = wallet.meta?.label ?? wallet.ref.account;
      const baseDetail = `File keystore: ${this.keystorePathLabel()}\nRef: ${this.refKey(wallet.ref)}`;
      const accountCount = Math.max(1, Number(wallet.meta?.accountCount ?? '1'));
      walletRoots.push({
        label,
        ref: wallet.ref,
        description: `${accountCount} account${accountCount === 1 ? '' : 's'}`,
        detail: `${baseDetail}\n${accountCount} derived account${accountCount === 1 ? '' : 's'}\nSelect the wallet to choose its active account.`,
        active: isActive,
        state: unlockedProvider ? 'ready' : 'locked',
      });

      if (!unlockedProvider) continue;
      try {
        for (let index = 0; index < accountCount; index++) {
          const signer = await unlockedProvider.getSigner(wallet.ref, this.currentCapability(), {
            derivationPath: this.derivationPath(index),
          });
          const coreAddress = hexToBase32(
            signer.account.address as `0x${string}`,
            this.currentChains().core.id,
          );
          const selected = isActive && index === activeIndex;
          accounts.push({
            label: `${label} #${index}${selected ? ' (active)' : ''}`,
            description: signer.account.address,
            walletRef: wallet.ref,
            accountIndex: index,
            espaceAddress: signer.account.address,
            coreAddress,
            detail: `${baseDetail}\nPath: ${this.derivationPath(index)}\neSpace: ${signer.account.address}\nCore: ${coreAddress}`,
            state: 'ready',
          });
        }
      } catch {
        this.unlockedPassphrase = null;
        this.fileProvider = null;
        keystoreLocked = true;
      }
    }
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
    selectedNetwork: this.selectedNetwork(),
    selectedNetworkLabel: this.selectedNetworkLabel(),
    selectedSpaceLabel: this.selectedSpace() === 'core' ? 'Core Space' : 'eSpace',
    keystoreLocked,
    nodeRunning: this.node?.isRunning() ?? false,
    walletRoots,
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
    accounts,
    contracts,
  };
}

export async function populateAccountBalances(
  this: ExtensionRuntime,
  accounts: AccountTreeRecord[],
): Promise<void> {
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
