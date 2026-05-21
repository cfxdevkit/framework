# `@cfxdevkit/automation` — Public API

> Automation strategies (limit, dca, stop-loss, scheduled).

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 92 symbols |
| `./db` | 11 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/automation";
export declare const PRICE_SCALE: bigint;
export declare const DEFAULT_DCA_DUE_BUFFER_SECONDS = 15;
export declare const AUTOMATION_MANAGER_ADDRESSES: {
export declare const AUTOMATION_MANAGER_ABI: readonly [
export declare const DEFAULT_SAFETY_CONFIG: SafetyConfig;
export declare const SWAPPI_ROUTER_ABI: readonly [
export declare const SWAPPI_ADDRESSES: {
export interface PriceSource {
export interface LimitOrderCheckResult {
export interface DCACheckResult {
export interface KeeperClient {
export interface AutomationManagerActions {
export interface AutomationManagerClientConfig {
export interface KeeperClientImplConfig {
export interface KeeperConfig {
export interface KeeperDeps {
export interface GeckoTerminalPriceSourceOptions {
export interface SwappiQuoteReader {
export interface SwappiPriceSourceOptions {
export interface JobListFilter {
export interface JobUpdate {
export interface JobRepository {
export interface ExecutionRecord {
export interface NewExecutionRecord {
export interface ExecutionRepository {
export interface RetryQueueOptions {
export interface SafetyConfig {
export interface SafetyContext {
export interface SafetyViolation {
export interface SafetyCheckResult {
export interface LimitOrderStrategy {
export interface DCAStrategy {
export interface TWAPStrategy {
export interface SwapStrategy {
export interface StrategyEvalContext {
export interface StrategyEvaluator<TJob extends ExecutableJob = ExecutableJob> {
export interface BuildSwapCalldataInput {
export interface SwapExecutorClient {
export interface SwapExecutorOptions {
export interface SwapRouterAddresses {
export interface SwapQuoteInput {
export interface SwapExecuteInput extends SwapQuoteInput {
export interface SwapExecuteResult {
export interface SwapReceiptLog {
export interface SwapReceipt {
export interface BaseJobParams {
export interface LimitOrderParams extends BaseJobParams {
export interface DCAParams extends BaseJobParams {
export interface TWAPParams extends BaseJobParams {
export interface SwapParams extends BaseJobParams {
export interface BaseJob<TType extends JobType, TParams> {
export interface ExecuteResult {
export interface TickResult {
export interface EvalResult {
export declare class PriceChecker {
export declare class AutomationManagerClient implements KeeperClient {
export declare class KeeperClientImpl implements KeeperClient {
export declare class Keeper {
export declare class GeckoTerminalPriceSource implements PriceSource {
export declare class SwappiPriceSource implements PriceSource {
export declare class MemoryJobRepository implements JobRepository {
export declare class MemoryExecutionRepository implements ExecutionRepository {
export declare class RetryQueue {
export declare class SafetyGuard {
export declare class DCAEvaluator implements StrategyEvaluator<DCAJob> {
export declare class LimitOrderEvaluator implements StrategyEvaluator<LimitOrderJob> {
export declare class SwapEvaluator implements StrategyEvaluator<SwapJob> {
export declare class TWAPEvaluator implements StrategyEvaluator<TWAPJob> {
export declare class SwapExecutor {
export declare function estimateUsdValue(amount: bigint, price: bigint, tokenDecimals?: number): number;
export declare function isDCADue(params: DCAParams, nowSec: number, bufferSec?: number): boolean;
export declare function isExpired(job: Job, nowSec: number): boolean;
export declare function decimalToScaled(value: number, decimals?: number): bigint;
export declare function buildSwapCalldata(input: BuildSwapCalldataInput): Hex;
export declare function decodeAmountOut(receipt: SwapReceipt, recipient: HexAddress): bigint | undefined;
export declare function transferTopic(): Hex;
export declare function isExecutableJob(job: Job): job is ExecutableJob;
export type NewJobInput = Omit<Job, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retries'> & {
export type Strategy = LimitOrderStrategy | DCAStrategy | TWAPStrategy | SwapStrategy;
export type HexAddress = `0x${string}`;
export type HexHash = `0x${string}`;
export type JobType = 'limit_order' | 'dca' | 'twap' | 'swap';
export type JobStatus = 'pending' | 'active' | 'executed' | 'cancelled' | 'failed' | 'expired' | 'paused';
export type TriggerDirection = 'gte' | 'lte';
export type LimitOrderJob = BaseJob<'limit_order', LimitOrderParams>;
export type DCAJob = BaseJob<'dca', DCAParams>;
export type TWAPJob = BaseJob<'twap', TWAPParams>;
export type SwapJob = BaseJob<'swap', SwapParams>;
export type Job = LimitOrderJob | DCAJob | TWAPJob | SwapJob;
export type ExecutableJob = LimitOrderJob | DCAJob | TWAPJob | SwapJob;
export type OnChainJobStatus = 'active' | 'executed' | 'cancelled' | 'expired';
```

---

## `./db`

```ts
export { DrizzleExecutionRepositoryOptions }
export { DrizzleExecutionRepository }
export { DrizzleJobRepositoryOptions }
export { DrizzleJobRepository }
export { AutomationSqlite }
export { createSqliteDb }
export { initializeSqliteSchema }
export declare const jobs: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
export declare const executions: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
export declare const workerHeartbeat: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
export declare const settings: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
```

<!-- api-hash: b14213ac5485112d7dba46b4f9cf5b3508291429d487f7677f72b2a818577ca7 -->
