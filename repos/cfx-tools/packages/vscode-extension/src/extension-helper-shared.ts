// @ts-nocheck
export { promises as fs } from 'node:fs';
export { isAbsolute, join, relative } from 'node:path';
export { type Artifact, compile, listTemplates, npmResolver } from '@cfxdevkit/compiler';
export { deployContract } from '@cfxdevkit/contracts/deploy';
export { readContract } from '@cfxdevkit/contracts/read';
export { sendWrite } from '@cfxdevkit/contracts/write';
export { hexToBase32 } from '@cfxdevkit/core/address';
export {
  type ChainConfig,
  coreSpaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  espaceLocal,
  espaceMainnet,
  espaceTestnet,
} from '@cfxdevkit/core/chains';
export {
  type CoreSpaceClient,
  createClient,
  type EspaceClient,
  http,
} from '@cfxdevkit/core/client';
export { formatCFX } from '@cfxdevkit/core/units';
export {
  coreAddressFromPrivateKey,
  deriveAccount,
  generateMnemonic,
  type Signer,
  validateMnemonic,
} from '@cfxdevkit/core/wallet';
export { createDevNode, type DevNode } from '@cfxdevkit/devnode';
export { createAppendOnlyAuditLogger } from '@cfxdevkit/services';
export type { KeystoreProvider, SecretRef, StoredSecret } from '@cfxdevkit/services/keystore';
export { createFileKeystore, initFileKeystore } from '@cfxdevkit/services/keystore-file';
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
  makeNetworkItems,
  makeNodeItems,
  StaticTreeProvider,
  type ViewSnapshot,
  type WalletRootRecord,
} from './views.js';

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

export interface CachedSigner {
  backend: KeystoreBackend;
  signer: Signer;
}

export interface WalletCommandTarget {
  walletRef?: SecretRef;
  accountIndex?: number;
}
