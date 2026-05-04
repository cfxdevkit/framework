import { HDKey } from '@scure/bip32';
import {
  mnemonicToSeedSync,
  generateMnemonic as scureGenerateMnemonic,
  validateMnemonic as scureValidateMnemonic,
} from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import { privateKeyToAccount as civePrivateKeyToAccount } from 'cive/accounts';
import { privateKeyToAccount } from 'viem/accounts';
import { WalletError } from '../errors/index.js';
import type { Address, Hex } from '../types/index.js';
import type { Account } from './index.js';

export const DEFAULT_CORE_PATH = "m/44'/503'/0'/0/0" as const;
export const DEFAULT_ESPACE_PATH = "m/44'/60'/0'/0/0" as const;

export function generateMnemonic(strength: 128 | 160 | 192 | 224 | 256 = 128): string {
  return scureGenerateMnemonic(english, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return scureValidateMnemonic(mnemonic.trim(), english);
}

export interface DeriveAccountInput {
  mnemonic: string;
  path?: string;
  passphrase?: string;
}

export interface DerivedAccount {
  account: Account;
  privateKey: Hex;
}

export function deriveAccount(input: DeriveAccountInput): DerivedAccount {
  const { mnemonic, path = DEFAULT_CORE_PATH, passphrase } = input;
  if (!validateMnemonic(mnemonic))
    throw new WalletError({ code: 'core/wallet/derivation', message: 'Invalid BIP-39 mnemonic' });
  const child = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic.trim(), passphrase ?? '')).derive(
    path,
  );
  if (!child.privateKey) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: `Failed to derive private key at path ${path}`,
      meta: { path },
    });
  }
  const privateKey = `0x${bytesToHex(child.privateKey)}` as Hex;
  const viemAccount = privateKeyToAccount(privateKey);
  return {
    account: { address: viemAccount.address, publicKey: viemAccount.publicKey },
    privateKey,
  };
}

export interface DeriveAccountsInput {
  mnemonic: string;
  basePath?: string;
  count: number;
  passphrase?: string;
}

export function deriveAccounts(input: DeriveAccountsInput): DerivedAccount[] {
  const { mnemonic, basePath = "m/44'/503'/0'/0", count, passphrase } = input;
  if (!Number.isInteger(count) || count <= 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'count must be a positive integer',
      meta: { count },
    });
  }
  return Array.from({ length: count }, (_value, index) =>
    deriveAccount({
      mnemonic,
      path: `${basePath}/${index}`,
      ...(passphrase !== undefined ? { passphrase } : {}),
    }),
  );
}

export type CoreNetworkId = 1029 | 1 | 2029 | (number & {});

export function coreAddressFromPrivateKey(
  privateKey: Hex,
  networkId: CoreNetworkId = 1029,
): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'privateKey must be a 0x-prefixed 32-byte hex string',
    });
  }
  try {
    return civePrivateKeyToAccount(privateKey, { networkId }).address;
  } catch (cause) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: cause instanceof Error ? cause.message : String(cause),
      cause,
      meta: { networkId },
    });
  }
}

export interface DualAddressAccount {
  index: number;
  evmAddress: Address;
  coreAddress: string;
  publicKey: Hex;
  privateKey: Hex;
  paths: { evm: string; core: string };
}

export interface DeriveDualAccountInput {
  mnemonic: string;
  index?: number;
  accountType?: 'standard' | 'mining';
  coreNetworkId?: CoreNetworkId;
  passphrase?: string;
}

export function deriveDualAccount(input: DeriveDualAccountInput): DualAddressAccount {
  const { mnemonic, index = 0, accountType = 'standard', coreNetworkId = 1029, passphrase } = input;
  if (!Number.isInteger(index) || index < 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'index must be a non-negative integer',
      meta: { index },
    });
  }
  const accountSegment = accountType === 'standard' ? 0 : 1;
  const evmPath = `m/44'/60'/${accountSegment}'/0/${index}`;
  const corePath = `m/44'/503'/${accountSegment}'/0/${index}`;
  const evm = deriveAccount({
    mnemonic,
    path: evmPath,
    ...(passphrase !== undefined ? { passphrase } : {}),
  });
  const core = deriveAccount({
    mnemonic,
    path: corePath,
    ...(passphrase !== undefined ? { passphrase } : {}),
  });
  return {
    index,
    evmAddress: evm.account.address,
    coreAddress: coreAddressFromPrivateKey(core.privateKey, coreNetworkId),
    publicKey: evm.account.publicKey,
    privateKey: evm.privateKey,
    paths: { evm: evmPath, core: corePath },
  };
}

export function deriveDualAccounts(
  input: DeriveDualAccountInput & { count: number; startIndex?: number },
): DualAddressAccount[] {
  const { count, startIndex = 0, ...rest } = input;
  if (!Number.isInteger(count) || count <= 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'count must be a positive integer',
      meta: { count },
    });
  }
  return Array.from({ length: count }, (_value, index) =>
    deriveDualAccount({ ...rest, index: startIndex + index }),
  );
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let index = 0; index < bytes.length; index++) {
    // biome-ignore lint/style/noNonNullAssertion: bounded loop, byte present
    out += bytes[index]!.toString(16).padStart(2, '0');
  }
  return out;
}
