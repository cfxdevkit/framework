import {
  type CoreSpaceClient,
  coreSpaceLocal,
  createClient,
  defineChain,
  type EspaceClient,
  espaceLocal,
  http,
  parseCFX,
  signerFromPrivateKey,
} from '@cfxdevkit/core';
import type { Hex } from 'viem';

interface CoreEstimate {
  gasLimit: Hex;
  storageCollateralized: Hex;
}

export async function sendCoreFunds(input: {
  amountCfx: string;
  fromPrivateKey: `0x${string}`;
  rpc: string;
  to: string;
}): Promise<string> {
  const client = createClient({
    chain: coreSpaceLocal,
    transport: http({ timeoutMs: 15_000, url: input.rpc }),
  }) as CoreSpaceClient;
  const signer = signerFromPrivateKey(input.fromPrivateKey, coreSpaceLocal.id);
  const from = signer.account.coreAddress;
  if (!from) {
    throw new Error('core signer is missing a Core Space address');
  }

  const value = parseCFX(input.amountCfx);
  const callObject: Record<string, unknown> = {
    from,
    to: input.to,
    value: `0x${value.toString(16)}`,
  };

  const [nonceHex, estimate, gasPriceHex, epochHex] = await Promise.all([
    client.request<Hex>({ method: 'cfx_getNextNonce', params: [from, 'latest_state'] }),
    client.request<CoreEstimate>({
      method: 'cfx_estimateGasAndCollateral',
      params: [callObject, 'latest_state'],
    }),
    client.request<Hex>({ method: 'cfx_gasPrice' }),
    client.request<Hex>({ method: 'cfx_epochNumber', params: ['latest_state'] }),
  ]);

  const rawTransaction = await signer.signTransaction({
    family: 'core',
    chainId: coreSpaceLocal.id,
    to: input.to,
    value,
    nonce: Number(BigInt(nonceHex)),
    gas: (BigInt(estimate.gasLimit) * 125n) / 100n,
    storageLimit: (BigInt(estimate.storageCollateralized) * 125n) / 100n,
    gasPrice: BigInt(gasPriceHex),
    epochHeight: BigInt(epochHex),
    coreType: 'cip2930',
  });

  return client.sendRawTransaction(rawTransaction as Hex);
}

export async function sendEspaceFunds(input: {
  amountCfx: string;
  fromPrivateKey: `0x${string}`;
  rpc: string;
  to: `0x${string}`;
}): Promise<string> {
  const client = createClient({
    chain: defineChain({
      ...espaceLocal,
      id: 2030,
      name: 'espace-local-runtime',
      displayName: 'Conflux eSpace (local runtime)',
      rpc: { http: [input.rpc] },
    }),
    transport: http({ timeoutMs: 15_000, url: input.rpc }),
  }) as EspaceClient;
  const signer = signerFromPrivateKey(input.fromPrivateKey);
  const signedTx = await signer.signTransaction({
    to: input.to,
    value: parseCFX(input.amountCfx),
    chainId: 2030,
  });
  return client.sendRawTransaction(signedTx as Hex);
}
