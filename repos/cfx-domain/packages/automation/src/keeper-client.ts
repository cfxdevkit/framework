import type {
  DCAJob,
  ExecuteResult,
  HexAddress,
  HexHash,
  LimitOrderJob,
  OnChainJobStatus,
} from './types.js';

export interface KeeperClient {
  executeLimitOrder(job: LimitOrderJob): Promise<ExecuteResult>;
  executeDCATick(job: DCAJob): Promise<ExecuteResult>;
  getOnChainStatus(jobId: HexHash): Promise<OnChainJobStatus>;
}

export interface AutomationManagerActions {
  executeLimitOrder(job: LimitOrderJob): Promise<ExecuteResult>;
  executeDCATick(job: DCAJob): Promise<ExecuteResult>;
  getOnChainStatus(jobId: HexHash): Promise<OnChainJobStatus>;
}

export interface AutomationManagerClientConfig {
  contractAddress: HexAddress;
  swappiRouter?: HexAddress;
  maxGasPriceGwei?: number;
  actions: AutomationManagerActions;
}

export const AUTOMATION_MANAGER_ABI = [
  {
    type: 'function',
    name: 'executeLimitOrder',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeDCATick',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getJobStatus',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    outputs: [{ name: 'status', type: 'uint8' }],
  },
  {
    type: 'event',
    name: 'JobExecuted',
    inputs: [
      { name: 'jobId', type: 'bytes32', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
] as const;

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

  getOnChainStatus(jobId: HexHash): Promise<OnChainJobStatus> {
    return this.#actions.getOnChainStatus(jobId);
  }
}
