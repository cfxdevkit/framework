import type { Address, Hex, Signer } from '@cfxdevkit/core';
import { KeystoreError } from '@cfxdevkit/core';
import { coreAddressFromPrivateKey } from '@cfxdevkit/core/wallet';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { KeystoreProvider, SecretRef, StoredSecret } from '../keystore/index.js';
import type {
  EmbeddedWallet,
  EmbeddedWalletManager as EmbeddedWalletManagerInterface,
  EmbeddedWalletManagerOptions,
} from './types.js';

const DEFAULT_SERVICE = 'cfxdevkit-embedded-wallet';
const DEFAULT_CORE_NETWORK_ID = 1029;

export class KeystoreEmbeddedWalletManager implements EmbeddedWalletManagerInterface {
  readonly #provider: KeystoreProvider;
  readonly #service: string;
  readonly #coreNetworkId: number;

  constructor(options: EmbeddedWalletManagerOptions) {
    this.#provider = options.provider;
    this.#service = options.service ?? DEFAULT_SERVICE;
    this.#coreNetworkId = options.coreNetworkId ?? DEFAULT_CORE_NETWORK_ID;
  }

  async createWallet(userId: string, _password?: string): Promise<EmbeddedWallet> {
    ensureWritable(this.#provider);
    const ref = this.refFor(userId);
    if (await this.#provider.has(ref)) return this.getWallet(userId);

    const privateKey = generatePrivateKey() as Hex;
    const account = privateKeyToAccount(privateKey);
    const coreAddress = coreAddressFromPrivateKey(privateKey, this.#coreNetworkId);
    const createdAt = Date.now();

    await this.#provider.put?.({
      ref,
      kind: 'private-key',
      secret: privateKey,
      meta: {
        userId,
        espaceAddress: account.address,
        coreAddress,
        createdAt: String(createdAt),
      },
    });

    return {
      userId,
      ref,
      espaceAddress: account.address,
      coreAddress,
      createdAt,
    };
  }

  hasWallet(userId: string): Promise<boolean> {
    return this.#provider.has(this.refFor(userId));
  }

  async getWallet(userId: string): Promise<EmbeddedWallet> {
    const ref = this.refFor(userId);
    const stored = (await this.#provider.list({ service: this.#service })).find(
      (secret) => secret.ref.account === ref.account,
    );
    if (!stored) throw notFound(ref);
    return walletFromStored(stored);
  }

  signerFor(userId: string, _password?: string): Promise<Signer> {
    return this.#provider.getSigner(this.refFor(userId));
  }

  async deleteWallet(userId: string, _password?: string): Promise<void> {
    if (!this.#provider.remove) {
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: 'keystore provider does not support deleting embedded wallets',
      });
    }
    await this.#provider.remove(this.refFor(userId));
  }

  refFor(userId: string): SecretRef {
    const normalized = userId.trim();
    if (!normalized) {
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: 'userId must not be empty',
      });
    }
    return { service: this.#service, account: normalized };
  }
}

export function createEmbeddedWalletManager(
  options: EmbeddedWalletManagerOptions,
): KeystoreEmbeddedWalletManager {
  return new KeystoreEmbeddedWalletManager(options);
}

function ensureWritable(provider: KeystoreProvider): void {
  if (!provider.put) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: 'keystore provider does not support creating embedded wallets',
    });
  }
}

function walletFromStored(stored: StoredSecret): EmbeddedWallet {
  const meta = stored.meta ?? {};
  const userId = meta.userId ?? stored.ref.account;
  const espaceAddress = meta.espaceAddress as Address | undefined;
  const coreAddress = meta.coreAddress;
  if (!espaceAddress || !coreAddress) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: `embedded wallet metadata is incomplete for ${stored.ref.service}/${stored.ref.account}`,
    });
  }
  return {
    userId,
    ref: stored.ref,
    espaceAddress,
    coreAddress,
    createdAt: Number(meta.createdAt ?? stored.createdAt),
  };
}

function notFound(ref: SecretRef): KeystoreError {
  return new KeystoreError({
    code: 'services/keystore/not-found',
    message: `embedded wallet not found: ${ref.account}`,
    meta: { ref },
  });
}
