/**
 * `@cfxdevkit/signer-session` — headless signer session factory.
 *
 * Create a ready `{ eSpace, core? }` Signer pair from any backend
 * without requiring a browser UI or a running devnode-server.
 *
 * @example Memory (dev/test)
 * ```ts
 * const s = await createSignerSession({ kind: 'memory', privateKey: '0x…' });
 * const sig = await s.eSpace.signMessage('Hello');
 * ```
 *
 * @example File keystore (CI / scripts)
 * ```ts
 * // Set CFX_KEYSTORE_PATH and CFX_PASSPHRASE in env
 * const s = await createSignerSession({ kind: 'file-keystore' });
 * const sig = await s.core!.signMessage('Hello');
 * await s.dispose();
 * ```
 *
 * @example OneKey hardware (Node.js / Electron)
 * ```ts
 * import HardwareSDK from '@onekeyfe/hd-common-connect-sdk';
 * await HardwareSDK.init({ debug: false });
 * const devices = await HardwareSDK.searchDevices();
 * const s = await createSignerSession({
 *   kind: 'onekey',
 *   sdk: HardwareSDK,
 *   connectId: devices.payload[0].connectId,
 *   deviceId: (await HardwareSDK.getFeatures(devices.payload[0].connectId)).payload.deviceId,
 * });
 * ```
 */

import { createFileKeystoreSignerSession } from './backends/file-keystore.js';
import { createLedgerSignerSession } from './backends/ledger.js';
import { createMemorySignerSession } from './backends/memory.js';
import { createOneKeySignerSession } from './backends/onekey.js';
import { readSignerConfig, resolveSignerEntry, type SignerEntry } from './config.js';
import { createOneKeySignerSessionFromConfig } from './onekey-session.js';
import type { SignerSession, SignerSessionInput } from './types.js';

export type {
  FileKeystoreSignerInput,
  LedgerSignerInput,
  MemorySignerInput,
  OneKeySignerInput,
  SignerSession,
  SignerSessionInput,
  SignerSessionKind,
} from './types.js';

/**
 * Create a headless signer session from any supported backend.
 * Returns `{ eSpace, core?, kind, label, dispose }`.
 */
export async function createSignerSession(input: SignerSessionInput): Promise<SignerSession> {
  switch (input.kind) {
    case 'memory':
      return createMemorySignerSession(input);
    case 'file-keystore':
      return createFileKeystoreSignerSession(input);
    case 'onekey':
      return createOneKeySignerSession(input);
    case 'ledger':
      return createLedgerSignerSession(input);
  }
}

export type {
  FileKeystoreSignerEntry,
  LedgerSignerEntry,
  MemorySignerEntry,
  OneKeySignerEntry,
  SignerConfig,
  SignerEntry,
  SignerKind,
} from './config.js';
export {
  defaultSignerConfig,
  ensureSignerJsonGitignored,
  readSignerConfig,
  resolveSignerEntry,
  signerConfigPath,
  writeSignerConfig,
} from './config.js';

export const EPHEMERAL_WARNING =
  '⚠ ephemeral memory signer — key exists only for this session. Use `cdk signer setup` to configure a persistent signer.';

/**
 * Create a signer session from the workspace signer config.
 *
 * @param name - Signer name to use. Defaults to `CFX_SIGNER_NAME` env var, then `defaultSigner`.
 * @param cwd  - Workspace directory. Defaults to `process.cwd()`.
 *
 * @example
 * ```ts
 * const session = await createSignerSessionFromConfig();
 * const sig = await session.eSpace.signMessage('Hello');
 * await session.dispose();
 * ```
 */
export async function createSignerSessionFromConfig(
  name?: string | null,
  cwd = process.cwd(),
  options?: { oneKeyIncludeCore?: boolean },
): Promise<SignerSession> {
  const config = await readSignerConfig(cwd);
  const { name: resolvedName, entry } = resolveSignerEntry(config, name);

  switch (entry.kind) {
    case 'memory': {
      const session = await createSignerSession({
        kind: 'memory',
        privateKey: generateEphemeralKey(),
      });
      process.stderr.write(`[${resolvedName}] ${EPHEMERAL_WARNING}\n`);
      return { ...session, label: `${resolvedName} (memory · ephemeral)` };
    }
    case 'file-keystore':
      return createSignerSession({ ...entry, kind: 'file-keystore' });
    case 'onekey':
      return createOneKeySignerSessionFromConfig(cwd, entry, options);
    case 'ledger':
      throw new Error(
        'Ledger signer requires an open HID transport. Use createSignerSession({ kind: "ledger", transport }) directly.',
      );
    default: {
      const _exhaustive: never = entry;
      throw new Error(`Unknown signer kind: ${(_exhaustive as SignerEntry).kind}`);
    }
  }
}

/** Generate a fresh ephemeral private key (never written to disk). */
function generateEphemeralKey(): `0x${string}` {
  const bytes = new Uint8Array(32);
  if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback
    const { randomFillSync } = require('node:crypto');
    randomFillSync(bytes);
  }
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;
}
