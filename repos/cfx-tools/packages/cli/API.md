# `@cfxdevkit/cli` — API Reference

> Small developer CLI for status checks, mnemonic generation, and dual-space account derivation.

## Exports

```ts
type ParsedArgs
function parseArgs(argv: readonly string[]): ParsedArgs

type DeriveReport
function runDerive(args: ParsedArgs): Promise<DeriveReport>

type GenerateReport
function runGenerate(args: ParsedArgs): Promise<GenerateReport>

type StatusReport
function runStatus(args: ParsedArgs): Promise<StatusReport>

function run(argv?: readonly string[]): Promise<number>
```

## Commands

- `cfx status` — probe one or more chains and report head block or epoch data
- `cfx derive` — derive EVM and Core accounts from a mnemonic or generated seed
- `cfx generate` — emit a new BIP-39 mnemonic

## Notes

- Human-readable output is the default; `--json` enables machine-readable output.
- Private keys remain hidden unless the relevant command explicitly enables them.