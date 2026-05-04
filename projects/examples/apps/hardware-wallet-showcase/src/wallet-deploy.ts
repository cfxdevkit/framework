import type { Hex, SignableTx } from '@cfxdevkit/core';
import type { Signer } from '@cfxdevkit/core/wallet';
import type { Abi, Address } from 'viem';
import { encodeDeployData, getContractAddress } from 'viem';
import type { LedgerMode } from './ledger-session.js';
import { broadcastRawTransaction, getNativeBalance } from './wallet-actions.js';

interface CatalogEntry {
  templateId: string;
  name: string;
  contractName: string;
  abi: Abi;
  bytecode: Hex;
}

interface DeployPlan {
  tx: SignableTx;
  expectedContractAddress?: string;
}

interface DeployReceipt {
  contractAddress?: string | null;
  contractCreated?: string | null;
}

export interface LedgerDeployResult {
  artifact: CatalogEntry;
  rawTx: Hex;
  txHash: string;
  balance: string;
  contractAddress: string;
}

const BASIC_ERC20_ARGS = [
  'Ledger Demo Token',
  'LDT',
  18,
  1_000_000n * 1_000_000_000_000_000_000n,
] as const;

export async function deployBasicErc20WithLedger(input: {
  rpcUrl: string;
  mode: LedgerMode;
  signer: Signer;
  afterBroadcast?(): Promise<void>;
}): Promise<LedgerDeployResult> {
  const artifact = await loadBasicErc20Artifact();
  const plan = await buildDeployPlan(input.rpcUrl, input.mode, input.signer, artifact);
  const rawTx = await input.signer.signTransaction(plan.tx);
  const txHash = await broadcastRawTransaction(input.rpcUrl, input.mode, rawTx);
  await input.afterBroadcast?.();
  const [receipt, balance] = await Promise.all([
    waitForDeployReceipt(input.rpcUrl, input.mode, txHash),
    getNativeBalance(input.rpcUrl, input.mode, input.signer),
  ]);
  return {
    artifact,
    rawTx,
    txHash,
    balance,
    contractAddress: extractDeployedAddress(receipt) ?? plan.expectedContractAddress ?? '',
  };
}

async function loadBasicErc20Artifact(): Promise<CatalogEntry> {
  const response = await fetch('/compile/catalog');
  const payload = (await response.json()) as { entries?: CatalogEntry[]; error?: string };
  if (!response.ok || payload.error)
    throw new Error(payload.error ?? 'Failed to load contract catalog');
  const artifact = payload.entries?.find((entry) => entry.templateId === 'basic-erc20');
  if (!artifact) throw new Error('basic-erc20 artifact is missing from the compile catalog');
  return artifact;
}

async function buildDeployPlan(
  rpcUrl: string,
  mode: LedgerMode,
  signer: Signer,
  artifact: CatalogEntry,
): Promise<DeployPlan> {
  const data = encodeDeployData({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: BASIC_ERC20_ARGS,
  } as Parameters<typeof encodeDeployData>[0]) as Hex;

  if (mode === 'core') return buildCoreDeployPlan(rpcUrl, signer, data);
  return buildEspaceDeployPlan(rpcUrl, signer, data);
}

async function buildCoreDeployPlan(rpcUrl: string, signer: Signer, data: Hex): Promise<DeployPlan> {
  const from = signer.account.coreAddress;
  if (!from) throw new Error('Core address is unavailable');
  const callObject = { from, data, value: '0x0' };
  const [nonceHex, estimate, gasPriceHex, epochHex] = await Promise.all([
    rpc(rpcUrl, 'cfx_getNextNonce', [from, 'latest_state']),
    rpc(rpcUrl, 'cfx_estimateGasAndCollateral', [callObject, 'latest_state']),
    rpc(rpcUrl, 'cfx_gasPrice', []),
    rpc(rpcUrl, 'cfx_epochNumber', ['latest_state']),
  ]);
  const coreEstimate = estimate as { gasLimit: Hex; storageCollateralized: Hex };
  return {
    tx: {
      family: 'core',
      coreType: 'legacy',
      chainId: 2029,
      value: 0n,
      nonce: Number(hexToBigInt(String(nonceHex) as Hex)),
      gas: withSafetyMargin(hexToBigInt(coreEstimate.gasLimit)),
      gasPrice: hexToBigInt(String(gasPriceHex) as Hex),
      storageLimit: withSafetyMargin(hexToBigInt(coreEstimate.storageCollateralized)),
      epochHeight: hexToBigInt(String(epochHex) as Hex),
      data,
    },
  };
}

async function buildEspaceDeployPlan(
  rpcUrl: string,
  signer: Signer,
  data: Hex,
): Promise<DeployPlan> {
  const from = signer.account.address;
  const [nonceHex, gasHex, block] = await Promise.all([
    rpc(rpcUrl, 'eth_getTransactionCount', [from, 'pending']),
    rpc(rpcUrl, 'eth_estimateGas', [{ from, data, value: '0x0' }]),
    rpc(rpcUrl, 'eth_getBlockByNumber', ['latest', false]).catch(() => null),
  ]);
  const nonce = Number(hexToBigInt(String(nonceHex) as Hex));
  const maxPriorityFeePerGas = 1_000_000_000n;
  return {
    expectedContractAddress: getContractAddress({ from: from as Address, nonce: BigInt(nonce) }),
    tx: {
      family: 'espace',
      chainId: 2030,
      value: 0n,
      nonce,
      gas: withSafetyMargin(hexToBigInt(String(gasHex) as Hex)),
      maxFeePerGas: (blockBaseFee(block) ?? 1_000_000_000n) * 2n + maxPriorityFeePerGas,
      maxPriorityFeePerGas,
      data,
    },
  };
}

async function waitForDeployReceipt(
  rpcUrl: string,
  mode: LedgerMode,
  txHash: string,
): Promise<DeployReceipt> {
  const method = mode === 'core' ? 'cfx_getTransactionReceipt' : 'eth_getTransactionReceipt';
  let lastReceipt: DeployReceipt = {};
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const receipt = (await rpc(rpcUrl, method, [txHash])) as DeployReceipt | null;
    if (receipt) {
      lastReceipt = receipt;
      if (extractDeployedAddress(receipt)) return receipt;
    }
    await delay(500);
  }
  return lastReceipt;
}

function extractDeployedAddress(receipt: DeployReceipt): string | undefined {
  return receipt.contractAddress ?? receipt.contractCreated ?? undefined;
}

function blockBaseFee(block: unknown): bigint | null {
  const value = (block as { baseFeePerGas?: Hex } | null)?.baseFeePerGas;
  return value ? hexToBigInt(value) : null;
}

function withSafetyMargin(value: bigint): bigint {
  return (value * 125n) / 100n;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function rpc(rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  const payload = (await response.json()) as { result?: unknown; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message ?? `${method} failed`);
  return payload.result;
}

function hexToBigInt(value: Hex): bigint {
  return BigInt(value);
}
