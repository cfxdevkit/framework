import type { Hex } from '@cfxdevkit/core';
import { decodeEventLog } from 'viem';
import type { HexAddress, HexHash } from '../types.js';
import { buildSwapCalldata, SWAPPI_ROUTER_ABI } from './calldata.js';
import type { SwapExecuteInput, SwapExecuteResult, SwapReceipt } from './types.js';

export interface SwapExecutorClient {
  readContract(input: {
    address: HexAddress;
    abi: typeof SWAPPI_ROUTER_ABI;
    functionName: 'getAmountsOut';
    args: readonly [bigint, readonly HexAddress[]];
  }): Promise<readonly bigint[]>;
  simulateContract?(input: {
    address: HexAddress;
    abi: typeof SWAPPI_ROUTER_ABI;
    functionName: 'swapExactTokensForTokens';
    args: readonly [bigint, bigint, readonly HexAddress[], HexAddress, bigint];
  }): Promise<{ request: unknown }>;
  writeContract?(request: unknown): Promise<HexHash>;
  waitForTransactionReceipt?(input: { hash: HexHash }): Promise<SwapReceipt>;
}

export interface SwapExecutorOptions {
  router: HexAddress;
  client: SwapExecutorClient;
  defaultDeadlineSeconds?: number;
}

const TRANSFER_EVENT_ABI = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
} as const;

export class SwapExecutor {
  readonly #router: HexAddress;
  readonly #client: SwapExecutorClient;
  readonly #defaultDeadlineSeconds: number;

  constructor(options: SwapExecutorOptions) {
    this.#router = options.router;
    this.#client = options.client;
    this.#defaultDeadlineSeconds = options.defaultDeadlineSeconds ?? 20 * 60;
  }

  async quote(tokenIn: HexAddress, tokenOut: HexAddress, amountIn: bigint): Promise<bigint> {
    const amounts = await this.#client.readContract({
      address: this.#router,
      abi: SWAPPI_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountIn, [tokenIn, tokenOut]],
    });
    const amountOut = amounts.at(-1);
    if (amountOut === undefined) throw new Error('Swappi quote did not include an output amount');
    return amountOut;
  }

  async execute(input: SwapExecuteInput): Promise<SwapExecuteResult> {
    if (!this.#client.simulateContract || !this.#client.writeContract) {
      throw new Error('SwapExecutor client does not support writes');
    }
    const deadline =
      input.deadline ?? BigInt(Math.floor(Date.now() / 1000) + this.#defaultDeadlineSeconds);
    const args = [
      input.amountIn,
      input.amountOutMin ?? 0n,
      [input.tokenIn, input.tokenOut],
      input.recipient,
      deadline,
    ] as const;
    const calldata = buildSwapCalldata({
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amountIn: input.amountIn,
      recipient: input.recipient,
      deadline,
      ...(input.amountOutMin !== undefined ? { amountOutMin: input.amountOutMin } : {}),
    });
    const simulation = await this.#client.simulateContract({
      address: this.#router,
      abi: SWAPPI_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args,
    });
    const txHash = await this.#client.writeContract(simulation.request);
    const receipt = await this.#client.waitForTransactionReceipt?.({ hash: txHash });
    if (receipt?.status === 'reverted') throw new Error(`swap reverted: ${txHash}`);
    const amountOut = receipt ? decodeAmountOut(receipt, input.recipient) : undefined;
    return { txHash, calldata, ...(amountOut !== undefined ? { amountOut } : {}) };
  }
}

export function decodeAmountOut(receipt: SwapReceipt, recipient: HexAddress): bigint | undefined {
  for (const log of [...receipt.logs].reverse()) {
    try {
      const decoded = decodeEventLog({
        abi: [TRANSFER_EVENT_ABI],
        data: log.data,
        topics: mutableTopics(log.topics),
      });
      if (decoded.eventName !== 'Transfer') continue;
      if (decoded.args.to.toLowerCase() !== recipient.toLowerCase()) continue;
      return decoded.args.value;
    } catch {}
  }
  return undefined;
}

function mutableTopics(topics: readonly Hex[]): [] | [Hex, ...Hex[]] {
  if (topics.length === 0) return [];
  return [...topics] as [Hex, ...Hex[]];
}

export function transferTopic(): Hex {
  return '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
}
