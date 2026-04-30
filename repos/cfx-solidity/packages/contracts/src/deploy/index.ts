/**
 * `@cfxdevkit/contracts/deploy` — deploy bytecode + (optional) constructor args
 * via the framework's `Signer` and `Client`.
 *
 * Mirrors {@link sendWrite}'s contract: returns the tx hash and (when asked)
 * waits for the receipt to extract the deployed contract address.
 *
 * Supports both eSpace (`eth_sendRawTransaction`, EIP-1559 fees) and Core
 * Space (`cfx_sendRawTransaction`, legacy fees with `storageLimit` +
 * `epochHeight`). The right path is selected from `client.family`.
 */
import type {
  Client,
  CoreSpaceClient,
  EspaceClient,
  Hex,
  SignableTx,
  Signer,
  SignOptions,
  TxReceipt,
} from '@cfxdevkit/core';
import type { Abi, ContractConstructorArgs } from 'viem';
import { encodeDeployData, hexToBigInt, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';
import { waitForReceipt } from '../write/index.js';

export interface DeployContractInput<TAbi extends Abi> {
  client: Client;
  signer: Signer;
  abi: TAbi;
  bytecode: Hex;
  args?: ContractConstructorArgs<TAbi>;
  value?: bigint;
  gas?: bigint;
  // eSpace
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  // Core Space
  gasPrice?: bigint;
  storageLimit?: bigint;
  epochHeight?: bigint;
  coreType?: 'legacy' | 'cip2930' | 'cip1559';
  waitForReceipt?: boolean;
  pollIntervalMs?: number;
  receiptTimeoutMs?: number;
  signOptions?: SignOptions;
}

export interface DeployContractResult {
  hash: Hex;
  request: SignableTx;
  rawTransaction: Hex;
  /** Populated only when `waitForReceipt: true`. */
  address?: string;
  receipt?: TxReceipt;
}

export async function deployContract<TAbi extends Abi>(
  input: DeployContractInput<TAbi>,
): Promise<DeployContractResult> {
  return input.client.family === 'core'
    ? deployCoreContract(input, input.client)
    : deployEspaceContract(input, input.client);
}

// ── eSpace path ──────────────────────────────────────────────────────────────

async function deployEspaceContract<TAbi extends Abi>(
  input: DeployContractInput<TAbi>,
  client: EspaceClient,
): Promise<DeployContractResult> {
  const data = encodeDeployData({
    abi: input.abi,
    bytecode: input.bytecode,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeDeployData>[0]) as Hex;

  const chainId = client.chain.id;
  const from = input.signer.account.address;

  const [nonceHex, gasEstimate] = await Promise.all([
    client.request<Hex>({ method: 'eth_getTransactionCount', params: [from, 'pending'] }),
    input.gas !== undefined
      ? Promise.resolve(input.gas)
      : client.estimateGas({
          from,
          data,
          ...(input.value !== undefined ? { value: input.value } : {}),
        } as never),
  ]);

  // Apply a 25% safety buffer to the estimate when the caller didn't pin
  // `gas` explicitly. Deploys frequently exceed the bare estimate by a few
  // percent (constructor branches, SSTORE refunds, EIP-3529 mechanics) so a
  // tight cap reverts on-chain with "out of gas".
  const gas = input.gas !== undefined ? input.gas : (gasEstimate * 125n) / 100n;

  const baseFee = await fetchEspaceBaseFee(client);
  const maxPriorityFeePerGas = input.maxPriorityFeePerGas ?? 1_000_000_000n;
  const maxFeePerGas = input.maxFeePerGas ?? baseFee * 2n + maxPriorityFeePerGas;

  const tx: SignableTx = {
    family: 'espace',
    chainId,
    data,
    nonce: Number(hexToBigInt(nonceHex)),
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  if (input.value !== undefined) tx.value = input.value;

  const rawTransaction = (await input.signer.signTransaction(tx, input.signOptions ?? {})) as Hex;
  const hash = await client.request<Hex>({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction],
  });

  const out: DeployContractResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    const receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
    out.receipt = receipt;
    const created =
      (receipt as unknown as { contractAddress?: string }).contractAddress ?? undefined;
    if (created) out.address = created;
  }
  return out;
}

async function fetchEspaceBaseFee(client: EspaceClient): Promise<bigint> {
  try {
    const block = await client.getBlock('latest');
    const baseFee = (block as unknown as { baseFeePerGas?: bigint }).baseFeePerGas;
    return baseFee ?? 1_000_000_000n;
  } catch {
    return 1_000_000_000n;
  }
}

// ── Core Space path ──────────────────────────────────────────────────────────

interface CoreEstimate {
  gasLimit: Hex;
  storageCollateralized: Hex;
}

async function deployCoreContract<TAbi extends Abi>(
  input: DeployContractInput<TAbi>,
  client: CoreSpaceClient,
): Promise<DeployContractResult> {
  const fromBase32 = (input.signer.account as unknown as { coreAddress?: string }).coreAddress;
  if (!fromBase32) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message:
        'Signer.account.coreAddress is required for Core Space deploys (use a dual-address account).',
      meta: { family: 'core' },
    });
  }

  const data = encodeDeployData({
    abi: input.abi,
    bytecode: input.bytecode,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeDeployData>[0]) as Hex;

  // Core estimateGasAndCollateral expects the same call shape as a normal tx
  // but without `to` (contract creation).
  const callObject: Record<string, unknown> = { from: fromBase32, data };
  if (input.value !== undefined) callObject.value = toHex(input.value);

  const [nonceHex, estimate, gasPriceHex, epochHex] = await Promise.all([
    client.request<Hex>({ method: 'cfx_getNextNonce', params: [fromBase32, 'latest_state'] }),
    input.gas !== undefined && input.storageLimit !== undefined
      ? Promise.resolve({
          gasLimit: toHex(input.gas) as Hex,
          storageCollateralized: toHex(input.storageLimit) as Hex,
        } satisfies CoreEstimate)
      : client.request<CoreEstimate>({
          method: 'cfx_estimateGasAndCollateral',
          params: [callObject, 'latest_state'],
        }),
    input.gasPrice !== undefined
      ? Promise.resolve(toHex(input.gasPrice) as Hex)
      : client.request<Hex>({ method: 'cfx_gasPrice' }),
    input.epochHeight !== undefined
      ? Promise.resolve(toHex(input.epochHeight) as Hex)
      : client.request<Hex>({ method: 'cfx_epochNumber', params: ['latest_state'] }),
  ]);

  const tx: SignableTx = {
    family: 'core',
    chainId: client.chain.id,
    // `to` intentionally omitted → contract creation
    data,
    nonce: Number(hexToBigInt(nonceHex)),
    // 25% buffer over the estimate when the caller didn't pin `gas`/`storageLimit`.
    gas: input.gas !== undefined ? input.gas : (hexToBigInt(estimate.gasLimit) * 125n) / 100n,
    storageLimit:
      input.storageLimit !== undefined
        ? input.storageLimit
        : (hexToBigInt(estimate.storageCollateralized) * 125n) / 100n,
    epochHeight: hexToBigInt(epochHex),
    gasPrice: hexToBigInt(gasPriceHex),
    coreType: input.coreType ?? 'cip2930',
  };
  if (input.value !== undefined) tx.value = input.value;

  const rawTransaction = (await input.signer.signTransaction(tx, input.signOptions ?? {})) as Hex;
  const hash = await client.request<Hex>({
    method: 'cfx_sendRawTransaction',
    params: [rawTransaction],
  });

  const out: DeployContractResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    const receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
    out.receipt = receipt;
    // Core receipts expose the deployed address as `contractCreated` (base32).
    const created = receipt as unknown as {
      contractCreated?: string;
      contractAddress?: string;
    };
    const addr = created.contractCreated ?? created.contractAddress;
    if (addr) out.address = addr;
  }
  return out;
}

// Keep `toHex` re-exported so callers can build raw txs without re-importing viem.
export { toHex };
