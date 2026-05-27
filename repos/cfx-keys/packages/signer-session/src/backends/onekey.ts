import { signerFromOneKey, signerFromOneKeyCore } from '@cfxdevkit/wallet/hardware/onekey';
import type { OneKeySignerInput, SignerSession } from '../types.js';

export async function createOneKeySignerSession(input: OneKeySignerInput): Promise<SignerSession> {
  const espaceChainId = input.espaceChainId ?? 1030;
  const coreNetworkId = input.coreNetworkId ?? 1029;

  const [eSpace, core] = await Promise.all([
    signerFromOneKey({
      sdk: input.sdk,
      connectId: input.connectId,
      deviceId: input.deviceId,
      ...(input.espacePath ? { path: input.espacePath } : {}),
      ...(espaceChainId ? { chainId: espaceChainId } : {}),
    }),
    signerFromOneKeyCore({
      sdk: input.sdk,
      connectId: input.connectId,
      deviceId: input.deviceId,
      ...(input.corePath ? { path: input.corePath } : {}),
      networkId: coreNetworkId,
    }),
  ]);

  return {
    kind: 'onekey',
    label: `onekey:${eSpace.account.address.slice(0, 10)}…`,
    eSpace,
    core,
    dispose: async () => {},
  };
}
