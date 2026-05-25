# `@cfxdevkit/cli` — Public API

> Conflux developer CLI: network status + HD key derivation.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 15 symbols |

---

## `.`

```ts
// Represents the parsed command-line arguments structure.
export { ParsedArgs }

// Parses raw command-line arguments into a structured format.
export { parseArgs }

// Report type returned after successfully extracting smart contract artifacts.
export { ContractsExtractReport }

// Options for configuring the smart contract extraction process.
export { RunContractsExtractOptions }

// Runs the smart contract extraction process, returning a report.
export { runContractsExtract }

// Report type returned after successfully deriving an HD wallet key.
export { DeriveReport }

// Options for configuring HD key derivation.
export { RunDeriveOptions }

// Runs HD key derivation, returning a report.
export { runDerive }

// Report type returned after successfully generating a new keypair.
export { GenerateReport }

// Options for configuring key generation.
export { RunGenerateOptions }

// Generates a new keypair, returning a report.
export { runGenerate }

// Options for querying network status.
export { RunStatusOptions }

// Queries the current network status and returns a report.
export { runStatus }

// Report type returned after successfully retrieving network status.
export { StatusReport }

// Main entry point for CLI execution, dispatching to appropriate subcommands.
export { run }
```

### Usage

```ts
import { run } from '@cfxdevkit/cli';

// Run the CLI with process.argv
await run(process.argv.slice(2));
```

### Subcommand Usage Examples

#### Smart Contract Extraction

```ts
import { runContractsExtract, RunContractsExtractOptions } from '@cfxdevkit/cli';

const options: RunContractsExtractOptions = {
  // configuration for extraction
};
const report = await runContractsExtract(options);
```

#### HD Key Derivation

```ts
import { runDerive, RunDeriveOptions } from '@cfxdevkit/cli';

const options: RunDeriveOptions = {
  // derivation path and other settings
};
const report = await runDerive(options);
```

#### Key Generation

```ts
import { runGenerate, RunGenerateOptions } from '@cfxdevkit/cli';

const options: RunGenerateOptions = {
  // optional seed or entropy source
};
const report = await runGenerate(options);
```

#### Network Status Query

```ts
import { runStatus, RunStatusOptions } from '@cfxdevkit/cli';

const options: RunStatusOptions = {
  // network endpoint or timeout config
};
const report = await runStatus(options);
```

<!-- api-hash: 5cabbe044d958765608ccfdf6351ecac5c1c514e1fe95238a9acbb25ee058d43 -->
