import type { Address, Hex } from '@cfxdevkit/core';
import type { AuditLogger, SecretRef, StoredSecret } from '../index.js';

export interface LedgerTransportLike {
  exchange(apdu: Buffer | Uint8Array): Promise<Buffer | Uint8Array>;
  send?(
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data?: Buffer | Uint8Array,
    statusList?: number[],
  ): Promise<Buffer | Uint8Array>;
  close?(): Promise<void> | void;
}

export interface LedgerAddressResponse {
  address: string;
  publicKey?: string;
  chainCode?: string;
}

export interface LedgerSignatureResponse {
  r: string;
  s: string;
  v: string | number;
}

export interface LedgerEthAppLike {
  getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    chainId?: number | string,
  ): Promise<LedgerAddressResponse>;
  signTransaction(
    path: string,
    rawTxHex: string,
    resolution?: unknown,
  ): Promise<LedgerSignatureResponse>;
  signPersonalMessage(path: string, messageHex: string): Promise<LedgerSignatureResponse>;
  signEIP712Message?(path: string, typedData: unknown): Promise<LedgerSignatureResponse>;
  signEIP712HashedMessage?(
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ): Promise<LedgerSignatureResponse>;
}

export interface LedgerAccountConfig {
  ref: SecretRef;
  family?: 'espace' | 'core';
  path?: string;
  chainId?: number | string;
  coreNetworkId?: number;
  expectedAddress?: Address;
  showAddressOnDevice?: boolean;
  createdAt?: number;
  meta?: Record<string, string>;
}

export interface LedgerKeystoreOptions {
  eth?: LedgerEthAppLike;
  coreTransport?: LedgerTransportLike;
  accounts?: LedgerAccountConfig[];
  defaultPath?: string;
  defaultChainId?: number;
  audit?: AuditLogger;
}

export interface SignerFromLedgerInput {
  eth?: LedgerEthAppLike;
  coreTransport?: LedgerTransportLike;
  family?: 'espace' | 'core';
  path?: string;
  chainId?: number | string;
  coreNetworkId?: number;
  expectedAddress?: Address;
  showAddressOnDevice?: boolean;
}

export interface ResolvedLedgerAccount {
  ref: SecretRef;
  family: 'espace' | 'core';
  path: string;
  chainId?: number | string;
  coreNetworkId?: number;
  expectedAddress?: Address;
  showAddressOnDevice: boolean;
  stored: StoredSecret;
}

export interface LedgerSignature {
  r: Hex;
  s: Hex;
  v: number;
}
