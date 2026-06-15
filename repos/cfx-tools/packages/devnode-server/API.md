# `@cfxdevkit/devnode-server` — Public API

> Shared Hono control plane for the local Conflux dev node.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 8 symbols |
| `./cli` | 8 symbols |

---

## `.`

```ts
// Package name constant for runtime identification.
export declare const __packageName: "@cfxdevkit/devnode-server";

// Options for configuring the DevnodeServerApp, combining controller and accounts route options.
export interface DevnodeServerAppOptions extends DevnodeServerControllerOptions, AccountsRoutesOptions {
}

// Context object provided to DevnodeServer extensions during initialization.
export interface DevnodeServerExtensionContext {
}

// Summary of a node profile, containing lightweight metadata.
export interface NodeProfileSummary {
}

// Full state representation of a node profile, including runtime and configuration details.
export interface NodeProfileState {
}

// Options used to configure the NodeProfileService instance.
export interface NodeProfileServiceOptions {
}

// Creates and returns a configured Hono application instance for the devnode server.
export declare function createDevnodeServerApp(options?: DevnodeServerAppOptions): Hono;

// Service responsible for managing node profiles (e.g., creation, persistence, lifecycle).
export declare class NodeProfileService {
```

### Usage

```ts
import { createDevnodeServerApp } from '@cfxdevkit/devnode-server';

const app = createDevnodeServerApp({
  // options...
});
```

---

## `./cli`

```ts
// Default host address for the devnode server when started via CLI.
export declare const DEFAULT_HOST = "127.0.0.1";

// Default port for the devnode server when started via CLI.
export declare const DEFAULT_PORT = 52000;

// Default base URL constructed from DEFAULT_HOST and DEFAULT_PORT.
export declare const DEFAULT_BASE_URL = "http://127.0.0.1:52000";

// Parsed representation of CLI arguments.
export type ParsedArgs = {
}

// Parses raw CLI argument vector into structured options.
export declare function parseArgs(argv: string[]): ParsedArgs;

// Returns a formatted help message for CLI usage.
export declare function printHelp(): string;

// Executes the appropriate CLI command based on parsed arguments.
export declare function executeCliCommand(parsed: Exclude<ParsedArgs, {
}

// Main entry point for CLI execution; handles argument parsing and command dispatch.
export declare function main(argv?: string[]): Promise<void>;
```

### Usage

```ts
import { main } from '@cfxdevkit/devnode-server/cli';

await main(); // runs CLI with process.argv
```

<!-- api-hash: 0e8d096550af9233cc5f0514b12650e741416b98d95c8d0a85948253e9a4e881 -->
