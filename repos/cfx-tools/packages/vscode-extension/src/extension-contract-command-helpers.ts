// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode, waitForReceipt } from './extension-helper-shared.js';

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

  let artifact: Artifact;
  let templateDefaults:
    | ReadonlyArray<{ name?: string; type?: string; defaultValue?: string }>
    | undefined;

  if (source.value === 'template') {
    const result = await this.pickTemplateArtifact();
    if (!result) return;
    artifact = result.artifact;
    templateDefaults = result.template.constructorArgs;
  } else {
    const picked = await this.pickWorkspaceArtifact();
    if (!picked) return;
    artifact = picked;
  }

  const target = await this.pickChainTarget(`Deploy ${artifact.contractName}`);
  if (!target) return;

  const args = await this.promptConstructorArgs(artifact, templateDefaults);
  if (!args) return;

  const client = await this.createClientFor(target);
  const signer = await this.walletSignerFor(target);

  // Submit the transaction without waiting for receipt so we can immediately
  // trigger a pack-mine on the local node, avoiding the receipt timeout on
  // slow containers where auto-mining may be several seconds away.
  const submitted = await vscode.window.withProgress(
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
        waitForReceipt: false,
      }),
  );

  // On local network, force-pack the transaction immediately so the receipt
  // arrives within the next poll cycle rather than waiting for the auto-miner.
  if (this.selectedNetwork() === 'local' && this.node?.isRunning()) {
    await this.node.packMine().catch(() => {});
  }

  // Wait for the receipt. Use a generous timeout on local (60 s) since the
  // node may need a couple of deferred-execution epochs to confirm.
  const receiptTimeoutMs = this.selectedNetwork() === 'local' ? 60_000 : 120_000;
  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Waiting for ${artifact.contractName} deploy receipt…`,
    },
    () =>
      waitForReceipt(client, submitted.hash, {
        pollIntervalMs: 500,
        timeoutMs: receiptTimeoutMs,
      }),
  );

  const contractAddress =
    (result as unknown as { contractAddress?: string }).contractAddress ?? undefined;
  if (!contractAddress) throw new Error('Deployment completed without a contract address.');

  const deployments = await this.readDeployments();
  deployments.unshift({
    id: `${Date.now()}-${artifact.contractName}`,
    name: artifact.contractName,
    address: contractAddress,
    target,
    network: this.selectedNetwork(),
    chainId: this.currentChain(target).id,
    txHash: submitted.hash,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi as unknown[],
  });
  await this.writeDeployments(deployments);
  this.log(
    `Deployed ${artifact.contractName} to ${this.selectedNetworkLabel()} ${target === 'core' ? 'Core Space' : 'eSpace'} at ${contractAddress}`,
  );
  await vscode.window.showInformationMessage(
    `Deployed ${artifact.contractName} at ${contractAddress}`,
  );
  await this.refreshAll();
}
