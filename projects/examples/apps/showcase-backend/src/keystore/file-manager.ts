import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Signer } from '@cfxdevkit/core';
import { coreAddressFromPrivateKey } from '@cfxdevkit/core/wallet';
import { createFileKeystore, initFileKeystore } from '@cfxdevkit/services/keystore-file';
import { signerFromKeystore } from '@cfxdevkit/wallet/signers';

const DEMO_PRIVATE_KEY =
  '0x0000000000000000000000000000000000000000000000000000000000000001' as const;
const DEMO_REF = { service: 'showcase', account: 'file-demo' };

export class FileKeystoreManager {
  private passphrase = '';
  private path = join(tmpdir(), 'cfxdevkit-showcase', 'keystore.json');

  async unlock(passphrase: string) {
    if (passphrase.length < 8) throw new Error('Passphrase must be at least 8 characters');
    this.passphrase = passphrase;
    await mkdir(join(tmpdir(), 'cfxdevkit-showcase'), { recursive: true });
    await initFileKeystore({ path: this.path, passphrase }).catch((error) => {
      if (!String(error instanceof Error ? error.message : error).includes('already exists'))
        throw error;
    });
    const provider = this.provider();
    if (!(await provider.has(DEMO_REF))) {
      await provider.put?.({
        ref: DEMO_REF,
        kind: 'private-key',
        secret: DEMO_PRIVATE_KEY,
        meta: { backend: 'file', purpose: 'showcase' },
      });
    }
    const listed = await provider.list({ service: DEMO_REF.service });
    const signer = await this.signer();
    return {
      providerId: provider.id,
      path: this.path,
      listed: listed.map((item) => `${item.ref.service}/${item.ref.account}:${item.kind}`),
      ...account(signer),
    };
  }

  async signer(): Promise<Signer> {
    if (!this.passphrase) throw new Error('Unlock the encrypted file keystore first');
    const signer = await signerFromKeystore({ provider: this.provider(), ref: DEMO_REF });
    return {
      ...signer,
      account: {
        ...signer.account,
        coreAddress: coreAddressFromPrivateKey(DEMO_PRIVATE_KEY, 2029),
      },
    };
  }

  private provider() {
    return createFileKeystore({
      path: this.path,
      unlock: async () => ({ passphrase: this.passphrase }),
    });
  }
}

export function account(signer: Signer) {
  return { address: signer.account.address, coreAddress: signer.account.coreAddress ?? '' };
}

export const fileKeystoreManager = new FileKeystoreManager();
