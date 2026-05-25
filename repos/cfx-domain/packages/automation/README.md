# @cfxdevkit/automation

**Scope:** Off-chain automation strategies executable by `framework/executor`.

**Responsibilities**
- Strategy interface (`evaluate`, `buildTx`, `verify`)
- Built-in strategies: limit order, DCA, TWAP, condition-based swaps
- Strategy persistence schema (via `JobRepository`, `ExecutionRepository`)
- Backtesting helpers (via `PriceChecker`, `SwappiPriceSource`, `GeckoTerminalPriceSource`)
- Safety checks and retry logic (via `SafetyConfig`, `RetryQueue`)

**Non-goals**
- Keeper transport / queue (lives in `framework/executor`).
- Project-specific UI (lives in `projects/cas/apps/frontend`).

**Origin:** `cas/conflux-cas/worker` patterns + `cas/conflux-sdk` automation types.

## Installation

```bash
npm install @cfxdevkit/automation
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 92 symbols |
| `./db` | 11 symbols |

## Key Concepts

### Strategies

Strategies define *when* and *how* to execute an automation job. Each strategy implements:

- `evaluate(context: StrategyEvalContext): EvalResult` — determines if job should run
- `buildTx(params: TParams): BuildSwapCalldataInput` — constructs transaction calldata
- `verify(result: ExecuteResult): boolean` — confirms successful execution

Supported strategies:
- `LimitOrderStrategy`
- `DCAStrategy`
- `TWAPStrategy`
- `SwapStrategy` (for condition-based swaps)

### Execution Flow

1. `Keeper` polls `JobRepository` for active jobs.
2. For each job, `StrategyEvaluator` runs `evaluate()` using `PriceSource`.
3. If triggered, `buildTx()` prepares calldata.
4. `SwapExecutorClient` submits transaction via `AutomationManager`.
5. `ExecutionRepository` records outcome; `RetryQueue` handles failures.

### Safety & Reliability

- `SafetyConfig` defines thresholds (e.g., max slippage, price deviation).
- `SafetyContext` and `SafetyCheckResult` enforce constraints before execution.
- `RetryQueue` manages transient failures with exponential backoff.

## Usage

### Create a Limit Order Job

```ts
import {
  LimitOrderStrategy,
  MemoryJobRepository,
  SwappiPriceSource,
  PriceChecker,
  DEFAULT_SAFETY_CONFIG,
} from '@cfxdevkit/automation';

const priceSource = new SwappiPriceSource({
  routerAddress: SWAPPI_ADDRESSES.router,
  quoteReader: new SwappiQuoteReader(),
});

const jobRepo = new MemoryJobRepository();
const priceChecker = new PriceChecker(priceSource, DEFAULT_SAFETY_CONFIG);

const strategy = new LimitOrderStrategy(priceChecker);

const job = {
  id: 'limit-0x123',
  type: 'LIMIT_ORDER',
  params: {
    tokenIn: '0x...',
    tokenOut: '0x...',
    amountIn: 1_000_000n,
    amountOutMin: 950_000n,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  },
  strategy: strategy,
};

await jobRepo.add(job);
```

### Run the Keeper

```ts
import { Keeper } from '@cfxdevkit/automation';

const keeper = new Keeper({
  jobRepo,
  executionRepo: new MemoryExecutionRepository(),
  retryQueue: { maxRetries: 3, baseDelayMs: 1000 },
  priceSource,
  safetyConfig: DEFAULT_SAFETY_CONFIG,
});

keeper.start();
```

### Backtest with Historical Prices

```ts
import { GeckoTerminalPriceSource } from '@cfxdevkit/automation';

const historicalSource = new GeckoTerminalPriceSource({
  poolAddress: '0x...',
  network: 'conflux-espace',
});

const backtestResult = await priceChecker.evaluate({
  job,
  timestamp: 1700000000,
  priceSource: historicalSource,
});
```

## API Reference

See full exports in [API.md](./API.md). Key classes include:

- `AutomationManagerClient` — interacts with on-chain automation manager
- `KeeperClientImpl` — low-level keeper client for custom transports
- `SwappiPriceSource` / `GeckoTerminalPriceSource` — price feeds
- `MemoryJobRepository` / `MemoryExecutionRepository` — in-memory storage (use for testing)
- `RetryQueue` — handles failed executions

> **Note:** For production use, implement custom `JobRepository` and `ExecutionRepository` backed by persistent storage (e.g., PostgreSQL, Redis).

### API REFERENCE EXCERPT

```ts
export declare const __packageName: "@cfxdevkit/automation";
export declare const PRICE_SCALE: bigint;
export declare const DEFAULT_DCA_DUE_BUFFER_SECONDS = 15;
export declare const AUTOMATION_MANAGER_ADDRESSES: {
  confluxESpace: string;
  confluxCore: string;
};
export declare const AUTOMATION_MANAGER_ABI: readonly [
  // ... ABI entries
];
export declare const DEFAULT_SAFETY_CONFIG: SafetyConfig;
export declare const SWAPPI_ROUTER_ABI: readonly [
  // ... ABI entries
];
export declare const SWAPPI_ADDRESSES: {
  confluxESpace: string;
  confluxCore: string;
};

export interface PriceSource {
  getSpotPrice(tokenIn: string, tokenOut: string): Promise<bigint>;
  getHistoricalPrice(tokenIn: string, tokenOut: string, timestamp: number): Promise<bigint>;
}

export interface LimitOrderCheckResult {
  triggered: boolean;
  reason?: string;
}

export interface DCACheckResult {
  due: boolean;
  nextDueTime?: number;
}

export interface KeeperClient {
  execute(job: ExecutableJob): Promise<ExecuteResult>;
}

export interface AutomationManagerActions {
  execute(job: ExecutableJob): Promise<ExecuteResult>;
}

export interface AutomationManagerClientConfig {
  chainId: number;
  signer: Signer;
}

export interface KeeperClientImplConfig {
  automationManager: AutomationManagerActions;
}

export interface KeeperConfig {
  jobRepo: JobRepository;
  executionRepo: ExecutionRepository;
  retryQueue: RetryQueueOptions;
  priceSource: PriceSource;
  safetyConfig: SafetyConfig;
}

export interface KeeperDeps {
  jobRepo: JobRepository;
  executionRepo: ExecutionRepository;
  retryQueue: RetryQueue;
  priceSource: PriceSource;
  safetyConfig: SafetyConfig;
}

export interface GeckoTerminalPriceSourceOptions {
  poolAddress: string;
  network: 'conflux-espace' | 'conflux-core';
}

export interface SwappiQuoteReader {
  getSwapQuote(input: SwapQuoteInput): Promise<SwapExecuteResult>;
}

export interface SwappiPriceSourceOptions {
  routerAddress: string;
  quoteReader: SwappiQuoteReader;
}

export interface JobListFilter {
  status?: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  type?: JobType;
}

export interface JobUpdate {
  status?: 'ACTIVE' | 'COMPLETED' | 'FAILED';
}

export interface JobRepository {
  add(job: ExecutableJob): Promise<void>;
  get(id: string): Promise<ExecutableJob | null>;
  list(filter?: JobListFilter): Promise<ExecutableJob[]>;
  update(id: string, update: JobUpdate): Promise<void>;
}

export interface ExecutionRecord {
  id: string;
  jobId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  timestamp: number;
  txHash?: string;
  error?: string;
}

export interface NewExecutionRecord {
  jobId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  txHash?: string;
  error?: string;
}

export interface ExecutionRepository {
  add(record: NewExecutionRecord): Promise<void>;
  listByJob(jobId: string): Promise<ExecutionRecord[]>;
}

export interface RetryQueueOptions {
  maxRetries: number;
  baseDelayMs: number;
}

export interface SafetyConfig {
  maxSlippageBps: number;
  maxPriceDeviationBps: number;
}

export interface SafetyContext {
  job: ExecutableJob;
  currentPrice: bigint;
  expectedPrice?: bigint;
}

export interface SafetyViolation {
  type: 'SLIPPAGE' | 'PRICE_DEVIATION';
  message: string;
}

export interface SafetyCheckResult {
  passed: boolean;
  violations?: SafetyViolation[];
}

export interface LimitOrderStrategy {
  evaluate(context: StrategyEvalContext): Promise<LimitOrderCheckResult>;
  buildTx(params: LimitOrderParams): BuildSwapCalldataInput;
  verify(result: ExecuteResult): boolean;
}

export interface DCAStrategy {
  evaluate(context: StrategyEvalContext): Promise<DCACheckResult>;
  buildTx(params: DCAParams): BuildSwapCalldataInput;
  verify(result: ExecuteResult): boolean;
}

export interface TWAPStrategy {
  evaluate(context: StrategyEvalContext): Promise<EvalResult>;
  buildTx(params: TWAPParams): BuildSwapCalldataInput;
  verify(result: ExecuteResult): boolean;
}

export interface SwapStrategy {
  evaluate(context: StrategyEvalContext): Promise<EvalResult>;
  buildTx(params: SwapParams): BuildSwapCalldataInput;
  verify(result: ExecuteResult): boolean;
}

export interface StrategyEvalContext {
  job: ExecutableJob;
  timestamp: number;
  priceSource: PriceSource;
}

export interface StrategyEvaluator<TJob extends ExecutableJob = ExecutableJob> {
  evaluate(job: TJob, context: StrategyEvalContext): Promise<EvalResult>;
}

export interface BuildSwapCalldataInput {
  calldata: string;
  value?: bigint;
}

export interface SwapExecutorClient {
  execute(input: SwapExecuteInput): Promise<ExecuteResult>;
}

export interface SwapExecutorOptions {
  chainId: number;
  signer: Signer;
}

export interface SwapRouterAddresses {
  router: string;
  factory: string;
}

export interface SwapQuoteInput {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  recipient: string;
}

export interface SwapExecuteInput extends SwapQuoteInput {
  deadline: bigint;
  slippageTolerance: number;
}

export interface SwapExecuteResult {
  amountOut: bigint;
  path: string[];
}

export interface SwapReceiptLog {
  address: string;
  topics: string[];
  data: string;
}

export interface SwapReceipt {
  status: number;
  logs: SwapReceiptLog[];
}

export interface BaseJobParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
}

export interface LimitOrderParams extends BaseJobParams {
  amountOutMin: bigint;
  deadline: bigint;
}

export interface DCAParams extends BaseJobParams {
  amountOutMin: bigint;
  intervalSeconds: number;
  totalDurationSeconds: number;
  totalAmountIn: bigint;
}

export interface TWAPParams extends BaseJobParams {
  amountOutMin: bigint;
  durationSeconds: number;
  intervalSeconds: number;
}

export interface SwapParams extends BaseJobParams {
  amountOutMin: bigint;
  deadline: bigint;
  condition: 'BELOW' | 'ABOVE';
  threshold: bigint;
}

export interface BaseJob<TType extends JobType, TParams> {
  id: string;
  type: TType;
  params: TParams;
  strategy: Strategy;
}

export interface ExecuteResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface TickResult {
  nextTickTime?: number;
}

export interface EvalResult {
  triggered: boolean;
  tickResult?: TickResult;
}

export declare class PriceChecker {
  constructor(priceSource: PriceSource, config: SafetyConfig);
  evaluate(context: StrategyEvalContext): Promise<EvalResult>;
}

export declare class AutomationManagerClient implements KeeperClient {
  constructor(config: AutomationManagerClientConfig);
  execute(job: ExecutableJob): Promise<ExecuteResult>;
}

export declare class KeeperClientImpl implements KeeperClient {
  constructor(config: KeeperClientImplConfig);
  execute(job: ExecutableJob): Promise<ExecuteResult>;
}

export declare class Keeper {
  constructor(config: KeeperConfig);
  start(): void;
  stop(): void;
}

export declare class GeckoTerminalPriceSource implements PriceSource {
  constructor(options: GeckoTerminalPriceSourceOptions);
  getSpotPrice(tokenIn: string, tokenOut: string): Promise<bigint>;
  getHistoricalPrice(tokenIn: string, tokenOut: string, timestamp: number): Promise<bigint>;
}

export declare class SwappiPriceSource implements PriceSource {
  constructor(options: SwappiPriceSourceOptions);
  getSpotPrice(tokenIn: string, tokenOut: string): Promise<bigint>;
  getHistoricalPrice(tokenIn: string, tokenOut: string, timestamp: number): Promise<bigint>;
}

export declare class MemoryJobRepository implements JobRepository {
  add(job: ExecutableJob): Promise<void>;
  get(id: string): Promise<ExecutableJob | null>;
  list(filter?: JobListFilter): Promise<ExecutableJob[]>;
  update(id: string, update: JobUpdate): Promise<void>;
}

export declare class MemoryExecutionRepository implements ExecutionRepository {
  add(record: NewExecutionRecord): Promise<void>;
  listByJob(jobId: string): Promise<ExecutionRecord[]>;
}
```

## Tier

**Tier 2 — domains** — May import Tier 0 and Tier 1 packages.

<!-- readme-hash: b9c30d4fc225451ef4179abfd0c29376485b36fa8ae69b463b4e3cfdf715f28a -->
