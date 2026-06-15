# `@cfxdevkit/devnode-core` — Public API

> Lightweight Hono control plane for Conflux devnode — node control, compilation, and mining. No keystore or wallet deps.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 39 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/devnode-core";
export interface DevnodeCoreAppOptions extends DevnodeServerControllerOptions, AccountsRoutesOptions {
export interface DevnodeCoreExtensionContext {
export interface ContractRecord {
export interface ContractListFilter {
export interface ContractRegistryOptions {
export interface NetworkConfig {
export interface NetworkChainIds {
export interface NetworkCapabilities {
export interface NetworkProfile {
export interface NetworkStateOptions {
export interface AccountsRoutesOptions {
export interface DevnodeServerControllerOptions {
export interface DevnodeStartInput {
export interface DevnodeRestartInput {
export interface DevnodeWipeInput {
export interface DevnodeMineInput {
export interface DevnodeServerStatus {
export declare function createDevnodeCoreApp(options?: DevnodeCoreAppOptions): Hono;
export declare function detectSpace(address: string): 'core' | 'espace';
export declare function chainIdForContractNetwork(network: ContractNetwork, space: 'core' | 'espace'): number;
export declare function defaultNetworkConfig(network: Network): NetworkConfig;
export declare function defaultNetworkChainIds(network: Network): NetworkChainIds;
export declare function createAccountsRoutes(controller: DevnodeServerController, options?: AccountsRoutesOptions): Hono;
export declare function sendCoreFunds(input: {
export declare function sendEspaceFunds(input: {
export declare function createCompilerRoutes(): Hono;
export declare function createMiningRoutes(controller: DevnodeServerController): Hono;
export declare function createNetworkRoutes(state: NetworkState, options?: {
export type ContractNetwork = 'local' | 'testnet' | 'mainnet';
export type Network = 'local' | 'testnet' | 'mainnet';
export type NetworkMode = 'local' | 'public';
export type PersistedNetworkConfigKey = keyof NetworkConfig | 'coreChainId' | 'espaceChainId';
export type SendFundsImpl = typeof defaultSendCoreFunds;
export type SendEspaceFundsImpl = typeof defaultSendEspaceFunds;
export type DevnodeServerNodeFactory = (config?: DevNodeConfig) => DevNode;
export declare class ContractRegistry {
export declare class DevnodeServerController {
export declare class NetworkState {
```

<!-- api-hash: f089029640894d26128e30cb2d6229e82932b586a0f63e66d1646c01f54d972c -->
