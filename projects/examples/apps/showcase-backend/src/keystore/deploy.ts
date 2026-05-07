import type { Hex, SignableTx } from '@cfxdevkit/core';
import type { Signer } from '@cfxdevkit/core/wallet';
import { estimateTransaction } from '@cfxdevkit/protocol';
import type { Address } from 'viem';
import { encodeDeployData, getContractAddress } from 'viem';
import { compileManager } from '../compile/manager.js';
import { devNodeManager } from '../devnode/manager.js';
import { broadcastRaw, coreClient, espaceClient, getNativeBalance, type Space } from './tx.js';

interface DeployPlan {
  tx: SignableTx;
  expectedContractAddress?: string;
}

const BASIC_ERC20_ARGS = [
  'Keystore Demo Token',
  'KDT',
  18,
  1_000_000n * 1_000_000_000_000_000_000n,
] as const;

export async function deployBasicErc20(space: Space, signer: Signer) {
  const artifact = (await compileManager.catalog()).find(
    (entry) => entry.templateId === 'basic-erc20',
  );
  if (!artifact) throw new Error('basic-erc20 artifact is missing from the compile catalog');
  const data = encodeDeployData({
    abi: artifact.abi,
    bytecode: artifact.bytecode as Hex,
    args: BASIC_ERC20_ARGS,
  } as Parameters<typeof encodeDeployData>[0]) as Hex;
  const plan =
    space === 'core' ? await coreDeployPlan(signer, data) : await espaceDeployPlan(signer, data);
  const rawTx = await signer.signTransaction(plan.tx);
  const txHash = await broadcastRaw(space, rawTx);
  await devNodeManager.mine({ pack: true }).catch(() => undefined);
  const [receipt, balance] = await Promise.all([
    waitForReceipt(space, txHash),
    getNativeBalance(space, signer),
  ]);
  return {
    artifact,
    rawTx,
    txHash,
    balance,
    contractAddress:
      receipt.contractAddress ?? receipt.contractCreated ?? plan.expectedContractAddress ?? '',
  };
}

async function coreDeployPlan(signer: Signer, data: Hex): Promise<DeployPlan> {
  const from = signer.account.coreAddress;
  if (!from) throw new Error('Core address is unavailable');
  const client = coreClient();
  const [nonce, estimate, gasPrice, epochHeight] = await Promise.all([
    client.getTransactionCount(from, { epochTag: 'latest_state' }),
    estimateTransaction(client, { from: from as `0x${string}`, data, value: 0n }),
    client.getGasPrice(),
    client.getEpochNumber({ epochTag: 'latest_state' }),
  ]);
  return {
    tx: {
      family: 'core',
      coreType: 'legacy',
      chainId: 2029,
      value: 0n,
      nonce,
      gas: margin(estimate.gas),
      gasPrice,
      storageLimit: margin(estimate.storageCollateral ?? 0n),
      epochHeight,
      data,
    } satisfies SignableTx,
  };
}

async function espaceDeployPlan(signer: Signer, data: Hex): Promise<DeployPlan> {
  const from = signer.account.address;
  const client = espaceClient();
  const [nonce, estimate, block] = await Promise.all([
    client.getTransactionCount(from as `0x${string}`),
    estimateTransaction(client, { from: from as `0x${string}`, data, value: 0n }),
    client.getBlock('latest').catch(() => null),
  ]);
  const maxPriorityFeePerGas = 1_000_000_000n;
  return {
    expectedContractAddress: getContractAddress({ from: from as Address, nonce: BigInt(nonce) }),
    tx: {
      family: 'espace',
      chainId: 2030,
      value: 0n,
      nonce,
      gas: margin(estimate.gas),
      maxFeePerGas: (block?.baseFeePerGas ?? 1_000_000_000n) * 2n + maxPriorityFeePerGas,
      maxPriorityFeePerGas,
      data,
    } satisfies SignableTx,
  };
}

async function waitForReceipt(space: Space, txHash: string) {
  const client = space === 'core' ? coreClient() : espaceClient();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const receipt = await client.getTransactionReceipt(txHash as `0x${string}`);
    if (receipt) return receipt as typeof receipt & { contractCreated?: string };
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return {} as { contractAddress?: string; contractCreated?: string };
}

function margin(value: bigint): bigint {
  return (value * 125n) / 100n;
}
