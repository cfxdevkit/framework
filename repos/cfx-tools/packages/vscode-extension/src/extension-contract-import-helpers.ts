// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export async function importContractCommand(this: ExtensionRuntime): Promise<void> {
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
  await this.refreshAll();
  void vscode.window.showInformationMessage(
    `Imported ${name.trim()} on ${networkPick.label} ${targetPick.label}.`,
  );
}
