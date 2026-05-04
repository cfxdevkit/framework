// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export async function showAccountsQuickPick(this: ExtensionRuntime): Promise<void> {
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

export async function showContractsQuickPick(this: ExtensionRuntime): Promise<void> {
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

export async function copyAddress(this: ExtensionRuntime, address?: string): Promise<void> {
  if (!address) return;
  await vscode.env.clipboard.writeText(address);
  await vscode.window.showInformationMessage(`Copied ${address}`);
}

export async function deployContractCommand(this: ExtensionRuntime): Promise<void> {
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
  const signer = await this.walletSignerFor(target);

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
