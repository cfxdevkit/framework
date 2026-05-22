# `@cfxdevkit/devnode` — Public API

> Local Conflux dev node lifecycle.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 9 symbols |
| `./cli` | 3 symbols |

---

## `.`

### Usage

```ts
import { createDevNode } from '@cfxdevkit/devnode';

const node = await createDevNode(config);
await node.stop();
```

```ts
// Error thrown by dev node operations
export { DevNodeError }
// Error codes for dev node operations
export { DevNodeErrorCode }
// Creates and starts a new dev node instance
export { createDevNode }
// Represents a running dev node instance
export { DevNode }
// Collection of RPC and WebSocket URLs for the dev node
export { DevNodeUrls }
// Information about the dev node's default account
export { DevNodeAccount }
// Configuration settings for initializing a dev node
export { DevNodeConfig }
// Current operational status of the dev node
export { DevNodeStatus }
// Current status of the mining process
export { MiningStatus }
```

---

## `./cli`

### Usage

```ts
import { parseArgs } from '@cfxdevkit/devnode/cli';

const args = parseArgs(process.argv);
```

```ts
// Parsed command line arguments
export interface ParsedArgs {
  // Command to execute (e.g., 'start', 'stop')
  command?: string;
  // Path to configuration file
  config?: string;
  // Whether to enable verbose logging
  verbose?: boolean;
  // Whether to show help
  help?: boolean;
}
// Parses an array of command line arguments
export declare function parseArgs(argv: string[]): ParsedArgs;
// Prints the CLI help documentation
export declare function printHelp(): void;
```

<!-- api-hash: b516adbcdbeba06b9a0fc1ba9a782bb29060261d68ff8232d2abd1be6b3bad19 -->
