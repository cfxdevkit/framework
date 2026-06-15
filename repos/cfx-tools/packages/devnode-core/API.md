# `@cfxdevkit/devnode-core` — Public API

> Lightweight Hono control plane for Conflux devnode — node control, compilation, and mining. No keystore or wallet deps.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 39 symbols |

---

## `.`

```ts
// Package name constant for runtime identification.
export declare const __packageName: "@cfxdevkit/devnode-core";

// Options for initializing the DevnodeCoreApp, combining server controller and accounts route options.
export interface DevnodeCoreAppOptions extends DevnodeServerControllerOptions, AccountsRoutesOptions {
}

// Context object passed to DevnodeCore extensions for integration.
export interface DevnodeCoreExtensionContext {
}

// Represents a compiled contract record stored in the registry.
export interface ContractRecord {
}

// Filter criteria for querying the list of registered contracts.
export interface ContractListFilter {
}

// Configuration options for initializing the ContractRegistry.
export interface ContractRegistryOptions {
}

// Configuration object for a network, including chain IDs, endpoints, and capabilities.
export interface NetworkConfig {
}

// Mapping of chain IDs for Core and eSpace networks.
export interface NetworkChainIds {
}

// Set of optional capabilities supported by a network (e.g., debug, tracing).
export interface NetworkCapabilities {
}

// Profile metadata for a network (e.g., name, description, environment).
export interface NetworkProfile {
}

// Options for configuring the runtime state of a network.
export interface NetworkStateOptions {
}

// Options for configuring the accounts HTTP routes.
export interface AccountsRoutesOptions {
}

// Options for configuring the Devnode server controller (e.g., node factory, logging).
export interface DevnodeServerControllerOptions {
}

// Input payload for starting a new devnode instance.
export interface DevnodeStartInput {
}

// Input payload for restarting an existing devnode instance.
export interface DevnodeRestartInput {
}

// Input payload for wiping (resetting) a devnode instance.
export interface DevnodeWipeInput {
}

// Input payload for initiating or stopping mining on the devnode.
export interface DevnodeMineInput {
}

// Current status of the Devnode server (e.g., running, stopped, error).
export interface DevnodeServerStatus {
}

// Creates and configures a Hono application with all DevnodeCore routes and middleware.
export declare function createDevnodeCoreApp(options?: DevnodeCoreAppOptions): Hono;

// Detects whether a given address belongs to the Core or eSpace network.
export declare function detectSpace(address: string): 'core' | 'espace';

// Returns the chain ID for a given contract network and space (Core or eSpace).
export declare function chainIdForContractNetwork(network: ContractNetwork, space: 'core' | 'espace'): number;

// Returns the default network configuration for a given network type (local/testnet/mainnet).
export declare function defaultNetworkConfig(network: Network): NetworkConfig;

// Returns the default chain IDs for Core and eSpace for a given network type.
export declare function defaultNetworkChainIds(network: Network): NetworkChainIds;

// Creates a Hono router with account management routes (e.g., list, unlock, send).
export declare function createAccountsRoutes(controller: DevnodeServerController, options?: AccountsRoutesOptions): Hono;

// Sends funds on the Core network using the provided input.
export declare function sendCoreFunds(input: {
  from: string;
  to: string;
  amount: string;
  controller: DevnodeServerController;
}): Promise<string>;

// Sends funds on the eSpace network using the provided input.
export declare function sendEspaceFunds(input: {
  from: string;
  to: string;
  amount: string;
  controller: DevnodeServerController;
}): Promise<string>;

// Creates a Hono router with compiler-related routes (e.g., compile, list artifacts).
export declare function createCompilerRoutes(): Hono;

// Creates a Hono router with mining control routes (e.g., start, stop, status).
export declare function createMiningRoutes(controller: DevnodeServerController): Hono;

// Creates a Hono router with network configuration and state routes.
export declare function createNetworkRoutes(state: NetworkState, options?: {
  controller?: DevnodeServerController;
}): Hono;

// Network identifiers for contracts: local, testnet, or mainnet.
export type ContractNetwork = 'local' | 'testnet' | 'mainnet';

// Network identifiers for runtime: local, testnet, or mainnet.
export type Network = 'local' | 'testnet' | 'mainnet';

// Mode of the network: local (private) or public (testnet/mainnet).
export type NetworkMode = 'local' | 'public';

// Keys used to persist network configuration, including extended chain ID fields.
export type PersistedNetworkConfigKey = keyof NetworkConfig | 'coreChainId' | 'espaceChainId';

// Type alias for the default Core funds sender implementation.
export type SendFundsImpl = typeof defaultSendCoreFunds;

// Type alias for the default eSpace funds sender implementation.
export type SendEspaceFundsImpl = typeof defaultSendEspaceFunds;

// Factory function type for creating DevNode instances.
export type DevnodeServerNodeFactory = (config?: DevNodeConfig) => DevNode;

// Manages registration, storage, and retrieval of compiled contract artifacts.
export declare class ContractRegistry {
}

// Controls lifecycle and state of the underlying DevNode instance.
export declare class DevnodeServerController {
}

// Tracks and manages the current network state (e.g., config, chain ID, capabilities).
export declare class NetworkState {
}
```

### Usage

```ts
import { createDevnodeCoreApp } from '@cfxdevkit/devnode-core';

const app = createDevnodeCoreApp({
  // configure server controller, accounts, etc.
});

// app now includes routes for accounts, mining, network, and compilation.
```

<!-- api-hash: f089029640894d26128e30cb2d6229e82932b586a0f63e66d1646c01f54d972c -->
