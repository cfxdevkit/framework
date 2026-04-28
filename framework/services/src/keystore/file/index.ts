/**
 * `@cfxdevkit/services/keystore-file` — encrypted on-disk keystore.
 *
 * On-disk format: a single JSON envelope, version `cfx-v1`. The KEK
 * (Key-Encryption-Key) is derived from the user's passphrase via Argon2id;
 * each secret is then sealed independently with AES-256-GCM under the KEK.
 *
 * ```json
 * {
 *   "version": "cfx-v1",
 *   "kdf": { "name": "argon2id", "salt": "<b64u>", "memKiB": 65536, "iterations": 3, "parallelism": 1 },
 *   "secrets": {
 *     "<service>\u0000<account>": {
 *       "kind": "private-key",
 *       "createdAt": 1710000000000,
 *       "meta": { "label": "deployer" },
 *       "iv": "<b64u>", "ct": "<b64u>", "tag": "<b64u>"
 *     }
 *   }
 * }
 * ```
 *
 * The KEK lives in process memory only after the first successful unlock;
 * `lock()` zeroes it.
 */
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { Hex, Signer } from '@cfxdevkit/core';
import { KeystoreError } from '@cfxdevkit/core';
import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import {
  type AesGcmKey,
  decryptAesGcm,
  deriveKeyArgon2id,
  encryptAesGcm,
  fromBase64Url,
  fromHex,
  randomBytes,
  toBase64Url,
  toHex,
} from '../../crypto/index.js';
import {
  type AuditLogger,
  type Capability,
  type KeystoreCallOptions,
  type KeystoreListOptions,
  type KeystoreProvider,
  type KeystorePutInput,
  noopAuditLogger,
  type SecretRef,
  type StoredSecret,
} from '../index.js';
import { applyCapability } from '../memory/capability.js';

const FORMAT_VERSION = 'cfx-v1' as const;
const SALT_LEN = 16;

interface Envelope {
  version: typeof FORMAT_VERSION;
  kdf: {
    name: 'argon2id';
    salt: string; // b64u
    memKiB: number;
    iterations: number;
    parallelism: number;
  };
  secrets: Record<string, EncryptedSecret>;
}

interface EncryptedSecret {
  kind: StoredSecret['kind'];
  createdAt: number;
  meta?: Record<string, string>;
  iv: string;
  ct: string;
  tag: string;
}

export interface FileKeystoreOptions {
  path: string;
  /** Called the first time the KEK is needed. */
  unlock: () => Promise<{ passphrase: string }>;
  audit?: AuditLogger;
}

function refKey(ref: SecretRef): string {
  return `${ref.service}\0${ref.account}`;
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: 'operation aborted',
      cause: signal.reason,
    });
  }
}

async function readEnvelope(path: string): Promise<Envelope> {
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

async function writeEnvelope(path: string, env: Envelope): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(env, null, 2), { mode: 0o600 });
  await fs.rename(tmp, path);
}

function emptyEnvelope(salt: Uint8Array): Envelope {
  return {
    version: FORMAT_VERSION,
    kdf: {
      name: 'argon2id',
      salt: toBase64Url(salt),
      memKiB: 64 * 1024,
      iterations: 3,
      parallelism: 1,
    },
    secrets: {},
  };
}

async function deriveKekFromEnvelope(env: Envelope, passphrase: string): Promise<AesGcmKey> {
  return deriveKeyArgon2id({
    passphrase,
    salt: fromBase64Url(env.kdf.salt),
    memKiB: env.kdf.memKiB,
    iterations: env.kdf.iterations,
    parallelism: env.kdf.parallelism,
  });
}

function aadFor(ref: SecretRef): Uint8Array {
  return new TextEncoder().encode(`cfx-v1:${ref.service}:${ref.account}`);
}

/** Initialise an empty encrypted keystore at `path`. Fails if file exists. */
export async function initFileKeystore(input: { path: string; passphrase: string }): Promise<void> {
  try {
    await fs.access(input.path);
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: `keystore already exists at ${input.path}`,
    });
  } catch (e) {
    if (e instanceof KeystoreError) throw e;
    // ENOENT — proceed to create
  }
  const salt = randomBytes(SALT_LEN);
  const env = emptyEnvelope(salt);
  // Validate the passphrase derives a real key (catches empty/garbage early).
  await deriveKekFromEnvelope(env, input.passphrase);
  await writeEnvelope(input.path, env);
}

/** Re-encrypt an existing keystore under a new passphrase. */
export async function changeFilePassphrase(input: {
  path: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void> {
  const env = await readEnvelope(input.path);
  const oldKek = await deriveKekFromEnvelope(env, input.oldPassphrase);

  // Decrypt every secret under the old KEK.
  const decrypted: Array<{ key: string; pt: Uint8Array; rec: EncryptedSecret }> = [];
  for (const [k, rec] of Object.entries(env.secrets)) {
    const [service, account] = k.split('\0');
    if (!service || account === undefined) {
      throw new KeystoreError({
        code: 'services/keystore/unsupported',
        message: 'malformed secret key in envelope',
      });
    }
    let pt: Uint8Array;
    try {
      pt = await decryptAesGcm({
        key: oldKek,
        ciphertext: fromBase64Url(rec.ct),
        iv: fromBase64Url(rec.iv),
        tag: fromBase64Url(rec.tag),
        aad: aadFor({ service, account }),
      });
    } catch (cause) {
      throw new KeystoreError({
        code: 'services/keystore/bad-passphrase',
        message: 'failed to decrypt secret with old passphrase',
        cause,
      });
    }
    decrypted.push({ key: k, pt, rec });
  }

  // New salt + new KEK; re-encrypt with fresh IVs.
  const newSalt = randomBytes(SALT_LEN);
  const newEnv: Envelope = emptyEnvelope(newSalt);
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

/** Build a `KeystoreProvider` backed by an encrypted file. */
export function createFileKeystore(opts: FileKeystoreOptions): KeystoreProvider {
  const audit = opts.audit ?? noopAuditLogger;
  const id = 'file';

  let kek: AesGcmKey | null = null;
  let unlocking: Promise<AesGcmKey> | null = null;

  async function ensureKek(env: Envelope): Promise<AesGcmKey> {
    if (kek) return kek;
    if (unlocking) return unlocking;
    unlocking = (async () => {
      const { passphrase } = await opts.unlock();
      // Probe: derive the KEK and try to decrypt the first secret (if any) to
      // verify the passphrase is correct before caching it.
      const candidate = await deriveKekFromEnvelope(env, passphrase);
      const first = Object.entries(env.secrets)[0];
      if (first) {
        const [k, rec] = first;
        const [service, account] = k.split('\0') as [string, string];
        try {
          await decryptAesGcm({
            key: candidate,
            ciphertext: fromBase64Url(rec.ct),
            iv: fromBase64Url(rec.iv),
            tag: fromBase64Url(rec.tag),
            aad: aadFor({ service, account }),
          });
        } catch (cause) {
          throw new KeystoreError({
            code: 'services/keystore/bad-passphrase',
            message: 'incorrect passphrase',
            cause,
          });
        }
      }
      kek = candidate;
      return candidate;
    })();
    try {
      return await unlocking;
    } finally {
      unlocking = null;
    }
  }

  return {
    id,
    capabilities: { write: true, list: true, rotate: false },

    async list(listOpts: KeystoreListOptions = {}): Promise<StoredSecret[]> {
      checkAborted(listOpts.signal);
      const env = await readEnvelope(opts.path);
      const out: StoredSecret[] = [];
      for (const [k, rec] of Object.entries(env.secrets)) {
        const [service, account] = k.split('\0') as [string, string];
        if (listOpts.service && service !== listOpts.service) continue;
        out.push({
          ref: { service, account },
          kind: rec.kind,
          createdAt: rec.createdAt,
          ...(rec.meta !== undefined ? { meta: rec.meta } : {}),
        });
      }
      audit.record({ at: Date.now(), provider: id, action: 'list', ok: true });
      return out;
    },

    async has(ref: SecretRef, callOpts: KeystoreCallOptions = {}): Promise<boolean> {
      checkAborted(callOpts.signal);
      const env = await readEnvelope(opts.path);
      return env.secrets[refKey(ref)] !== undefined;
    },

    async getSigner(
      ref: SecretRef,
      capability?: Capability,
      callOpts: KeystoreCallOptions = {},
    ): Promise<Signer> {
      checkAborted(callOpts.signal);
      const env = await readEnvelope(opts.path);
      const rec = env.secrets[refKey(ref)];
      if (!rec) {
        audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: false });
        throw new KeystoreError({
          code: 'services/keystore/not-found',
          message: `secret not found: ${ref.service}/${ref.account}`,
          meta: { ref },
        });
      }
      if (rec.kind !== 'private-key') {
        throw new KeystoreError({
          code: 'services/keystore/unsupported',
          message: `file backend currently only supports kind="private-key" (got ${rec.kind})`,
        });
      }
      const k = await ensureKek(env);
      let pt: Uint8Array;
      try {
        pt = await decryptAesGcm({
          key: k,
          ciphertext: fromBase64Url(rec.ct),
          iv: fromBase64Url(rec.iv),
          tag: fromBase64Url(rec.tag),
          aad: aadFor(ref),
        });
      } catch (cause) {
        throw new KeystoreError({
          code: 'services/keystore/bad-passphrase',
          message: 'failed to decrypt secret',
          cause,
        });
      }
      const privateKey = toHex(pt) as Hex;
      // Best-effort wipe of the plaintext byte buffer.
      pt.fill(0);
      const base = signerFromPrivateKey(privateKey);
      const signer = capability ? applyCapability(base, capability) : base;
      audit.record({ at: Date.now(), provider: id, action: 'getSigner', ref, ok: true });
      return signer;
    },

    async put(input: KeystorePutInput, callOpts: KeystoreCallOptions = {}): Promise<void> {
      checkAborted(callOpts.signal);
      if (input.kind !== 'private-key') {
        throw new KeystoreError({
          code: 'services/keystore/unsupported',
          message: `file backend currently only supports kind="private-key" (got ${input.kind})`,
        });
      }
      if (typeof input.secret !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(input.secret)) {
        throw new KeystoreError({
          code: 'services/keystore/unsupported',
          message: 'secret must be a 0x-prefixed 32-byte hex private key',
        });
      }
      const env = await readEnvelope(opts.path);
      const k = await ensureKek(env);
      const pt = fromHex(input.secret as Hex);
      const sealed = await encryptAesGcm({ key: k, plaintext: pt, aad: aadFor(input.ref) });
      pt.fill(0);
      env.secrets[refKey(input.ref)] = {
        kind: 'private-key',
        createdAt: Date.now(),
        ...(input.meta !== undefined ? { meta: input.meta } : {}),
        iv: toBase64Url(sealed.iv),
        ct: toBase64Url(sealed.ciphertext),
        tag: toBase64Url(sealed.tag),
      };
      await writeEnvelope(opts.path, env);
      audit.record({ at: Date.now(), provider: id, action: 'put', ref: input.ref, ok: true });
    },

    async remove(ref: SecretRef, callOpts: KeystoreCallOptions = {}): Promise<void> {
      checkAborted(callOpts.signal);
      const env = await readEnvelope(opts.path);
      const ok = delete env.secrets[refKey(ref)];
      await writeEnvelope(opts.path, env);
      audit.record({ at: Date.now(), provider: id, action: 'remove', ref, ok });
      if (!ok) {
        throw new KeystoreError({
          code: 'services/keystore/not-found',
          message: `secret not found: ${ref.service}/${ref.account}`,
          meta: { ref },
        });
      }
    },
  };
}
