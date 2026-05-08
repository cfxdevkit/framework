import type { EspaceClient, Hex, SignableTx, Signer } from '@cfxdevkit/core';
import { waitForTransactionReceipt } from '@cfxdevkit/protocol';
import { decodeFunctionResult, encodeFunctionData, hexToBigInt } from 'viem';
import { AUTOMATION_MANAGER_ABI, AUTOMATION_MANAGER_ADDRESSES } from './automation-manager-abi.js';
import {
  receiptToSwapReceipt,
  requireOnChainJobId,
  statusToOnChainStatus,
} from './keeper-client-helpers.js';
import { buildSwapCalldata } from './swap/calldata.js';
import { decodeAmountOut } from './swap/executor.js';
import type {
  DCAJob,
  ExecuteResult,
  HexAddress,
  HexHash,
  LimitOrderJob,
  OnChainJobStatus,
  SwapJob,
  TWAPJob,
} from './types.js';

export { AUTOMATION_MANAGER_ABI, AUTOMATION_MANAGER_ADDRESSES };

export interface KeeperClient {
  executeLimitOrder(job: LimitOrderJob): Promise<ExecuteResult>;
  executeDCATick(job: DCAJob): Promise<ExecuteResult>;
  executeTWAPTick(job: TWAPJob): Promise<ExecuteResult>;
  executeSwap(job: SwapJob): Promise<ExecuteResult>;
  getOnChainStatus(jobId: HexHash): Promise<OnChainJobStatus>;
}

export interface AutomationManagerActions {
  executeLimitOrder(job: LimitOrderJob): Promise<ExecuteResult>;
  executeDCATick(job: DCAJob): Promise<ExecuteResult>;
  executeTWAPTick?(job: TWAPJob): Promise<ExecuteResult>;
  executeSwap?(job: SwapJob): Promise<ExecuteResult>;
  getOnChainStatus(jobId: HexHash): Promise<OnChainJobStatus>;
}

export interface AutomationManagerClientConfig {
  contractAddress: HexAddress;
  swappiRouter?: HexAddress;
  maxGasPriceGwei?: number;
  actions: AutomationManagerActions;
}

export interface KeeperClientImplConfig {
  client: EspaceClient;
  signer: Signer;
  contractAddress: HexAddress;
  swappiRouter: HexAddress;
  maxGasPriceGwei?: number;
  receiptTimeoutMs?: number;
  receiptIntervalMs?: number;
  defaultDeadlineSeconds?: number;
  maxPriorityFeePerGas?: bigint;
}

export class AutomationManagerClient implements KeeperClient {
  readonly contractAddress: HexAddress;
  readonly swappiRouter?: HexAddress;
  readonly maxGasPriceGwei?: number;
  readonly #actions: AutomationManagerActions;

  constructor(config: AutomationManagerClientConfig) {
    this.contractAddress = config.contractAddress;
    if (config.swappiRouter !== undefined) this.swappiRouter = config.swappiRouter;
    if (config.maxGasPriceGwei !== undefined) this.maxGasPriceGwei = config.maxGasPriceGwei;
    this.#actions = config.actions;
  }

  executeLimitOrder(job: LimitOrderJob): Promise<ExecuteResult> {
    return this.#actions.executeLimitOrder(job);
  }

  executeDCATick(job: DCAJob): Promise<ExecuteResult> {
    return this.#actions.executeDCATick(job);
  }

  executeTWAPTick(job: TWAPJob): Promise<ExecuteResult> {
    if (!this.#actions.executeTWAPTick) {
      throw new Error('AutomationManagerClient actions do not support TWAP execution');
    }
    return this.#actions.executeTWAPTick(job);
  }

  executeSwap(job: SwapJob): Promise<ExecuteResult> {
    if (!this.#actions.executeSwap) {
      throw new Error('AutomationManagerClient actions do not support swap execution');
    }
    return this.#actions.executeSwap(job);
  }

  getOnChainStatus(jobId: HexHash): Promise<OnChainJobStatus> {
    return this.#actions.getOnChainStatus(jobId);
  }
}

export class KeeperClientImpl implements KeeperClient {
  readonly contractAddress: HexAddress;
  readonly swappiRouter: HexAddress;
  readonly maxGasPriceGwei: number;
  readonly #client: EspaceClient;
  readonly #signer: Signer;
  readonly #receiptTimeoutMs: number;
  readonly #receiptIntervalMs: number;
  readonly #defaultDeadlineSeconds: number;
  readonly #maxPriorityFeePerGas: bigint;

  constructor(config: KeeperClientImplConfig) {
    this.#client = config.client;
    this.#signer = config.signer;
    this.contractAddress = config.contractAddress;
    this.swappiRouter = config.swappiRouter;
    this.maxGasPriceGwei = config.maxGasPriceGwei ?? 500;
    this.#receiptTimeoutMs = config.receiptTimeoutMs ?? 60_000;
    this.#receiptIntervalMs = config.receiptIntervalMs ?? 1_500;
    this.#defaultDeadlineSeconds = config.defaultDeadlineSeconds ?? 20 * 60;
    this.#maxPriorityFeePerGas = config.maxPriorityFeePerGas ?? 1_000_000_000n;
  }

  async getOnChainStatus(jobId: HexHash): Promise<OnChainJobStatus> {
    const job = await this.#readContract('getJob', [jobId]);
    const status =
      typeof job === 'object' && job !== null && 'status' in job
        ? Number((job as { status: unknown }).status)
        : Number((job as readonly unknown[])[3]);
    return statusToOnChainStatus(status);
  }

  async executeLimitOrder(job: LimitOrderJob): Promise<ExecuteResult> {
    const onChainJobId = requireOnChainJobId(job.onChainJobId, job.id);
    const swapCalldata = this.#swapCalldata(
      job.params.amountIn,
      job.params.tokenIn,
      job.params.tokenOut,
      job.owner,
      job.params.minAmountOut,
    );
    return this.#executeAutomationCall('executeLimitOrder', onChainJobId, swapCalldata, job.owner);
  }

  async executeDCATick(job: DCAJob): Promise<ExecuteResult> {
    const onChainJobId = requireOnChainJobId(job.onChainJobId, job.id);
    const swapCalldata = this.#swapCalldata(
      job.params.amountPerSwap,
      job.params.tokenIn,
      job.params.tokenOut,
      job.owner,
    );
    const result = await this.#executeAutomationCall(
      'executeDCATick',
      onChainJobId,
      swapCalldata,
      job.owner,
    );
    const dca = await this.#readContract('getDCAJob', [onChainJobId]);
    const nextExecution = Number(
      (dca as { nextExecution?: unknown }).nextExecution ?? (dca as readonly unknown[])[6],
    );
    return {
      ...result,
      ...(Number.isFinite(nextExecution) ? { nextExecutionSec: nextExecution } : {}),
    };
  }

  async executeTWAPTick(job: TWAPJob): Promise<ExecuteResult> {
    const trancheAmount = job.params.amountIn / BigInt(job.params.trancheCount);
    const calldata = this.#swapCalldata(
      trancheAmount,
      job.params.tokenIn,
      job.params.tokenOut,
      job.owner,
      job.params.minAmountOut,
    );
    const result = await this.#sendContractTransaction(this.swappiRouter, calldata, job.owner);
    return {
      ...result,
      nextExecutionSec: job.params.nextExecution + job.params.trancheIntervalSeconds,
    };
  }

  async executeSwap(job: SwapJob): Promise<ExecuteResult> {
    const calldata = this.#swapCalldata(
      job.params.amountIn,
      job.params.tokenIn,
      job.params.tokenOut,
      job.owner,
      job.params.minAmountOut,
    );
    return this.#sendContractTransaction(this.swappiRouter, calldata, job.owner);
  }

  async #executeAutomationCall(
    functionName: 'executeLimitOrder' | 'executeDCATick',
    jobId: HexHash,
    swapCalldata: Hex,
    recipient: HexAddress,
  ): Promise<ExecuteResult> {
    await this.#preflightCheck();
    const data = encodeFunctionData({
      abi: AUTOMATION_MANAGER_ABI,
      functionName,
      args: [jobId, this.swappiRouter, swapCalldata],
    });
    return this.#sendContractTransaction(this.contractAddress, data, recipient, false);
  }

  async #sendContractTransaction(
    to: HexAddress,
    data: Hex,
    recipient: HexAddress,
    preflight = true,
  ): Promise<ExecuteResult> {
    if (preflight) await this.#preflightCheck();
    const from = this.#signer.account.address;
    const [nonceHex, gas, block] = await Promise.all([
      this.#client.request<Hex>({ method: 'eth_getTransactionCount', params: [from, 'pending'] }),
      this.#client.estimateGas({ from, to, data } as never),
      this.#client.getBlock('latest'),
    ]);
    const baseFeePerGas =
      (block as unknown as { baseFeePerGas?: bigint }).baseFeePerGas ?? 1_000_000_000n;
    const tx: SignableTx = {
      family: 'espace',
      chainId: this.#client.chain.id,
      to,
      data,
      nonce: Number(hexToBigInt(nonceHex)),
      gas,
      maxFeePerGas: baseFeePerGas * 2n + this.#maxPriorityFeePerGas,
      maxPriorityFeePerGas: this.#maxPriorityFeePerGas,
    };
    const raw = await this.#signer.signTransaction(tx);
    const txHash = await this.#client.sendRawTransaction(raw);
    const receipt = await waitForTransactionReceipt(this.#client, txHash, {
      timeoutMs: this.#receiptTimeoutMs,
      intervalMs: this.#receiptIntervalMs,
    });
    const amountOut = decodeAmountOut(receiptToSwapReceipt(receipt), recipient);
    return { txHash, ...(amountOut !== undefined ? { amountOut } : {}) };
  }

  async #preflightCheck(): Promise<void> {
    const paused = await this.#readContract('paused', []);
    if (paused === true) throw new Error('AutomationManager is paused on-chain');
    const gasPrice = await this.#client.getGasPrice();
    const gasPriceGwei = gasPrice / 1_000_000_000n;
    if (gasPriceGwei > BigInt(this.maxGasPriceGwei)) {
      throw new Error(`Gas price ${gasPriceGwei} gwei exceeds cap ${this.maxGasPriceGwei} gwei`);
    }
  }

  async #readContract(functionName: 'getJob' | 'getDCAJob' | 'paused', args: readonly unknown[]) {
    const data = encodeFunctionData({
      abi: AUTOMATION_MANAGER_ABI,
      functionName,
      args,
    } as never);
    const raw = await this.#client.request<Hex>({
      method: 'eth_call',
      params: [{ to: this.contractAddress, data }, 'latest'],
    });
    return decodeFunctionResult({
      abi: AUTOMATION_MANAGER_ABI,
      functionName,
      data: raw,
    } as never);
  }

  #swapCalldata(
    amountIn: bigint,
    tokenIn: HexAddress,
    tokenOut: HexAddress,
    recipient: HexAddress,
    amountOutMin?: bigint,
  ): Hex {
    return buildSwapCalldata({
      tokenIn,
      tokenOut,
      amountIn,
      recipient,
      deadline: BigInt(Math.floor(Date.now() / 1000) + this.#defaultDeadlineSeconds),
      ...(amountOutMin !== undefined ? { amountOutMin } : {}),
    });
  }
}
