import { existsSync } from 'node:fs';
import { generateMnemonic, validateMnemonic } from '@cfxdevkit/core';
import type { KeystoreProvider } from '@cfxdevkit/services/keystore';
import { createFileKeystore, initFileKeystore } from '@cfxdevkit/services/keystore-file';
import { defaultKeystorePath } from '@cfxdevkit/wallet';

/** Canonical ref used to store the root mnemonic in the keystore. */
const ROOT_REF = { service: 'cfxdevkit', account: 'main' };

/** Singleton unlocked keystore provider, valid per MCP session. */
let _keystoreProvider: KeystoreProvider | undefined;
let _keystorePath: string | undefined;

export function getKeystoreProvider(): KeystoreProvider | undefined {
  return _keystoreProvider;
}

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleKeystoreTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_keystore_status': {
      const path = _keystorePath ?? defaultKeystorePath();
      const initialized = existsSync(path);
      const unlocked = _keystoreProvider !== undefined;
      return text(JSON.stringify({ initialized, unlocked, path }, null, 2));
    }

    case 'cfxdevkit_keystore_setup': {
      const path = defaultKeystorePath();
      const passphrase = String(args.passphrase ?? '');
      if (!passphrase) {
        return errText('passphrase is required to set up the keystore.');
      }
      const mnemonic = args.mnemonic ? String(args.mnemonic) : generateMnemonic(256);

      if (!validateMnemonic(mnemonic)) {
        return errText('Invalid mnemonic phrase provided.');
      }

      try {
        await initFileKeystore({ path, passphrase });
        const provider = createFileKeystore({ path, unlock: async () => ({ passphrase }) });
        // Store the mnemonic as the root secret
        await provider.put?.({ ref: ROOT_REF, kind: 'mnemonic', secret: mnemonic });
        _keystorePath = path;
        _keystoreProvider = provider;
        return text(
          `Keystore initialized at ${path}.\n` + `IMPORTANT: Back up your mnemonic:\n${mnemonic}`,
        );
      } catch (err) {
        return errText(
          `Keystore setup failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    case 'cfxdevkit_keystore_unlock': {
      const path = _keystorePath ?? defaultKeystorePath();
      const passphrase = String(args.passphrase ?? '');
      if (!passphrase) return errText('passphrase is required.');
      if (!existsSync(path)) {
        return errText(`No keystore found at ${path}. Run cfxdevkit_keystore_setup first.`);
      }

      try {
        // Validate passphrase by listing secrets (will fail with wrong passphrase)
        const provider = createFileKeystore({ path, unlock: async () => ({ passphrase }) });
        await provider.list();
        _keystorePath = path;
        _keystoreProvider = provider;
        return text(`Keystore unlocked (session). Path: ${path}`);
      } catch (err) {
        return errText(
          `Unlock failed — wrong passphrase or corrupted keystore: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    case 'cfxdevkit_keystore_list_wallets': {
      if (!_keystoreProvider) {
        return errText('Keystore is locked. Run cfxdevkit_keystore_unlock first.');
      }
      try {
        const wallets = await _keystoreProvider.list({});
        const masked = wallets.map((w) => ({
          service: w.ref.service,
          account: w.ref.account,
          kind: w.kind,
          createdAt: new Date(w.createdAt).toISOString(),
          meta: w.meta
            ? Object.fromEntries(Object.entries(w.meta).filter(([k]) => k !== 'privateKey'))
            : undefined,
        }));
        return text(JSON.stringify(masked, null, 2));
      } catch (err) {
        return errText(`List wallets failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      return errText(`Unknown keystore tool: ${name}`);
  }
}
