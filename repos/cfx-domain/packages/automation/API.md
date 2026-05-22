# `@cfxdevkit/automation` — Public API

> Automation strategies (limit, dca, stop-loss, scheduled).

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 92 symbols |
| `./db` | 11 symbols |

---

## `.`

### Usage

```ts
import { Keeper, DCAStrategy } from '@cfxdevkit/automation';

const keeper = new Keeper(config);
await keeper.run();
```

```ts
// Package name identifier for runtime introspection
export declare const __packageName: "@cfxdevkit/automation";
// Scaling factor used for price calculations
export declare const PRICE_SCALE: bigint;
// Default buffer in seconds for DCA execution timing
export declare const DEFAULT_DCA_DUE_BUFFER_SECONDS = 15;
// Mapping of automation manager addresses across networks
export declare const AUTOMATION_MANAGER_ADDRESSES: {
// ABI for the automation manager contract
export declare const AUTOMATION_MANAGER_ABI: readonly [
// Default safety configuration for automation execution
export declare const DEFAULT_SAFETY_CONFIG: SafetyConfig;
// ABI for the Swappi router contract
export declare const SWAPPI_ROUTER_ABI: readonly [
// Mapping of Swappi related addresses
export declare const SWAPPI_ADDRESSES: {
// Interface for providing token price data
export interface PriceSource {
// Result of a limit order condition check
export interface LimitOrderCheckResult {
// Result of a DCA timing check
export interface DCACheckResult {
// Interface for the keeper client implementation
export interface KeeperClient {
// Available actions for the automation manager
export interface AutomationManagerActions {
// Configuration for the automation manager client
export interface AutomationManagerClientConfig {
// Configuration for the keeper client implementation
export interface KeeperClientImplConfig {
// Configuration for the keeper instance
export interface KeeperConfig {
// Dependencies required by the keeper
export interface KeeperDeps {
// Options for the GeckoTerminal price source
export interface GeckoTerminalPriceSourceOptions {
// Interface for reading quotes from Swappi
export interface SwappiQuoteReader {
// Options for the Swappi price source
export interface SwappiPriceSourceOptions {
// Filter criteria for retrieving job lists
export interface JobListFilter {
// Represents an update to a job
export interface JobUpdate {
// Interface for job persistence and retrieval
export interface JobRepository {
// Record of a single job execution
export interface ExecutionRecord {
// Data required to create a new execution record
export interface NewExecutionRecord {
// Interface for execution history persistence
export interface ExecutionRepository {
// Options for the retry queue mechanism
export interface RetryQueueOptions {
// Configuration for safety constraints
export interface SafetyConfig {
// Context provided during safety evaluations
export interface SafetyContext {
// Details of a safety constraint violation
export interface SafetyViolation {
// Result of a safety check evaluation
export interface SafetyCheckResult {
// Parameters for a limit order strategy
export interface LimitOrderStrategy {
// Parameters for a DCA strategy
export interface DCAStrategy {
// Parameters for a TWAP strategy
export interface TWAPStrategy {
// Parameters for a swap strategy
export interface SwapStrategy {
// Context for strategy evaluation
export interface StrategyEvalContext {
// Interface for evaluating if a job should be executed
export interface StrategyEvaluator<TJob extends ExecutableJob = ExecutableJob> {
// Input for building swap calldata
export interface BuildSwapCalldataInput {
// Interface for the swap executor client
export interface SwapExecutorClient {
// Options for the swap executor
export interface SwapExecutorOptions {
// Addresses for various swap routers
export interface SwapRouterAddresses {
// Input for requesting a swap quote
export interface SwapQuoteInput {
// Input for executing a swap
export interface SwapExecuteInput extends SwapQuoteInput {
// Result of a swap execution
export interface SwapExecuteResult {
// Log data extracted from a swap receipt
export interface SwapReceiptLog {
// Receipt containing details of a swap transaction
export interface SwapReceipt {
// Common parameters for all job types
export interface BaseJobParams {
// Parameters specific to limit order jobs
export interface LimitOrderParams extends BaseJobParams {
// Parameters specific to DCA jobs
export interface DCAParams extends BaseJobParams {
// Parameters specific to TWAP jobs
export interface TWAPParams extends BaseJobParams {
// Parameters specific to swap jobs
export interface SwapParams extends BaseJobParams {
// Base structure for a job
export interface BaseJob<TType extends JobType, TParams> {
// Result of a job execution attempt
export interface ExecuteResult {
// Result of a single strategy tick
export interface TickResult {
// Result of a strategy evaluation
export interface EvalResult {
// Class for checking price conditions
export declare class PriceChecker {
// Client for interacting with the automation manager
export declare class AutomationManagerClient implements KeeperClient {
// Implementation of the keeper client
export declare class KeeperClientImpl implements KeeperClient {
// Main class for managing and running automation jobs
export declare class Keeper {
// Price source implementation using GeckoTerminal
export declare class GeckoTerminalPriceSource implements PriceSource {
// Price source implementation using Swappi
export declare class SwappiPriceSource implements PriceSource {
// In-memory implementation of the job repository
export declare const MemoryJobRepository implements JobRepository {
// In-memory implementation of the execution repository
export declare const MemoryExecutionRepository implements ExecutionRepository {
// Queue for managing job retries
export declare class RetryQueue {
// Class for enforcing safety rules during execution
export declare class SafetyGuard {
// Evaluator for DCA strategy jobs
export declare class DCAEvaluator implements StrategyEvaluator<DCAJob> {
// Evaluator for limit order strategy jobs
export declare class LimitOrderEvaluator implements StrategyEvaluator<LimitOrderJob> {
// Evaluator for swap strategy jobs
export declare class SwapEvaluator implements StrategyEvaluator<SwapJob> {
// Evaluator for TWAP strategy jobs
export declare class TWAPEvaluator implements StrategyEvaluator<TWAPJob> {
// Class responsible for executing swap transactions
export declare class SwapExecutor {
// Estimates the USD value of an amount
export declare function estimateUsdValue(amount: bigint, price: bigint, tokenDecimals?: number): number;
// Checks if a DCA job is due for execution
export declare function isDCADue(params: DCAParams, nowSec: number, bufferSec?: number): boolean;
// Checks if a job has expired
export declare function isExpired(job: Job, nowSec: number): boolean;
// Converts a decimal number to a scaled bigint
export declare function decimalToScaled(value: number, decimals?: number): bigint;
// Builds calldata for a swap transaction
export declare function buildSwapCalldata(input: BuildSwapCalldataInput): Hex;
// Decodes the amount out from a swap receipt
export declare function decodeAmountOut(receipt: SwapReceipt, recipient: HexAddress): bigint | undefined;
// Returns the transfer event topic hash
export declare function transferTopic(): Hex;
// Type guard to check if a job is executable
export declare function isExecutableJob(job: Job): job is ExecutableJob;
// Type for creating a new job from partial data
export type NewJobInput = Omit<Job, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retries'> & {
// Union of all available strategy types
export type Strategy = LimitOrderStrategy | DCAStrategy | TWAPStrategy | SwapStrategy;
// Hexadecimal address type
export type HexAddress = `0x${string}`;
// Hexadecimal hash type
export type HexHash = `0x${string}`;
// Union of valid job type strings
export type JobType = 'limit_order' | 'dca' | 'twap' | 'swap';
// Union of valid job status strings
export type JobStatus = 'pending' | 'active' | 'executed' | 'cancelled' | 'failed' | 'expired' | 'paused';
// Comparison direction for triggers
export type TriggerDirection = 'gte' | 'lte';
// Type for limit order jobs
export declare type LimitOrderJob = BaseJob<'limit_order', LimitOrderParams>;
// Type for DCA jobs
export declare type DCAJob = BaseJob<'dca', DCAParams>;
// Type for TWAP jobs
export declare type TWAPJob = BaseJob<'twap', TWAPParams>;
// Type for swap jobs
export declare type SwapJob = BaseJob<'swap', SwapParams>;
// Union of all job types
export type Job = LimitOrderJob | DCAJob | TWAPJob | SwapJob;
// Union of jobs that are eligible for execution
export type ExecutableJob = LimitOrderJob | DCAJob | TWAPJob | SwapJob;
// Statuses as they appear on-chain
export type OnChainJobStatus = 'active' | 'executed' | 'cancelled' | 'expired';
```

---

## `./db`

### Usage

```ts
import { createSqliteDb, DrizzleJobRepository } from '@cfxdevkit/automation/db';

const db = createSqliteDb('automation.db');
const jobRepo = new DrizzleJobRepository(db);
```

```ts
// Options for the Drizzle execution repository
export { DrizzleExecutionRepositoryOptions }
// Drizzle-based implementation of the execution repository
export { DrizzleExecutionRepository }
// Options for the Drizzle job repository
export { DrizzleJobRepositoryOptions }
// Drizzle-based implementation of the job repository
export { DrizzleJobRepository }
// SQLite database instance for automation
export declare const AutomationSqlite
// Helper to create a SQLite database connection
export { createSqliteDb }
// Helper to initialize the SQLite database schema
export { initializeSqliteSchema }
// Drizzle table definition for jobs
export declare const jobs: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
// Drizzle table definition for executions
export declare const executions: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
// Drizzle table definition for worker heartbeats
export declare const workerHeartbeat: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
// Drizzle table definition for settings
export declare const settings: import('drizzle-orm/sqlite-core').SQLiteTableWithColumns<{
```

<!-- api-hash: b14213ac5485112d7dba46b4f9cf5b3508291429d487f7677f72b2a818577ca7 -->
