import type { Hex, SignableTx } from '@cfxdevkit/core';
import type { Signer } from '@cfxdevkit/core/wallet';
import type { Address } from 'viem';
import { encodeDeployData, getContractAddress } from 'viem';
import { compileManager } from '../compile/manager.js';
import { devNodeManager } from '../devnode/manager.js';
import { broadcastRaw, getNativeBalance, rpc, rpcUrl, type Space } from './tx.js';

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
  const url = rpcUrl('core');
  const [nonceHex, estimate, gasPriceHex, epochHex] = await Promise.all([
    rpc(url, 'cfx_getNextNonce', [from, 'latest_state']),
    rpc(url, 'cfx_estimateGasAndCollateral', [{ from, data, value: '0x0' }, 'latest_state']),
    rpc(url, 'cfx_gasPrice', []),
    rpc(url, 'cfx_epochNumber', ['latest_state']),
  ]);
  const coreEstimate = estimate as { gasLimit: Hex; storageCollateralized: Hex };
  return {
    tx: {
      family: 'core',
      coreType: 'legacy',
      chainId: 2029,
      value: 0n,
      nonce: Number(BigInt(String(nonceHex))),
      gas: margin(BigInt(coreEstimate.gasLimit)),
      gasPrice: BigInt(String(gasPriceHex)),
      storageLimit: margin(BigInt(coreEstimate.storageCollateralized)),
      epochHeight: BigInt(String(epochHex)),
      data,
    } satisfies SignableTx,
  };
}

async function espaceDeployPlan(signer: Signer, data: Hex): Promise<DeployPlan> {
  const from = signer.account.address;
  const url = rpcUrl('espace');
  const [nonceHex, gasHex, block] = await Promise.all([
    rpc(url, 'eth_getTransactionCount', [from, 'pending']),
    rpc(url, 'eth_estimateGas', [{ from, data, value: '0x0' }]),
    rpc(url, 'eth_getBlockByNumber', ['latest', false]).catch(() => null),
  ]);
  const nonce = Number(BigInt(String(nonceHex)));
  const maxPriorityFeePerGas = 1_000_000_000n;
  return {
    expectedContractAddress: getContractAddress({ from: from as Address, nonce: BigInt(nonce) }),
    tx: {
      family: 'espace',
      chainId: 2030,
      value: 0n,
      nonce,
      gas: margin(BigInt(String(gasHex))),
      maxFeePerGas:
        ((block as { baseFeePerGas?: Hex } | null)?.baseFeePerGas
          ? BigInt((block as { baseFeePerGas: Hex }).baseFeePerGas)
          : 1_000_000_000n) *
          2n +
        maxPriorityFeePerGas,
      maxPriorityFeePerGas,
      data,
    } satisfies SignableTx,
  };
}

async function waitForReceipt(space: Space, txHash: string) {
  const method = space === 'core' ? 'cfx_getTransactionReceipt' : 'eth_getTransactionReceipt';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const receipt = (await rpc(rpcUrl(space), method, [txHash])) as {
      contractAddress?: string;
      contractCreated?: string;
    } | null;
    if (receipt) return receipt;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return {};
}

function margin(value: bigint): bigint {
  return (value * 125n) / 100n;
}
