import { deriveAccount } from '@cfxdevkit/core';
import type { SecretRef, StoredSecret } from '@cfxdevkit/services/keystore';
import type { RevealedSecret, WalletSummary } from '../keystore.js';

export const WALLET_SERVICE = 'cfxdevkit';
export const META_SERVICE = 'cfxdevkit-meta';
export const META_NAME_KEY = 'name';
export const META_ACTIVE_KEY = 'active';
export const META_ACCOUNT_COUNT_KEY = 'accountCount';
export const META_ACTIVE_ACCOUNT_INDEX_KEY = 'activeAccountIndex';
export const META_ACCOUNT_TYPE_KEY = 'accountType';
export const META_FIRST_ESPACE_ADDRESS_KEY = 'firstEspaceAddress';
export const UNLOCK_PROBE_REF: SecretRef = { service: META_SERVICE, account: 'unlock-probe' };
export const DEFAULT_ACCOUNT_COUNT = 5;
export type AccountType = 'standard' | 'mining';
export const DEFAULT_ACCOUNT_TYPE: AccountType = 'standard';
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
    accountType: walletAccountType(secret),
    ...(secret.meta?.[META_FIRST_ESPACE_ADDRESS_KEY]
      ? { firstEspaceAddress: secret.meta[META_FIRST_ESPACE_ADDRESS_KEY] }
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

export function walletAccountType(secret: StoredSecret): AccountType {
  const raw = secret.meta?.[META_ACCOUNT_TYPE_KEY];
  if (raw === 'standard' || raw === 'mining') return raw;
  // Legacy wallets with old derivationBase metadata default to 'standard'
  return DEFAULT_ACCOUNT_TYPE;
}

export function normalizeAccountType(value: string | undefined): AccountType {
  if (value === 'standard' || value === 'mining') return value;
  return DEFAULT_ACCOUNT_TYPE;
}

function accountTypeSegment(accountType: AccountType): number {
  return accountType === 'standard' ? 0 : 1;
}

export function walletEspacePath(secret: StoredSecret, index: number): string {
  const seg = accountTypeSegment(walletAccountType(secret));
  return `m/44'/60'/${seg}'/0/${index}`;
}

export function walletCorePath(secret: StoredSecret, index: number): string {
  const seg = accountTypeSegment(walletAccountType(secret));
  return `m/44'/503'/${seg}'/0/${index}`;
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
  const espaceDerivationPath = walletEspacePath(wallet, accountIndex);
  const derived = deriveAccount({ mnemonic, path: espaceDerivationPath });

  return {
    kind: 'private-key',
    walletId,
    privateKey: derived.privateKey,
    espaceAddress: derived.account.address,
    espaceDerivationPath,
    accountIndex,
  };
}

export function normalizeUnlockError(error: unknown): Error {
  if (error instanceof Error && /not found/i.test(error.message)) {
    return new Error('keystore unlock probe is missing or corrupted');
  }
  return new Error('invalid passphrase or corrupted keystore');
}
