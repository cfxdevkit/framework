# `@cfxdevkit/devnode-server` — Public API

> Shared Hono control plane for the local Conflux dev node.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 34 symbols |
| `./cli` | 8 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/devnode-server";
export interface DevnodeServerAppOptions extends DevnodeServerControllerOptions {
export interface DevnodeServerExtensionContext {
export interface ContractRecord {
export interface ContractListFilter {
export interface ContractRegistryOptions {
export interface NetworkConfig {
export interface NetworkChainIds {
export interface NetworkCapabilities {
export interface NetworkProfile {
export interface NetworkStateOptions {
export interface NodeProfileSummary {
export interface NodeProfileState {
export interface NodeProfileServiceOptions {
export interface DevnodeServerControllerOptions {
export interface DevnodeStartInput {
export interface DevnodeRestartInput {
export interface DevnodeWipeInput {
export interface DevnodeMineInput {
export interface DevnodeServerStatus {
export declare function createDevnodeServerApp(options?: DevnodeServerAppOptions): Hono;
export declare function detectSpace(address: string): 'core' | 'espace';
export declare function chainIdForContractNetwork(network: ContractNetwork, space: 'core' | 'espace'): number;
export declare function defaultNetworkConfig(network: Network): NetworkConfig;
export declare function defaultNetworkChainIds(network: Network): NetworkChainIds;
export type ContractNetwork = 'local' | 'testnet' | 'mainnet';
export type Network = 'local' | 'testnet' | 'mainnet';
export type NetworkMode = 'local' | 'public';
export type PersistedNetworkConfigKey = keyof NetworkConfig | 'coreChainId' | 'espaceChainId';
export type DevnodeServerNodeFactory = (config?: DevNodeConfig) => DevNode;
export declare class ContractRegistry {
export declare class DevnodeServerController {
export declare class NetworkState {
export declare class NodeProfileService {
```

---

## `./cli`

```ts
export declare const DEFAULT_HOST = "127.0.0.1";
export declare const DEFAULT_PORT = 52000;
export declare const DEFAULT_BASE_URL = "http://127.0.0.1:52000";
export type ParsedArgs = {
export declare function parseArgs(argv: string[]): ParsedArgs;
export declare function printHelp(): string;
export declare function executeCliCommand(parsed: Exclude<ParsedArgs, {
export declare function main(argv?: string[]): Promise<void>;
```

<!-- api-hash: c491be78ce4cf752b890e346a284dd1aedda9d18e0a3c23ad334f8514f4db5f3 -->
