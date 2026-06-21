/**
 * Keystore session commands (read, ping).
 *
 * Extracted from keystore-signing-commands.ts to reduce file size.
 */

import type { SignerSession } from '@cfxdevkit/signer-session';
import { createSignerSession, createSignerSessionFromConfig } from '@cfxdevkit/signer-session';

type CreateSignerSessionFromConfigWithOptions = (
  name?: string | null,
  cwd?: string,
  options?: { oneKeyIncludeCore?: boolean },
) => ReturnType<typeof createSignerSessionFromConfig>;

export async function handleRead(args: string[], json: boolean): Promise<void> {
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const selectedName = getFlagValue(args, '--name');
  const directKeystore = getFlagValue(args, '--keystore');
  const passphraseEnv = getFlagValue(args, '--passphrase-env') ?? 'CFX_PASSPHRASE';
  const service = getFlagValue(args, '--service');
  const account = getFlagValue(args, '--account');
  const accountIndex = parseOptionalInt(getFlagValue(args, '--account-index'));

  try {
    const session =
      directKeystore === undefined
        ? await createSignerSessionFromConfig(selectedName ?? null, cwd)
        : await createSignerSession({
            kind: 'file-keystore',
            path: directKeystore,
            passphrase: requireEnv(passphraseEnv),
            ...(service ? { service } : {}),
            ...(account ? { account } : {}),
            ...(accountIndex !== undefined ? { accountIndex } : {}),
          });

    const payload = formatSessionPayload(session);
    if (json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`kind: ${payload.kind}`);
      console.log(`label: ${payload.label}`);
      console.log(`espace: ${payload.eSpaceAddress}`);
      if (payload.coreAddress) console.log(`core: ${payload.coreAddress}`);
    }
    await session.dispose();
  } catch (error) {
    console.error(toErrorMessage(error));
    process.exitCode = 1;
  }
}

export async function handlePing(args: string[], json: boolean): Promise<void> {
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const selectedName = getFlagValue(args, '--name');
  const message = getFlagValue(args, '--message') ?? `cfxdevkit:ping:${new Date().toISOString()}`;

  try {
    const createSignerSessionFromConfigWithOptions =
      createSignerSessionFromConfig as unknown as CreateSignerSessionFromConfigWithOptions;
    const session = await createSignerSessionFromConfigWithOptions(selectedName ?? null, cwd, {
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
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`reachable: yes (${payload.kind})`);
      console.log(`label: ${payload.label}`);
      console.log(`espace: ${payload.eSpaceAddress}`);
      if (payload.coreAddress) console.log(`core: ${payload.coreAddress}`);
      console.log(`signature: ${payload.signature}`);
    }
    await session.dispose();
  } catch (error) {
    console.error(toErrorMessage(error));
    process.exitCode = 1;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSessionPayload(session: SignerSession) {
  return {
    kind: session.kind,
    label: session.label,
    eSpaceAddress: session.eSpace.account.address,
    coreAddress: session.core?.account.coreAddress ?? null,
  };
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`Expected integer value, got: ${value}`);
  return parsed;
}

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
