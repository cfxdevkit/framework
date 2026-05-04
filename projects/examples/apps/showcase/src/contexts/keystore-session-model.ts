import type { Address, Hex, Signer } from '@cfxdevkit/core';
import { coreAddressFromPrivateKey, deriveAccount, validateMnemonic } from '@cfxdevkit/core';
import type { Capability, SecretRef, StoredSecret } from '@cfxdevkit/services/keystore';

export const DEFAULT_SHOWCASE_MNEMONIC =
  'test test test test test test test test test test test junk';
export const SERVICE = 'showcase';

export type KeystoreSessionStatus = 'unconfigured' | 'locked' | 'unlocking' | 'ready' | 'error';

export interface ShowcaseAccount {
  index: number;
  ref: SecretRef;
  evmAddress: Address;
  coreAddress: string;
  privateKey: Hex;
  publicKey: Hex;
  paths: { evm: string; core: string };
}

export interface KeystoreSessionState {
  status: KeystoreSessionStatus;
  backendId: string;
  networkId: 'mainnet' | 'testnet' | 'local';
  chainIds: readonly number[];
  wallets: readonly StoredSecret[];
  accounts: readonly ShowcaseAccount[];
  activeWalletRef: SecretRef | null;
  activeIndex: number | null;
  active: ShowcaseAccount | null;
  activeRef: SecretRef | null;
  activeSigner: Signer | null;
  capability: Capability;
  sessionId: string;
  mnemonic: string;
  accountCount: number;
  error: string | null;
  setMnemonic: (mnemonic: string) => void;
  createMnemonic: () => void;
  resetMnemonic: () => void;
  setAccountCount: (count: number) => void;
  addWallet: () => void;
  selectMnemonic: (ref: SecretRef) => void;
  selectWallet: (index: number) => void;
  disconnect: () => void;
  removeWallet: (ref: SecretRef) => Promise<void>;
  restoreRemovedWallets: () => void;
  signMessage: (
    ref: SecretRef,
    message: string,
    capability?: Capability,
  ) => Promise<{ account: string; signature: Hex }>;
  refreshWallets: () => Promise<void>;
}

export function refForIndex(index: number): SecretRef {
  return { service: SERVICE, account: `mnemonic-${index}` };
}

export function accountRefForIndex(index: number): SecretRef {
  return { service: SERVICE, account: `account-${index}` };
}

export function refKey(ref: SecretRef): string {
  return `${ref.service}/${ref.account}`;
}

export function refFromKey(key: string): SecretRef {
  const [service, account] = key.split('/');
  return { service: service ?? SERVICE, account: account ?? 'mnemonic-0' };
}

export function deriveAccounts(
  mnemonic: string,
  count: number,
  coreNetworkId: number,
): ShowcaseAccount[] {
  const clean = mnemonic.trim();
  if (!validateMnemonic(clean)) return [];
  const accounts: ShowcaseAccount[] = [];
  for (let index = 0; index < count; index++) {
    const path = `m/44'/60'/0'/0/${index}`;
    const { account, privateKey } = deriveAccount({ mnemonic: clean, path });
    accounts.push({
      index,
      ref: accountRefForIndex(index),
      evmAddress: account.address,
      coreAddress: coreAddressFromPrivateKey(privateKey, coreNetworkId),
      privateKey,
      publicKey: account.publicKey,
      paths: { evm: path, core: path },
    });
  }
  return accounts;
}
