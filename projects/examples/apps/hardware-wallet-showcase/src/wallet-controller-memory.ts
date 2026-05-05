import type { Signer } from '@cfxdevkit/core/wallet';
import { coreAddressFromPrivateKey } from '@cfxdevkit/core/wallet';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { DEMO_PRIVATE_KEY, type MemoryDemoResult } from './keystore-demo.js';
import type { LedgerState } from './wallet-state.js';

export async function connectMemoryAccount(input: {
  getMessage(): string;
  managedSignerRef: MutableRefObject<Signer | null>;
  message?: string | undefined;
  setMemoryDemo: Dispatch<SetStateAction<MemoryDemoResult | null>>;
  setState: Dispatch<SetStateAction<LedgerState>>;
}) {
  const [{ createMemoryKeystore }, { signerFromKeystore }] = await Promise.all([
    import('@cfxdevkit/services/keystore-memory'),
    import('@cfxdevkit/wallet/signers'),
  ]);
  const ref = { service: 'showcase', account: 'demo' };
  const provider = createMemoryKeystore();
  await provider.put?.({ ref, kind: 'private-key', secret: DEMO_PRIVATE_KEY });
  const signer = await signerFromKeystore({ provider, ref });
  const coreAddress = coreAddressFromPrivateKey(DEMO_PRIVATE_KEY, 2029);
  input.managedSignerRef.current = { ...signer, account: { ...signer.account, coreAddress } };
  const signature = await input.managedSignerRef.current.signMessage(
    input.message ?? input.getMessage(),
  );
  const listed = await provider.list({ service: 'showcase' });
  input.setMemoryDemo({
    providerId: provider.id,
    listed: listed.map((item) => `${item.ref.service}/${item.ref.account}:${item.kind}`),
    address: signer.account.address,
    signature,
    notice:
      'Memory keystore account is ready for message, transaction, transfer, and deploy operations.',
  });
  input.setState((current) => ({
    ...current,
    status: 'ready',
    address: signer.account.address,
    coreAddress,
    rawTx: signature,
    notice: 'Memory keystore account is ready.',
  }));
}
