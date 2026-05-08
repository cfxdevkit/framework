import type { Address, Signer } from '@cfxdevkit/core';
import type { KeystoreProvider, SecretRef } from '../keystore/index.js';

export interface EmbeddedWallet {
  userId: string;
  ref: SecretRef;
  espaceAddress: Address;
  coreAddress: string;
  createdAt: number;
}

export interface EmbeddedWalletManagerOptions {
  provider: KeystoreProvider;
  service?: string;
  coreNetworkId?: number;
}

export interface EmbeddedWalletManager {
  createWallet(userId: string, password?: string): Promise<EmbeddedWallet>;
  hasWallet(userId: string): Promise<boolean>;
  getWallet(userId: string): Promise<EmbeddedWallet>;
  signerFor(userId: string, password?: string): Promise<Signer>;
  deleteWallet(userId: string, password?: string): Promise<void>;
}
