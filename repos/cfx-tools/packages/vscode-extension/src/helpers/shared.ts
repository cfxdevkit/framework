// @ts-nocheck

import { createConfluxDevkitClient } from '@cfxdevkit/client';

export { promises as fs } from 'node:fs';
export { isAbsolute, join, relative } from 'node:path';
export { hexToBase32 } from '@cfxdevkit/cdk/address';
export {
  type ChainConfig,
  coreSpaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  espaceLocal,
  espaceMainnet,
  espaceTestnet,
} from '@cfxdevkit/cdk/chains';
export {
  type CoreSpaceClient,
  createClient,
  type EspaceClient,
  http,
} from '@cfxdevkit/cdk/client';
export { formatCFX } from '@cfxdevkit/cdk/units';
export {
  coreAddressFromPrivateKey,
  deriveAccount,
  generateMnemonic,
  type Signer,
  validateMnemonic,
} from '@cfxdevkit/cdk/wallet';
export { type Artifact, compile, listTemplates, npmResolver } from '@cfxdevkit/compiler';
export { deployContract } from '@cfxdevkit/contracts/deploy';
export { readContract } from '@cfxdevkit/contracts/read';
export { sendWrite, waitForReceipt } from '@cfxdevkit/contracts/write';
export { createAppendOnlyAuditLogger } from '@cfxdevkit/services';
export type { KeystoreProvider, SecretRef, StoredSecret } from '@cfxdevkit/services/keystore';
export {
  createFileKeystore,
  initFileKeystore,
  readFileKeystoreMnemonic,
} from '@cfxdevkit/services/keystore-file';
export { type OneKeySdkLike, signerFromOneKey } from '@cfxdevkit/wallet/hardware/onekey';
export { signerFromSatochip } from '@cfxdevkit/wallet/hardware/satochip';
export { type OpenLocalWalletResult, rotateLocalPassphrase } from '@cfxdevkit/wallet/init';
export * as vscode from 'vscode';
export {
  type AbiFunctionTreeRecord,
  type AccountTreeRecord,
  type ContractTreeRecord,
  makeAccountItems,
  makeContractItems,
  makeMainItems,
  makeNetworkItems,
  makeNetworkNodeRow,
  makeNodeItems,
  StaticTreeProvider,
  type ViewSnapshot,
  type WalletRootRecord,
} from '../views.js';

export type { vscode };

export type NetworkSelection = 'local' | 'testnet' | 'mainnet';
export type ChainTarget = 'espace' | 'core';
export type KeystoreBackend = 'file' | 'onekey' | 'satoshi';

export interface NetworkOption {
  network: NetworkSelection;
  label: string;
  description: string;
  coreChainId: number;
  espaceChainId: number;
}

export interface DeploymentRecord {
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

export const STATE_NETWORK = 'cfxdevkit.selectedNetwork';
export const STATE_SPACE = 'cfxdevkit.selectedSpace';
export const STATE_KEYSTORE_BACKEND = 'cfxdevkit.selectedKeystoreBackend';
export const STATE_ACTIVE_FILE_REF = 'cfxdevkit.activeMnemonicRootRef';
export const STATE_ACTIVE_ACCOUNT_INDEX = 'cfxdevkit.activeMnemonicAccountIndex';
export const KEYSTORE_SERVICE = 'cfxdevkit';
export const DERIVATION_BASE = "m/44'/60'/0'/0";

export const NETWORKS: readonly NetworkOption[] = [
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

export const BACKEND_LABELS: Record<KeystoreBackend, string> = {
  file: 'File',
  onekey: 'OneKey',
  satoshi: 'Satochip',
};

export function createSharedNodeRuntime(config: {
  accounts?: number;
  dataDir: string;
  logging?: boolean;
  mnemonic: string;
}) {
  const baseUrl = process.env.CFXDEVKIT_DEVNODE_SERVER_URL?.trim() ?? `http://127.0.0.1:52000`;
  const client = createConfluxDevkitClient({ baseUrl });
  let snapshot = { status: 'stopped', running: false, accounts: [] };

  const refresh = async (responsePromise) => {
    const response = await responsePromise;
    snapshot = response.node;
    return snapshot;
  };

  return {
    get accounts() {
      return snapshot.accounts ?? [];
    },
    get urls() {
      return snapshot.urls;
    },
    isRunning: () => Boolean(snapshot.running),
    mine: (blocks: number) => refresh(client.node.mine({ blocks })),
    packMine: () => refresh(client.node.mine({ pack: true })),
    restart: () => refresh(client.node.restart()),
    start: () => refresh(client.node.start({ config })),
    startMining: (intervalMs: number) => client.mining.start({ intervalMs }),
    stop: () => refresh(client.node.stop()),
    stopMining: () => client.mining.stop(),
    wipe: (restart = false) => refresh(client.node.wipe({ config, restart })),
  };
}

export interface CachedSigner {
  backend: KeystoreBackend;
  signer: Signer;
}

export interface WalletCommandTarget {
  walletRef?: SecretRef;
  accountIndex?: number;
}

/** Format a drip-scale bigint balance to a CFX decimal string for display. */
export function formatBalance(value: bigint): string {
  const cfx = formatCFX(value);
  // Trim trailing zeros after decimal point for readability
  const trimmed = cfx.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return `${trimmed} CFX`;
}

/**
 * Check whether an absolute `path` is located inside `workspaceRoot`.
 * Both arguments must be absolute paths.
 */
export function isInsideWorkspace(path: string, workspaceRoot: string): boolean {
  const root = workspaceRoot.endsWith('/') ? workspaceRoot : `${workspaceRoot}/`;
  return path === workspaceRoot || path.startsWith(root);
}

/**
 * Thin wrapper around `import()` for optional/runtime dependencies
 * (e.g. hardware-wallet SDKs that may not be installed).
 */
export async function dynamicImport(moduleName: string): Promise<unknown> {
  return import(moduleName);
}

/**
 * Stringify any contract-read result to a human-readable string.
 * BigInt values are serialised with a trailing `n` suffix.
 */
export function stringifyResult(value: unknown): string {
  return (
    JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? `${val}n` : val), 2) ??
    String(value)
  );
}
