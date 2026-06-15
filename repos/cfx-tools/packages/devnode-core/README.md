# @cfxdevkit/devnode-core

Lightweight Hono control plane for the Conflux devnode.

Exposes node lifecycle, compilation, mining, accounts, and network routes with no keystore or wallet dependencies.

## When to use this vs `@cfxdevkit/devnode-server`

| Package | Routes | Use when |
|---|---|---|
| `devnode-core` | `health`, `node/*`, `compiler/*`, `mining/*`, `accounts/*`, `network/*` | CI scripts, automated testing, lightweight tooling |
| `devnode-server` | all of core + `keystore/*`, `contracts/*`, `deploy/*`, `session-key/*`, `bootstrap/*` | Full developer environment with key management |

## Usage

```ts
import { serve } from '@hono/node-server';
import { createDevnodeCoreApp } from '@cfxdevkit/devnode-core';

const app = createDevnodeCoreApp();
serve({ fetch: app.fetch, port: 52000 }, (info) => {
  console.log(`devnode-core listening at http://127.0.0.1:${info.port}`);
});
```

## Starting via tooling-cli

```bash
# Start devnode-server (full stack, with keystore)
cdk devnode start [--port 52000] [--keystore-path .keystore.json]

# Stop
cdk devnode stop

# Status
cdk devnode status
```

Consumers connect to the running server using `@cfxdevkit/client`:

```ts
import { createConfluxDevkitClient } from '@cfxdevkit/client';
const client = createConfluxDevkitClient({ baseUrl: 'http://127.0.0.1:52000' });
await client.node.start({ config: { mnemonic: '...' } });
```

## Install

```bash
pnpm add @cfxdevkit/devnode-core
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

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
  name: string;
  abi: any[];
  bytecode: string;
  deploymentAddress?: string;
}

// Filter criteria for querying the list of registered contracts.
export interface ContractListFilter {
  name?: string;
  deploymentAddress?: string;
}

// Configuration options for initializing the ContractRegistry.
export interface ContractRegistryOptions {
  persistPath?: string;
}

// Configuration object for a network, including chain IDs, endpoints, and capabilities.
export interface NetworkConfig {
  profile: NetworkProfile;
  chainIds: NetworkChainIds;
  capabilities?: NetworkCapabilities;
  state?: NetworkStateOptions;
}

// Mapping of chain IDs for Core and eSpace networks.
export interface NetworkChainIds {
  core?: string;
  eSpace?: string;
}

// Set of optional capabilities supported by a network (e.g., debug, tracing).
export interface NetworkCapabilities {
  debug?: boolean;
  tracing?: boolean;
}

// Profile metadata for a network (e.g., name, description, environment).
export interface NetworkProfile {
  name: string;
  description?: string;
  environment?: 'dev' | 'test' | 'prod';
}

// Options for configuring the runtime state of a network.
export interface NetworkStateOptions {
  genesis?: boolean;
  autoMine?: boolean;
}

// Options for configuring the accounts HTTP routes.
export interface AccountsRoutesOptions {
  defaultAccounts?: number;
  defaultBalance?: string;
}

// Options for configuring the Devnode server controller (e.g., node factory, logging).
export interface DevnodeServerControllerOptions {
  nodeFactory?: () => Promise<any>;
  logLevel?: 'info' | 'warn' | 'error' | 'debug';
}

// Input payload for starting a new devnode instance.
export interface DevnodeStartInput {
  config?: {
    mnemonic?: string;
    accounts?: number;
    balance?: string;
  };
}

// Input payload for restarting an existing devnode instance.
export interface DevnodeRestartInput {
  config?: {
    mnemonic?: string;
  };
}

// Input payload for wiping (resetting) a devnode instance.
export interface DevnodeWipeInput {
  resetAccounts?: boolean;
}

// Input payload for initiating or stopping mining on the devnode.
export interface DevnodeMineInput {
  enabled: boolean;
}
```

<!-- readme-hash: 25a98c25b5cc51ed1793eefb2f542f96b9815bfdd44f1d9fda0a617a4dadf334 -->
