import {
  deriveDualAccounts,
  generateMnemonic,
  signerFromPrivateKey,
  validateMnemonic,
} from '@cfxdevkit/cdk';
import { getControlPlaneClient } from '../control-plane.js';
import { getKeystoreSession } from './keystore.js';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleWalletTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_wallet_generate_mnemonic': {
      const strength = (args.strength as 128 | 256) ?? 256;
      const mnemonic = generateMnemonic(strength);
      return text(JSON.stringify({ mnemonic, wordCount: mnemonic.split(' ').length }, null, 2));
    }

    case 'cfxdevkit_wallet_validate_mnemonic': {
      const mnemonic = String(args.mnemonic ?? '');
      const valid = validateMnemonic(mnemonic);
      return text(JSON.stringify({ valid }, null, 2));
    }

    case 'cfxdevkit_wallet_derive_accounts': {
      const mnemonic = String(args.mnemonic ?? '');
      const count = Number(args.count ?? 5);
      const startIndex = Number(args.startIndex ?? 0);

      if (!mnemonic) return errText('mnemonic is required.');
      if (!validateMnemonic(mnemonic)) return errText('Invalid mnemonic phrase.');

      const accounts = deriveDualAccounts({ mnemonic, count, startIndex });
      // Strip private keys — never expose them
      const safeAccounts = accounts.map((a, i) => ({
        index: startIndex + i,
        espaceAddress: a.evmAddress,
        coreAddress: a.coreAddress,
      }));
      return text(JSON.stringify({ accounts: safeAccounts }, null, 2));
    }

    case 'cfxdevkit_wallet_sign_message': {
      const walletRef = String(args.wallet ?? '');
      const message = String(args.message ?? '');

      if (!walletRef)
        return errText('wallet is required (format: "service/account" or "account").');
      if (!message) return errText('message is required.');

      const session = getKeystoreSession();
      if (!session?.passphrase) {
        // Offline fallback: if CFX_PASSPHRASE + CFX_KEYSTORE_PATH are set, sign directly
        const hasCreds = process.env.CFX_PASSPHRASE && process.env.CFX_KEYSTORE_PATH;
        if (hasCreds) {
          try {
            const { createSignerSession, createSignerSessionFromConfig } = await import(
              '@cfxdevkit/signer-session'
            );
            const signerSession = process.env.CFX_KEYSTORE_PATH
              ? await createSignerSession({ kind: 'file-keystore' })
              : await createSignerSessionFromConfig();
            try {
              const space = String(args.space ?? 'espace');
              const signer = space === 'core' ? signerSession.core : signerSession.eSpace;
              if (!signer) return errText('Core Space signer not available for this keystore.');
              const signature = await signer.signMessage(message);
              return text(
                JSON.stringify(
                  {
                    message,
                    space,
                    signer: signer.account.address,
                    signature,
                    note: 'signed offline via file keystore (devnode-server unavailable)',
                  },
                  null,
                  2,
                ),
              );
            } finally {
              await signerSession.dispose();
            }
          } catch (err) {
            return errText(
              `Offline sign failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
        return errText(
          'Keystore is locked. Run cfxdevkit_keystore_unlock first, or set CFX_PASSPHRASE and CFX_KEYSTORE_PATH for offline signing.',
        );
      }

      try {
        const client = getControlPlaneClient();
        const wallets = await client.keystore.wallets.list();
        const wallet =
          wallets.wallets.find(
            (entry: { id: string; name: string }) =>
              entry.id === walletRef || entry.name === walletRef,
          ) ??
          wallets.wallets.find((entry: { id: string }) => entry.id === session.walletId) ??
          wallets.wallets[0];
        if (!wallet) return errText('No wallet found. Run cfxdevkit_keystore_setup first.');
        const revealed = await client.keystore.reveal.request({
          accountIndex: wallet.activeAccountIndex,
          kind: 'private-key',
          passphrase: session.passphrase,
          walletId: wallet.id,
        });
        const secret = await client.keystore.reveal.consume(revealed.request.token);
        if (!secret.reveal.privateKey) return errText('Wallet did not reveal a private key.');
        const signer = signerFromPrivateKey(secret.reveal.privateKey as `0x${string}`);
        const msgBytes = new TextEncoder().encode(message);
        const signature = await signer.signMessage(msgBytes);
        return text(JSON.stringify({ wallet: walletRef, message, signature }, null, 2));
      } catch (err) {
        return errText(`Sign failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      return errText(`Unknown wallet tool: ${name}`);
  }
}
