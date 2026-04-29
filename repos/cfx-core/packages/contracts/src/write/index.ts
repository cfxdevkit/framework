/**
 * `@cfxdevkit/contracts/write` — typed contract writes.
 *
 * Splits the operation in two:
 *
 * 1. {@link prepareWrite} — pure helper that returns the encoded
 *    `SignableTx` (no RPC, no signing). Useful for batching, simulation, or
 *    handing the payload to an off-process signer.
 * 2. {@link sendWrite} — full pipeline: gas + nonce + fee defaults filled in
 *    from the client, payload signed with the supplied {@link Signer}, raw
 *    transaction broadcast, and (optionally) the receipt awaited.
 *
 * Supports both eSpace (`eth_*` + EIP-1559) and Core Space (`cfx_*` + legacy
 * fees with `storageLimit` + `epochHeight`).
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
import type { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { encodeFunctionData, hexToBigInt, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';

export interface PrepareWriteInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
> {
  /** eSpace `0x…` hex; Core Space `cfx:…` / `cfxtest:…` base32. */
  address: string;
  abi: TAbi;
  functionName: TName;
  args?: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TName>;
  /** Native value (wei / drip) to send with the call. */
  value?: bigint;
  chainId: number;
  /** Tags the resulting `SignableTx` with the target family. Default `'espace'`. */
  family?: 'espace' | 'core';
  nonce?: number;
  gas?: bigint;
  // eSpace
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  // Core Space
  gasPrice?: bigint;
  storageLimit?: bigint;
  epochHeight?: bigint;
  coreType?: 'legacy' | 'cip2930' | 'cip1559';
}

/** Pure helper — encodes the call into a `SignableTx` for an external signer. */
export function prepareWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: PrepareWriteInput<TAbi, TName>): SignableTx {
  const data = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;

  const tx: SignableTx = {
    chainId: input.chainId,
    to: input.address,
    data,
    ...(input.family ? { family: input.family } : {}),
  };
  if (input.value !== undefined) tx.value = input.value;
  if (input.nonce !== undefined) tx.nonce = input.nonce;
  if (input.gas !== undefined) tx.gas = input.gas;
  if (input.maxFeePerGas !== undefined) tx.maxFeePerGas = input.maxFeePerGas;
  if (input.maxPriorityFeePerGas !== undefined)
    tx.maxPriorityFeePerGas = input.maxPriorityFeePerGas;
  if (input.gasPrice !== undefined) tx.gasPrice = input.gasPrice;
  if (input.storageLimit !== undefined) tx.storageLimit = input.storageLimit;
  if (input.epochHeight !== undefined) tx.epochHeight = input.epochHeight;
  if (input.coreType !== undefined) tx.coreType = input.coreType;
  return tx;
}

export interface SendWriteInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
> extends Omit<PrepareWriteInput<TAbi, TName>, 'chainId' | 'family'> {
  client: Client;
  signer: Signer;
  /** Wait for the receipt before resolving (default: false). */
  waitForReceipt?: boolean;
  /** Polling interval in ms when `waitForReceipt` is true (default: 1500). */
  pollIntervalMs?: number;
  /** Maximum time to wait for a receipt (default: 60_000ms). */
  receiptTimeoutMs?: number;
  signOptions?: SignOptions;
}

export interface SendWriteResult {
  hash: Hex;
  request: SignableTx;
  rawTransaction: Hex;
  receipt?: TxReceipt;
}

/**
 * Sign + broadcast a write. Fills missing `nonce`, `gas`, fee fields by
 * querying the client; dispatches `eth_sendRawTransaction` (eSpace) or
 * `cfx_sendRawTransaction` (Core Space) based on `client.family`.
 */
export async function sendWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: SendWriteInput<TAbi, TName>): Promise<SendWriteResult> {
  return input.client.family === 'core'
    ? sendCoreWrite(input, input.client)
    : sendEspaceWrite(input, input.client);
}

// ── eSpace path ──────────────────────────────────────────────────────────────

async function sendEspaceWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: SendWriteInput<TAbi, TName>, client: EspaceClient): Promise<SendWriteResult> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(input.address)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 0x-prefixed 20-byte hex address for eSpace, got: ${input.address}`,
      meta: { address: input.address, family: 'espace' },
    });
  }
  const chainId = client.chain.id;
  const from = input.signer.account.address;
  const baseData = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;

  const [nonceHex, gasEstimate, feeHistoryBaseFee] = await Promise.all([
    client.request<Hex>({ method: 'eth_getTransactionCount', params: [from, 'pending'] }),
    input.gas !== undefined
      ? Promise.resolve(input.gas)
      : input.value !== undefined
        ? client.estimateGas({
            from,
            to: input.address as `0x${string}`,
            data: baseData,
            value: input.value,
          } as never)
        : client.estimateGas({
            from,
            to: input.address as `0x${string}`,
            data: baseData,
          } as never),
    fetchEspaceBaseFee(client),
  ]);

  const maxPriorityFeePerGas = input.maxPriorityFeePerGas ?? 1_000_000_000n;
  const maxFeePerGas = input.maxFeePerGas ?? feeHistoryBaseFee * 2n + maxPriorityFeePerGas;

  const tx: SignableTx = {
    family: 'espace',
    chainId,
    to: input.address,
    data: baseData,
    nonce: input.nonce ?? Number(hexToBigInt(nonceHex)),
    gas: gasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  if (input.value !== undefined) tx.value = input.value;

  const rawTransaction = (await input.signer.signTransaction(tx, input.signOptions ?? {})) as Hex;
  const hash = await client.request<Hex>({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction],
  });

  const out: SendWriteResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    out.receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
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

async function sendCoreWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: SendWriteInput<TAbi, TName>, client: CoreSpaceClient): Promise<SendWriteResult> {
  if (/^0x[0-9a-fA-F]+$/.test(input.address)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected base32 address for Core Space, got 0x-hex: ${input.address}`,
      meta: { address: input.address, family: 'core' },
    });
  }

  const chainId = client.chain.id;
  // Core signers expose both 0x evm and base32 core addresses; sender must be base32.
  const fromBase32 = (input.signer.account as unknown as { coreAddress?: string }).coreAddress;
  if (!fromBase32) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message:
        'Signer.account.coreAddress is required for Core Space writes (use a dual-address account).',
      meta: { family: 'core' },
    });
  }

  const baseData = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;

  const callObject: Record<string, unknown> = {
    from: fromBase32,
    to: input.address,
    data: baseData,
  };
  if (input.value !== undefined) callObject.value = toHex(input.value);

  const [nonceHex, estimate, gasPriceHex, epochHex] = await Promise.all([
    input.nonce !== undefined
      ? Promise.resolve(toHex(input.nonce) as Hex)
      : client.request<Hex>({ method: 'cfx_getNextNonce', params: [fromBase32, 'latest_state'] }),
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
    chainId,
    to: input.address,
    data: baseData,
    nonce: Number(hexToBigInt(nonceHex)),
    gas: input.gas ?? hexToBigInt(estimate.gasLimit),
    storageLimit: input.storageLimit ?? hexToBigInt(estimate.storageCollateralized),
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

  const out: SendWriteResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    out.receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
  }
  return out;
}

// ── Receipt polling ──────────────────────────────────────────────────────────

export async function waitForReceipt(
  client: Client,
  hash: Hex,
  opts: { pollIntervalMs: number; timeoutMs: number },
): Promise<TxReceipt> {
  const deadline = Date.now() + opts.timeoutMs;
  while (Date.now() < deadline) {
    const receipt =
      client.family === 'espace'
        ? await client.getTransactionReceipt(hash)
        : await client.request<TxReceipt | null>({
            method: 'cfx_getTransactionReceipt',
            params: [hash],
          });
    if (receipt) {
      // Both spaces report a status; eSpace as 'reverted'/'success', Core as
      // 0/1 (success) or 2 (skipped). Treat anything non-success as a revert.
      const status = (receipt as unknown as { status?: unknown }).status;
      const ok =
        status === 'success' ||
        status === 1 ||
        status === '0x0' ||
        status === 0n ||
        status === undefined;
      if (!ok) {
        throw new ContractsError({
          code: 'contracts/reverted',
          message: `transaction ${hash} reverted (status=${String(status)})`,
          meta: { hash, status: String(status) },
        });
      }
      return receipt;
    }
    await sleep(opts.pollIntervalMs);
  }
  throw new ContractsError({
    code: 'contracts/receipt-timeout',
    message: `receipt for ${hash} not found within ${opts.timeoutMs}ms`,
    meta: { hash },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
