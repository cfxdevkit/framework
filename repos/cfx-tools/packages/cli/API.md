# `@cfxdevkit/cli` — Public API

> Conflux developer CLI: network status + HD key derivation.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 9 symbols |

---

## `.`

### Usage

```typescript
// Example usage of the CLI
import { run } from '@cfxdevkit/cli';

// Run the CLI with default options
run();

// Run the CLI with custom options
run({
  network: 'mainnet',
  hdPath: 'm/44/0/0/0',
  password: 'mysecretpassword'
});
```

```ts
// Type representing the parsed command-line arguments.
// Contains structured values derived from raw CLI input (e.g., flags, positional args).
export { ParsedArgs }

// Parses command-line arguments into a structured object.
// Validates and transforms raw CLI input (e.g., `--network mainnet`) into a strongly-typed `ParsedArgs`.
export { parseArgs }

// Type representing the results of HD key derivation.
// Includes derived private/public keys, address, and metadata (e.g., path, chain ID).
export { DeriveReport }

// Performs HD key derivation based on provided parameters.
// Derives keys using the specified BIP44 path and optional password.
export { runDerive }

// Type representing the structure of a generated report.
// Typically includes summary info like network, timestamp, and derived keys.
export { GenerateReport }

// Generates a report based on the current state or provided data.
// Can be used to output human-readable or machine-processable status summaries.
export { runGenerate }

// Checks and returns the current network status.
// Queries the Conflux network (e.g., mainnet/testnet) and returns connection/chain info.
export { runStatus }

// Type representing the network status information.
// Includes fields like chain ID, network ID, latest epoch, and node health.
export { StatusReport }

// The main entry point to execute the CLI application.
// Orchestrates argument parsing, command routing, and execution of CLI actions.
export { run }
```

<!-- api-hash: d2095171cb7f3691a8ba54fc0cb33585b7919b5360c5966f397fd2b0fcc35b3a -->
