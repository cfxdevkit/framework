import { signerFromMnemonic, signerFromPrivateKey } from '@cfxdevkit/cdk/wallet';
import { resolveNetworkIds } from '@cfxdevkit/cdk/chains';
import { readFileKeystoreMnemonic } from '@cfxdevkit/services/keystore-file';
import type { FileKeystoreSignerInput, SignerSession } from '../types.js';

/** Resolve a value from an explicit arg or env var, throwing if absent. */
function resolve(explicit: string | undefined, envKey: string, description: string): string {
  const value = explicit ?? process.env[envKey];
  if (!value) {
    throw new Error(`${description} is required. Pass it explicitly or set the ${envKey} env var.`);
  }
  return value;
}

/**
 * Environment variable reference:
 *
 * | Variable                | Purpose                               | Default        |
 * |-------------------------|---------------------------------------|----------------|
 * | CFX_KEYSTORE_PATH       | Path to the encrypted keystore file   | (required)     |
 * | CFX_PASSPHRASE          | Decryption passphrase                 | (required)     |
 * | CFX_KEYSTORE_SERVICE    | ref.service                           | "cfxdevkit"    |
 * | CFX_KEYSTORE_ACCOUNT    | ref.account                           | "default"      |
 */
export async function createFileKeystoreSignerSession(
  input: FileKeystoreSignerInput,
): Promise<SignerSession> {
  const path = resolve(input.path, 'CFX_KEYSTORE_PATH', 'Keystore path');
  const passphrase = resolve(input.passphrase, 'CFX_PASSPHRASE', 'Keystore passphrase');
  const service = input.service ?? process.env.CFX_KEYSTORE_SERVICE ?? 'cfxdevkit';
  const account = input.account ?? process.env.CFX_KEYSTORE_ACCOUNT ?? 'default';
  const accountIndex = input.accountIndex ?? 0;

  // Resolve network IDs from the configured network tier
  const networkIds = resolveNetworkIds(input.network ?? 'mainnet');

  const mnemonic = await readFileKeystoreMnemonic({
    path,
    passphrase,
    ref: { service, account },
  });

  const eip44EspacePath = `m/44'/60'/0'/0/${accountIndex}`;
  const eip44CorePath = `m/44'/503'/0'/0/${accountIndex}`;

  const eSpace = signerFromMnemonic(mnemonic, {
    path: eip44EspacePath,
    passphrase,
  });
  const core = signerFromMnemonic(mnemonic, {
    path: eip44CorePath,
    coreNetworkId: networkIds.core,
    passphrase,
  });

  return {
    kind: 'file-keystore',
    label: `${service}/${account}[${accountIndex}]`,
    eSpace,
    core,
    dispose: async () => {},
  };
}
