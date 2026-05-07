import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { Hex, Signer } from '@cfxdevkit/core';
import { KeystoreError } from '@cfxdevkit/core';
import { deriveAccount, signerFromPrivateKey, validateMnemonic } from '@cfxdevkit/core/wallet';
import type { AesGcmKey } from '../../crypto/index.js';
import {
  decryptAesGcm,
  deriveKeyArgon2id,
  encryptAesGcm,
  fromBase64Url,
  fromHex,
  randomBytes,
  toBase64Url,
  toHex,
} from '../../crypto/index.js';
import type { KeystorePutInput, SecretRef, StoredSecret } from '../index.js';

const FORMAT_VERSION = 'cfx-v1' as const;
const SALT_LEN = 16;

export interface Envelope {
  version: typeof FORMAT_VERSION;
  kdf: { name: 'argon2id'; salt: string; memKiB: number; iterations: number; parallelism: number };
  secrets: Record<string, EncryptedSecret>;
}

export interface EncryptedSecret {
  kind: StoredSecret['kind'];
  createdAt: number;
  meta?: Record<string, string>;
  iv: string;
  ct: string;
  tag: string;
}

export function refKey(ref: SecretRef): string {
  return `${ref.service}\0${ref.account}`;
}

export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted)
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: 'operation aborted',
      cause: signal.reason,
    });
}

export async function readEnvelope(path: string): Promise<Envelope> {
  let raw: string;
  try {
    raw = await fs.readFile(path, 'utf8');
  } catch (cause) {
    throw new KeystoreError({
      code: 'services/keystore/backend-unavailable',
      message: `failed to read keystore at ${path}`,
      cause,
      meta: { path },
    });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new KeystoreError({
      code: 'services/keystore/backend-unavailable',
      message: `keystore at ${path} is not valid JSON`,
      cause,
    });
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as { version?: unknown }).version !== FORMAT_VERSION
  ) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: `unsupported keystore format (expected ${FORMAT_VERSION})`,
    });
  }
  return parsed as Envelope;
}

export async function writeEnvelope(path: string, env: Envelope): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(env, null, 2), { mode: 0o600 });
  await fs.rename(tmp, path);
}

export interface KdfParams {
  /** Memory cost in KiB. Production default: 64 MiB. Use a small value (≥ 8) in tests. */
  memKiB?: number;
  /** Time cost (iterations). Production default: 3. */
  iterations?: number;
  /** Parallelism / lanes. Default: 1. */
  parallelism?: number;
}

export function emptyEnvelope(salt: Uint8Array, kdf?: KdfParams): Envelope {
  return {
    version: FORMAT_VERSION,
    kdf: {
      name: 'argon2id',
      salt: toBase64Url(salt),
      memKiB: kdf?.memKiB ?? 64 * 1024,
      iterations: kdf?.iterations ?? 3,
      parallelism: kdf?.parallelism ?? 1,
    },
    secrets: {},
  };
}

export async function deriveKekFromEnvelope(env: Envelope, passphrase: string): Promise<AesGcmKey> {
  return deriveKeyArgon2id({
    passphrase,
    salt: fromBase64Url(env.kdf.salt),
    memKiB: env.kdf.memKiB,
    iterations: env.kdf.iterations,
    parallelism: env.kdf.parallelism,
  });
}

export function aadFor(ref: SecretRef): Uint8Array {
  return new TextEncoder().encode(`cfx-v1:${ref.service}:${ref.account}`);
}

export function plaintextFor(input: KeystorePutInput): Uint8Array {
  if (input.kind === 'private-key') return fromHex(input.secret as Hex);
  return new TextEncoder().encode(input.secret);
}

export function signerFromSecret(
  rec: EncryptedSecret,
  secret: string,
  derivationPath?: string,
): Signer {
  if (rec.kind === 'private-key') return signerFromPrivateKey(secret as Hex);
  if (rec.kind === 'mnemonic') {
    const path = derivationPath ?? rec.meta?.derivationPath ?? "m/44'/60'/0'/0/0";
    return signerFromPrivateKey(deriveAccount({ mnemonic: secret, path }).privateKey);
  }
  throw new KeystoreError({
    code: 'services/keystore/unsupported',
    message: `file backend cannot create a signer for kind="${rec.kind}"`,
  });
}

export function validatePutInput(input: KeystorePutInput) {
  if (input.kind === 'private-key') {
    if (typeof input.secret !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(input.secret))
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: 'secret must be a 0x-prefixed 32-byte hex private key',
      });
    return;
  }
  if (input.kind === 'mnemonic') {
    if (typeof input.secret !== 'string' || !validateMnemonic(input.secret.trim()))
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: 'secret must be a valid BIP-39 mnemonic',
      });
    return;
  }
  throw new KeystoreError({
    code: 'services/keystore/unsupported',
    message: `file backend only supports kind="private-key" or kind="mnemonic" (got ${input.kind})`,
  });
}

export async function initFileKeystore(input: {
  path: string;
  passphrase: string;
  kdf?: KdfParams;
}): Promise<void> {
  try {
    await fs.access(input.path);
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: `keystore already exists at ${input.path}`,
    });
  } catch (error) {
    if (error instanceof KeystoreError) throw error;
  }
  const env = emptyEnvelope(randomBytes(SALT_LEN), input.kdf);
  await deriveKekFromEnvelope(env, input.passphrase);
  await writeEnvelope(input.path, env);
}

export async function changeFilePassphrase(input: {
  path: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void> {
  const env = await readEnvelope(input.path);
  const oldKek = await deriveKekFromEnvelope(env, input.oldPassphrase);
  const decrypted: Array<{ key: string; pt: Uint8Array; rec: EncryptedSecret }> = [];
  for (const [key, rec] of Object.entries(env.secrets)) {
    const [service, account] = key.split('\0');
    if (!service || account === undefined)
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: 'malformed secret key in envelope',
      });
    try {
      decrypted.push({
        key,
        rec,
        pt: await decryptAesGcm({
          key: oldKek,
          ciphertext: fromBase64Url(rec.ct),
          iv: fromBase64Url(rec.iv),
          tag: fromBase64Url(rec.tag),
          aad: aadFor({ service, account }),
        }),
      });
    } catch (cause) {
      throw new KeystoreError({
        code: 'services/keystore/bad-passphrase',
        message: 'failed to decrypt secret with old passphrase',
        cause,
      });
    }
  }
  const newEnv = emptyEnvelope(randomBytes(SALT_LEN), {
    memKiB: env.kdf.memKiB,
    iterations: env.kdf.iterations,
    parallelism: env.kdf.parallelism,
  });
  const newKek = await deriveKekFromEnvelope(newEnv, input.newPassphrase);
  for (const { key, pt, rec } of decrypted) {
    const [service, account] = key.split('\0') as [string, string];
    const sealed = await encryptAesGcm({
      key: newKek,
      plaintext: pt,
      aad: aadFor({ service, account }),
    });
    newEnv.secrets[key] = {
      kind: rec.kind,
      createdAt: rec.createdAt,
      ...(rec.meta !== undefined ? { meta: rec.meta } : {}),
      iv: toBase64Url(sealed.iv),
      ct: toBase64Url(sealed.ciphertext),
      tag: toBase64Url(sealed.tag),
    };
  }
  await writeEnvelope(input.path, newEnv);
}

export { decryptAesGcm, encryptAesGcm, fromBase64Url, toBase64Url, toHex };
