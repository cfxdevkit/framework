import { deriveAccount } from '@cfxdevkit/core';
import type { SecretRef, StoredSecret } from '@cfxdevkit/services/keystore';
import type { RevealedSecret, WalletSummary } from '../keystore.js';

export const WALLET_SERVICE = 'cfxdevkit';
export const META_SERVICE = 'cfxdevkit-meta';
export const META_NAME_KEY = 'name';
export const META_ACTIVE_KEY = 'active';
export const META_ACCOUNT_COUNT_KEY = 'accountCount';
export const META_ACTIVE_ACCOUNT_INDEX_KEY = 'activeAccountIndex';
export const META_DERIVATION_BASE_KEY = 'derivationBase';
export const META_FIRST_ADDRESS_KEY = 'firstAddress';
export const UNLOCK_PROBE_REF: SecretRef = { service: META_SERVICE, account: 'unlock-probe' };
export const DEFAULT_ACCOUNT_COUNT = 5;
export const DEFAULT_DERIVATION_BASE = "m/44'/60'/0'/0";
export const DEFAULT_REVEAL_TTL_MS = 60_000;
export const REVEAL_WARNING =
  'This token reveals protected secret material. Consume it immediately; it expires and cannot be reused.';

export function isMnemonicSecret(secret: StoredSecret): boolean {
  return secret.kind === 'mnemonic';
}

export function walletRef(id: string): SecretRef {
  return { service: WALLET_SERVICE, account: id };
}

export function walletMeta(
  secret: StoredSecret,
  patch: Record<string, string>,
): Record<string, string> {
  return { ...(secret.meta ?? {}), ...patch };
}

export function isActiveWallet(secret: StoredSecret): boolean {
  return secret.meta?.[META_ACTIVE_KEY] === 'true';
}

export function toWalletSummary(secret: StoredSecret): WalletSummary {
  return {
    id: secret.ref.account,
    name: secret.meta?.[META_NAME_KEY] ?? secret.ref.account,
    active: isActiveWallet(secret),
    accountCount: walletAccountCount(secret),
    activeAccountIndex: walletActiveAccountIndex(secret),
    derivationBase: walletDerivationBase(secret),
    ...(secret.meta?.[META_FIRST_ADDRESS_KEY]
      ? { firstAddress: secret.meta[META_FIRST_ADDRESS_KEY] }
      : {}),
  };
}

export function walletAccountCount(secret: StoredSecret): number {
  const raw = Number(secret.meta?.[META_ACCOUNT_COUNT_KEY] ?? 1);
  if (!Number.isInteger(raw) || raw < 1) return 1;
  return Math.min(raw, 50);
}

export function walletActiveAccountIndex(secret: StoredSecret): number {
  const raw = Number(secret.meta?.[META_ACTIVE_ACCOUNT_INDEX_KEY] ?? 0);
  if (!Number.isInteger(raw) || raw < 0) return 0;
  return Math.min(raw, Math.max(0, walletAccountCount(secret) - 1));
}

export function walletDerivationBase(secret: StoredSecret): string {
  const raw = secret.meta?.[META_DERIVATION_BASE_KEY]?.trim();
  return raw ? raw : DEFAULT_DERIVATION_BASE;
}

export function walletDerivationPath(secret: StoredSecret, index: number): string {
  return `${walletDerivationBase(secret)}/${index}`;
}

export function assertAccountIndex(secret: StoredSecret, accountIndex: number): void {
  if (
    !Number.isInteger(accountIndex) ||
    accountIndex < 0 ||
    accountIndex >= walletAccountCount(secret)
  ) {
    throw new Error(`account index out of range: ${accountIndex}`);
  }
}

export function normalizeAccountCount(value: number | undefined): number {
  if (value === undefined) return DEFAULT_ACCOUNT_COUNT;
  if (!Number.isInteger(value) || value < 1 || value > 50) {
    throw new Error('accountCount must be an integer between 1 and 50');
  }
  return value;
}

export function normalizeDerivationBase(value: string | undefined): string {
  const derivationBase = value?.trim() ?? DEFAULT_DERIVATION_BASE;
  if (!derivationBase) {
    throw new Error('derivationBase is required');
  }
  return derivationBase;
}

export function normalizeRevealTtl(value: number | undefined): number {
  if (value === undefined) return DEFAULT_REVEAL_TTL_MS;
  if (!Number.isInteger(value) || value < 1_000 || value > 5 * 60_000) {
    throw new Error('ttlMs must be an integer between 1000 and 300000');
  }
  return value;
}

export function createPrivateKeyReveal(
  wallet: StoredSecret,
  mnemonic: string,
  walletId: string,
  requestedIndex: number | undefined,
): RevealedSecret {
  const accountIndex = requestedIndex ?? walletActiveAccountIndex(wallet);
  assertAccountIndex(wallet, accountIndex);
  const derivationPath = walletDerivationPath(wallet, accountIndex);
  const derived = deriveAccount({ mnemonic, path: derivationPath });

  return {
    kind: 'private-key',
    walletId,
    privateKey: derived.privateKey,
    address: derived.account.address,
    ...(derived.account.coreAddress ? { coreAddress: derived.account.coreAddress } : {}),
    derivationPath,
    accountIndex,
  };
}

export function normalizeUnlockError(error: unknown): Error {
  if (error instanceof Error && /not found/i.test(error.message)) {
    return new Error('keystore unlock probe is missing or corrupted');
  }
  return new Error('invalid passphrase or corrupted keystore');
}
