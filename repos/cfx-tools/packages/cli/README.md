# `@cfxdevkit/cli`

Tiny developer CLI bundled with `@cfxdevkit/cdk`. Provides three commands:

- **`cfx status`** — pings each chain and prints head block / epoch + latency.
- **`cfx derive`** — derives dual-space accounts (EVM `0x…` + Core `cfx[…]:…`) from a mnemonic or generates new ones.
- **`cfx generate`** — prints a fresh BIP-39 mnemonic.

## Install

```sh
pnpm --filter @cfxdevkit/cli build
node repos/cfx-tools/packages/cli/dist/bin.js --help
```

When published, the `cfx` binary will be on `PATH` after `pnpm i -g @cfxdevkit/cli`.

## Examples

```sh
cfx status
cfx status --chain core-testnet
cfx status --chain 1030 --rpc https://my-private-rpc.example
cfx status --json

cfx derive --generate --count 3 --core-network-id 1
cfx derive --mnemonic "test test test test test test test test test test test junk" --count 5
cfx derive --mnemonic "..." --type mining --core-network-id 2029 --show-private-keys

cfx generate
```

## Notes

- The default `--core-network-id` is `1029` (mainnet `cfx:…`).
  Use `1` for testnet (`cfxtest:…`) and `2029` for the local devnet (`net2029:…`).
- `--type mining` switches the BIP-44 account segment from `0'` to `1'`,
  matching the convention used by the original `@cfxdevkit/cdk` POC for
  faucet / miner accounts.
- Private keys are **not** printed unless you pass `--show-private-keys`.

## API Reference

### Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | `ParsedArgs`, `parseArgs`, `DeriveReport`, `runDerive`, `GenerateReport`, `runGenerate`, `runStatus`, `StatusReport`, `run` |

---

### `.`

```ts
export { ParsedArgs }
export { parseArgs }
export { DeriveReport }
export { runDerive }
export { GenerateReport }
export { runGenerate }
export { runStatus }
export { StatusReport }
export { run }
```

<!-- api-hash: d062722870d1697d744ad39db1cdd215df7045463fd8f11284781107d1ade6af -->

## Usage

```typescript
import { run } from '@cfxdevkit/cli';

// Run CLI with default behavior (uses process.argv)
await run();

// Run CLI with custom arguments
await run({
  command: 'status',
  chain: 'core-testnet',
  json: true
});
```

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

## API Reference

See [API.md](./API.md) for the full public surface.

API REFERENCE EXCERPT:
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

#### Derive Accounts

```ts
import { runDerive, RunDeriveOptions } from '@cfxdevkit/cli';

const options: RunDeriveOptions = {
  mnemonic: 'test test test test test test test test test test test junk',
  count: 3,
  coreNetworkId: 1,
  type: 'mining',
  showPrivateKeys: true
};

const report = await runDerive(options);
console.log(report.accounts);
```

#### Generate Mnemonic

```ts
import { runGenerate, RunGenerateOptions } from '@cfxdevkit/cli';

const options: RunGenerateOptions = {
  // optional: strength in bits (128, 192, or 256)
};

const report = await runGenerate(options);
console.log(report.mnemonic);
```

#### Check Network Status

```ts
import { runStatus, RunStatusOptions } from '@cfxdevkit/cli';

const options: RunStatusOptions = {
  chain: 'core-testnet',
  json: true
};

const report = await runStatus(options);
console.log(report);
```

<!-- readme-hash: b9082c8985dfe7abf26b517dbf2703df40bc11665fa3c9e9917b6fc3a19ad5c5 -->
