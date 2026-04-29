/**
 * `@cfxdevkit/wallet/signers` — signer factories.
 *
 * `signerFromKeystore` is the **recommended starting point** for all
 * production code. It delegates to a `KeystoreProvider` so private material
 * stays inside the backend.
 *
 * `readonlySigner` is a placeholder identity (e.g. for simulation or
 * read-only call paths) — every `sign*` call throws.
 */
import type { Address, Signer } from '@cfxdevkit/core';
import type { Capability, KeystoreProvider, SecretRef } from '@cfxdevkit/services/keystore';
import { SessionKeyError } from '../errors/index.js';

export interface SignerFromKeystoreInput {
  provider: KeystoreProvider;
  ref: SecretRef;
  capability?: Capability;
  signal?: AbortSignal;
}

/** Build a `Signer` from a keystore-backed secret. */
export function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer> {
  const { provider, ref, capability, signal } = input;
  return provider.getSigner(ref, capability, signal ? { signal } : undefined);
}

/**
 * Build a `Signer` whose address is fixed but cannot sign anything. Useful
 * for read-only call paths or as a sentinel before unlock.
 */
export function readonlySigner(address: Address): Signer {
  return {
    account: { address, publicKey: '0x' as `0x${string}` },
    async signTransaction() {
      throw readonlyError('signTransaction');
    },
    async signMessage() {
      throw readonlyError('signMessage');
    },
    async signTypedData() {
      throw readonlyError('signTypedData');
    },
  };
}

function readonlyError(method: string): SessionKeyError {
  return new SessionKeyError({
    code: 'wallet/signers/readonly',
    message: `readonly signer cannot ${method}`,
  });
}
