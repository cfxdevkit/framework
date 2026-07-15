/**
 * Keystore session commands — read, ping.
 *
 * Creates signer sessions for identity and connectivity checks.
 */

import {
  createSignerSession,
  createSignerSessionFromConfig,
  type SignerSession,
} from '@cfxdevkit/signer-session';
import { getBool, getString } from '../args.js';
import { parseOptionalInt, requireEnv } from './keystore-helpers.js';

export async function keystoreReadFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const selectedName = getString(flags, 'name');
  const directKeystore = getString(flags, 'keystore');
  const passphraseEnv = getString(flags, 'passphrase-env') ?? 'CFX_PASSPHRASE';
  const service = getString(flags, 'service');
  const account = getString(flags, 'account');
  const accountIndex = parseOptionalInt(getString(flags, 'account-index'));
  const json = getBool(flags, 'json');
  try {
    let session: SignerSession;
    if (directKeystore === undefined) {
      session = await createSignerSessionFromConfig(selectedName ?? null, cwd);
    } else {
      session = await createSignerSession({
        kind: 'file-keystore',
        path: directKeystore,
        passphrase: requireEnv(passphraseEnv),
        ...(service ? { service } : {}),
        ...(account ? { account } : {}),
        ...(accountIndex !== undefined ? { accountIndex } : {}),
      });
    }
    const payload = {
      kind: session.kind,
      label: session.label,
      eSpaceAddress: session.eSpace.account.address,
      coreAddress: session.core?.account.coreAddress ?? null,
    };
    if (json) {
      stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      stdout.write(`kind: ${payload.kind}\n`);
      stdout.write(`label: ${payload.label}\n`);
      stdout.write(`espace: ${payload.eSpaceAddress}\n`);
      if (payload.coreAddress) stdout.write(`core: ${payload.coreAddress}\n`);
    }
    await session.dispose();
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

export async function keystorePingFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const selectedName = getString(flags, 'name');
  const message = getString(flags, 'message') ?? `cfxdevkit:ping:${new Date().toISOString()}`;
  const json = getBool(flags, 'json');
  try {
    const session = await createSignerSessionFromConfig(selectedName ?? null, cwd, {
      oneKeyIncludeCore: false,
    });
    const signature = await session.eSpace.signMessage(message);
    const payload = {
      reachable: true,
      kind: session.kind,
      label: session.label,
      message,
      signature,
      eSpaceAddress: session.eSpace.account.address,
      coreAddress: session.core?.account.coreAddress ?? null,
    };
    if (json) {
      stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      stdout.write(`reachable: yes (${payload.kind})\n`);
      stdout.write(`label: ${payload.label}\n`);
      stdout.write(`espace: ${payload.eSpaceAddress}\n`);
      if (payload.coreAddress) stdout.write(`core: ${payload.coreAddress}\n`);
      stdout.write(`signature: ${payload.signature}\n`);
    }
    await session.dispose();
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}
