# `@cfxdevkit/devnode-server` — Public API

> Shared Hono control plane for the local Conflux dev node.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 34 symbols |
| `./cli` | 8 symbols |

---

## `.`

### Usage

```ts
import { createDevnodeServerApp } from '@cfxdevkit/devnode-server';
const app = createDevnodeServerApp();
```

```ts
// The name of the package.
export declare const __packageName: "@cfxdevkit/devnode-server";
// Configuration options for the devnode server application.
export interface DevnodeServerAppOptions extends DevnodeServerControllerOptions {
// Context provided to server extensions.
export interface DevnodeServerExtensionContext {
// A record representing a contract.
export interface ContractRecord {
// Filter criteria for listing contracts.
export interface ContractListFilter {
// Configuration for the contract registry.
export interface ContractRegistryOptions {
// Configuration settings for a specific network.
export interface NetworkConfig {
// Mapping of chain IDs for different network spaces.
export interface NetworkChainIds {
// Capabilities supported by the network.
export interface NetworkCapabilities {
// Profile information for a network.
export interface NetworkProfile {
// Options for managing network state.
export interface NetworkStateOptions {
// A summary of the node's profile.
export interface NodeProfileSummary {
// The current state of the node profile.
export interface NodeProfileState {
// Configuration options for the node profile service.
export interface NodeProfileServiceOptions {
// Creates a Hono application for the devnode server.
export declare function createDevnodeServerApp(options?: DevnodeServerAppOptions): Hono;
// Detects whether an address belongs to the 'core' or 'espace' space.
export declare function detectSpace(address: string): 'core' | 'espace';
// Returns the chain ID for a given network and space.
export declare function chainIdForContractNetwork(network: ContractNetwork, space: 'core' | 'espace'): number;
// Returns the default configuration for a network.
export declare function defaultNetworkConfig(network: Network): NetworkConfig;
// Returns the default chain IDs for a network.
export declare function defaultNetworkChainIds(network: Network): NetworkChainIds;
// Supported contract network environments.
export type ContractNetwork = 'local' | 'testnet' | 'mainnet';
// Supported network environments.
export type Network = 'local' | 'testnet' | 'mainnet';
// Connection modes for the network.
export type NetworkMode = 'local' | 'public';
// Keys used for persisting network configuration.
export type PersistedNetworkConfigKey = keyof NetworkConfig | 'coreChainId' | 'espaceChainId';
// A factory function for creating devnodes.
export type DevnodeServerNodeFactory = (config?: DevNodeConfig) => DevNode;
// A registry for managing contract records.
export declare class ContractRegistry {
// The main controller for the devnode server.
export declare class DevnodeServerController {
// Manages the state of the network.
export declare class NetworkState {
// Service for managing node profiles.
export declare class NodeProfileService {
```

---

## `./cli`

### Usage

```ts
import { main } from '@cfxdevkit/devnode-server/cli';
main(process.argv);
```

```ts
// The default host address.
export declare const DEFAULT_HOST = "127.0.0.1";
// The default port number.
export declare const DEFAULT_PORT = 52000;
// The default base URL.
export declare const DEFAULT_BASE_URL = "http://127.0.0.1:52000";
// The structure of parsed command-line arguments.
export type ParsedArgs = {
// Parses command-line arguments into a structured object.
export declare function parseArgs(argv: string[]): ParsedArgs;
// Returns a help string for the CLI.
export declare function printHelp(): string;
// Executes a command based on the parsed arguments.
export declare function executeCliCommand(parsed: Exclude<ParsedArgs, {
// The main entry point for the CLI application.
export declare function main(argv?: string[]): Promise<void>;
```

<!-- api-hash: c491be78ce4cf752b890e346a284dd1aedda9d18e0a3c23ad334f8514f4db5f3 -->
