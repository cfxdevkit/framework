import type { KeystoreCapabilities } from '@cfxdevkit/services/keystore';

export type KeystoreBackendId = 'memory' | 'file' | 'ledger' | 'onekey' | 'satochip';
export type KeystoreBackendStatus = 'ready' | 'browser-limited' | 'interactive' | 'planned';

export interface KeystoreBackendInfo {
  id: KeystoreBackendId;
  name: string;
  status: KeystoreBackendStatus;
  secret: string;
  capabilities: KeystoreCapabilities;
  storage: string;
  signer: string;
  operations: string[];
}

export interface MemoryDemoResult {
  providerId: string;
  listed: string[];
  address: string;
  signature: string;
  notice: string;
}

export const KEYSTORE_BACKENDS: readonly KeystoreBackendInfo[] = Object.freeze([
  {
    id: 'memory',
    name: 'Memory',
    status: 'ready',
    secret: 'private-key or mnemonic',
    capabilities: { write: true, list: true, rotate: false },
    storage: 'process memory only',
    signer: 'software signer from @cfxdevkit/services/keystore-memory',
    operations: ['create', 'put', 'list', 'has', 'getSigner', 'signMessage'],
  },
  {
    id: 'file',
    name: 'Encrypted file',
    status: 'browser-limited',
    secret: 'private-key or mnemonic',
    capabilities: { write: true, list: true, rotate: false },
    storage: 'cfx-v1 envelope, Argon2id KEK, AES-256-GCM records',
    signer: 'software signer after passphrase unlock',
    operations: ['initFileKeystore', 'createFileKeystore', 'put', 'list', 'getSigner'],
  },
  {
    id: 'ledger',
    name: 'Ledger',
    status: 'interactive',
    secret: 'opaque hardware account',
    capabilities: { write: false, list: true, rotate: false },
    storage: 'device secure element plus configured derivation path',
    signer: 'hardware signer from @cfxdevkit/services/keystore-ledger',
    operations: ['list configured accounts', 'getSigner', 'signMessage eSpace', 'signTransaction'],
  },
  {
    id: 'onekey',
    name: 'OneKey',
    status: 'planned',
    secret: 'opaque hardware account',
    capabilities: { write: false, list: true, rotate: false },
    storage: 'device secure element through vendor SDK',
    signer: 'hardware adapter contract already exists',
    operations: ['adapter slot', 'getSigner', 'signMessage', 'signTransaction'],
  },
  {
    id: 'satochip',
    name: 'Satochip',
    status: 'planned',
    secret: 'opaque smart-card account',
    capabilities: { write: false, list: true, rotate: false },
    storage: 'JavaCard through local bridge',
    signer: 'hardware adapter contract already exists',
    operations: ['bridge status', 'getSigner', 'signMessage', 'signTransaction'],
  },
]);

export async function runMemoryKeystoreDemo(): Promise<MemoryDemoResult> {
  const [{ createMemoryKeystore }, { signerFromKeystore }] = await Promise.all([
    import('@cfxdevkit/services/keystore-memory'),
    import('@cfxdevkit/wallet/signers'),
  ]);
  const ref = { service: 'showcase', account: 'memory-demo' };
  const provider = createMemoryKeystore();
  await provider.put?.({
    ref,
    kind: 'private-key',
    secret: '0x0000000000000000000000000000000000000000000000000000000000000001',
    meta: { backend: 'memory', purpose: 'browser showcase' },
  });
  const listed = await provider.list({ service: 'showcase' });
  const signer = await signerFromKeystore({ provider, ref });
  const signature = await signer.signMessage('cfxdevkit memory keystore check');
  return {
    providerId: provider.id,
    listed: listed.map((item) => `${item.ref.service}/${item.ref.account}:${item.kind}`),
    address: signer.account.address,
    signature,
    notice:
      'Memory keystore created a signer without exposing private material past the provider boundary.',
  };
}
