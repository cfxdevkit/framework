import { hexToBase32 } from '@cfxdevkit/cdk/address';
import { deriveAccount, signerFromPrivateKey } from '@cfxdevkit/cdk/wallet';
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
  const espaceChainId = input.espaceChainId ?? 1030;
  const coreNetworkId = input.coreNetworkId ?? 1029;

  const mnemonic = await readFileKeystoreMnemonic({
    path,
    passphrase,
    ref: { service, account },
  });

  const eip44EspacePath = `m/44'/60'/0'/0/${accountIndex}`;
  const eip44CorePath = `m/44'/503'/0'/0/${accountIndex}`;

  const espaceAccount = deriveAccount({ mnemonic, path: eip44EspacePath });
  const coreAccount = deriveAccount({ mnemonic, path: eip44CorePath });

  const eSpace = signerFromPrivateKey(espaceAccount.privateKey as `0x${string}`, espaceChainId);
  const coreAddress = hexToBase32(coreAccount.account.address, coreNetworkId);
  const core = {
    ...signerFromPrivateKey(coreAccount.privateKey as `0x${string}`, coreNetworkId),
    account: { ...coreAccount.account, coreAddress },
  };

  return {
    kind: 'file-keystore',
    label: `${service}/${account}[${accountIndex}]`,
    eSpace,
    core,
    dispose: async () => {},
  };
}
