import { signerFromOneKey, signerFromOneKeyCore } from '@cfxdevkit/wallet/hardware/onekey';
import type { OneKeySignerInput, SignerSession } from '../types.js';

export async function createOneKeySignerSession(input: OneKeySignerInput): Promise<SignerSession> {
  const espaceChainId = input.espaceChainId ?? 1030;
  const coreNetworkId = input.coreNetworkId ?? 1029;
  const includeCore = input.includeCore ?? true;

  // Hardware wallets are single-session devices. Running both address probes in
  // parallel can trigger "Device interrupted" by canceling one operation.
  const eSpace = await signerFromOneKey({
    sdk: input.sdk,
    connectId: input.connectId,
    deviceId: input.deviceId,
    ...(input.espacePath ? { path: input.espacePath } : {}),
    ...(espaceChainId ? { chainId: espaceChainId } : {}),
  });
  const core = includeCore
    ? await signerFromOneKeyCore({
        sdk: input.sdk,
        connectId: input.connectId,
        deviceId: input.deviceId,
        ...(input.corePath ? { path: input.corePath } : {}),
        networkId: coreNetworkId,
      })
    : undefined;

  return {
    kind: 'onekey',
    label: `onekey:${eSpace.account.address.slice(0, 10)}…`,
    eSpace,
    ...(core ? { core } : {}),
    dispose: async () => {},
  };
}
