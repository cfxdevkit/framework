import { hexToBase32 } from '@cfxdevkit/cdk/address';
import { signerFromPrivateKey } from '@cfxdevkit/cdk/wallet';
import type { MemorySignerInput, SignerSession } from '../types.js';

export async function createMemorySignerSession(input: MemorySignerInput): Promise<SignerSession> {
  const espaceChainId = input.espaceChainId ?? 1030;
  const coreNetworkId = input.coreNetworkId ?? 1029;

  const eSpace = signerFromPrivateKey(input.privateKey, espaceChainId);
  // Core Space: same key, derive base32 address from the hex address
  const coreAddress = hexToBase32(eSpace.account.address, coreNetworkId);
  const core = {
    ...eSpace,
    account: { ...eSpace.account, coreAddress },
  };

  return {
    kind: 'memory',
    label: `memory:${eSpace.account.address.slice(0, 10)}…`,
    eSpace,
    core,
    dispose: async () => {},
  };
}
