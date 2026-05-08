// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, readFileKeystoreMnemonic, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './shared.js';

export async function readDeployments(this: ExtensionRuntime): Promise<DeploymentRecord[]> {
  try {
    const text = await fs.readFile(this.deploymentsPath(), 'utf8');
    const data = JSON.parse(text) as DeploymentRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeDeployments(
  this: ExtensionRuntime,
  records: DeploymentRecord[],
): Promise<void> {
  await this.ensureWorkspaceDir();
  await fs.writeFile(this.deploymentsPath(), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
}

export function chainsFor(
  this: ExtensionRuntime,
  network: NetworkSelection,
): { espace: ChainConfig; core: ChainConfig } {
  switch (network) {
    case 'mainnet':
      return { espace: espaceMainnet, core: coreSpaceMainnet };
    case 'testnet':
      return { espace: espaceTestnet, core: coreSpaceTestnet };
    default:
      return { espace: espaceLocal, core: coreSpaceLocal };
  }
}

export function currentChains(this: ExtensionRuntime): { espace: ChainConfig; core: ChainConfig } {
  return this.chainsFor(this.selectedNetwork());
}

export function currentChain(
  this: ExtensionRuntime,
  target: ChainTarget = this.selectedSpace(),
): ChainConfig {
  const chains = this.currentChains();
  return target === 'core' ? chains.core : chains.espace;
}

export function selectedNetworkLabel(this: ExtensionRuntime): string {
  return NETWORKS.find((option) => option.network === this.selectedNetwork())?.label ?? 'Local';
}

export async function pickChainTarget(
  this: ExtensionRuntime,
  title: string,
): Promise<ChainTarget | null> {
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

export async function createClientFor(
  this: ExtensionRuntime,
  target: ChainTarget = this.selectedSpace(),
) {
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

export function withCoreAddress(this: ExtensionRuntime, signer: Signer, networkId: number): Signer {
  return {
    ...signer,
    account: {
      ...signer.account,
      coreAddress: hexToBase32(signer.account.address as `0x${string}`, networkId),
    },
  };
}

export function deriveRunningNodeAccounts(this: ExtensionRuntime): AccountTreeRecord[] {
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

export async function walletSignerFor(
  this: ExtensionRuntime,
  target: ChainTarget,
): Promise<Signer> {
  const signer = (await this.ensureUnlockedWallet()).signer;
  if (this.selectedNetwork() === 'local' && this.node?.isRunning()) {
    const accountIndex = this.selectedAccountIndex();
    const fundedAccount = this.node.accounts[accountIndex];
    if (!fundedAccount) {
      throw new Error(
        `The local node exposes ${this.node.accounts.length} funded account(s), but account #${accountIndex} is selected. Increase cfxdevkit.nodeAccounts or select a lower account index.`,
      );
    }

    if (fundedAccount.evmAddress.toLowerCase() !== signer.account.address.toLowerCase()) {
      const action = await vscode.window.showWarningMessage(
        'The running local node was started from a different wallet. Restart it from the active wallet before deploying.',
        'Restart Node',
      );
      if (action !== 'Restart Node') {
        throw new Error('Restart the local node from the active wallet before deploying.');
      }
      await this.node.stop();
      this.node = null;
      await this.startNode();
    }
  }
  if (target === 'core') {
    return this.withCoreAddress(signer, this.currentChains().core.id);
  }
  return signer;
}

export async function ensureUnlockedWallet(this: ExtensionRuntime): Promise<OpenLocalWalletResult> {
  const provider = await this.ensureFileKeystoreUnlocked();
  const wallets = await provider.list({ service: KEYSTORE_SERVICE });
  const mnemonicRoots = wallets.filter((wallet) => wallet.kind === 'mnemonic');
  if (!mnemonicRoots.length)
    throw new Error('Add a mnemonic wallet to the selected keystore first.');

  const selected = this.selectedFileRef();
  const ref = mnemonicRoots.some((wallet) => this.refKey(wallet.ref) === this.refKey(selected))
    ? selected
    : mnemonicRoots[0]?.ref;
  if (!ref) throw new Error('Add a mnemonic wallet to the selected keystore first.');
  if (this.refKey(ref) !== this.refKey(selected)) {
    await this.context.workspaceState.update(STATE_ACTIVE_FILE_REF, ref);
  }

  try {
    const signer = await provider.getSigner(ref, this.currentCapability(), {
      derivationPath: this.derivationPath(),
    });
    if (this.unlockedPassphrase) {
      this.localNodeMnemonic = await readFileKeystoreMnemonic({
        path: this.keystorePath(),
        passphrase: this.unlockedPassphrase,
        ref,
      });
    }
    return { provider, signer, ref, path: this.keystorePath() };
  } catch (error) {
    this.unlockedPassphrase = null;
    this.fileProvider = null;
    throw error;
  }
}
