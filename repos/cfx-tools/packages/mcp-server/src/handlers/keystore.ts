import { generateMnemonic, validateMnemonic } from '@cfxdevkit/core';
import { getControlPlaneClient } from '../control-plane.js';

export interface KeystoreSession {
  passphrase: string;
  walletId: string | null;
}

let keystoreSession: KeystoreSession | null = null;

export function getKeystoreSession(): KeystoreSession | null {
  return keystoreSession;
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
      const status = await getControlPlaneClient().keystore.status();
      return text(JSON.stringify(status, null, 2));
    }

    case 'cfxdevkit_keystore_setup': {
      const passphrase = String(args.passphrase ?? '');
      if (!passphrase) {
        return errText('passphrase is required to set up the keystore.');
      }
      const mnemonic = args.mnemonic ? String(args.mnemonic) : generateMnemonic(256);

      if (!validateMnemonic(mnemonic)) {
        return errText('Invalid mnemonic phrase provided.');
      }

      try {
        const client = getControlPlaneClient();
        await client.keystore.setup({ passphrase });
        await client.keystore.unlock({ passphrase });
        const wallet = await client.keystore.wallets.add({ mnemonic, name: 'main' });
        keystoreSession = { passphrase, walletId: wallet.wallet.id };
        return text(
          `Keystore initialized through the shared devnode-server control plane.\n` +
            `IMPORTANT: Back up your mnemonic:\n${mnemonic}`,
        );
      } catch (err) {
        return errText(
          `Keystore setup failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    case 'cfxdevkit_keystore_unlock': {
      const passphrase = String(args.passphrase ?? '');
      if (!passphrase) return errText('passphrase is required.');

      try {
        const client = getControlPlaneClient();
        await client.keystore.unlock({ passphrase });
        const active = await client.keystore.active();
        keystoreSession = { passphrase, walletId: active.wallet?.id ?? null };
        return text('Keystore unlocked through the shared devnode-server control plane.');
      } catch (err) {
        return errText(
          `Unlock failed — wrong passphrase or corrupted keystore: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    case 'cfxdevkit_keystore_list_wallets': {
      try {
        const wallets = await getControlPlaneClient().keystore.wallets.list();
        return text(JSON.stringify(wallets.wallets, null, 2));
      } catch (err) {
        return errText(`List wallets failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      return errText(`Unknown keystore tool: ${name}`);
  }
}
