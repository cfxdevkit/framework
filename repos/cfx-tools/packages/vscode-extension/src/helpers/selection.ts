// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './shared.js';

export async function selectNetwork(
  this: ExtensionRuntime,
  network?: NetworkSelection,
): Promise<void> {
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
