/**
 * `@cfxdevkit/cli` — small developer CLI exercising the public API of
 * `@cfxdevkit/cdk`. Two surfaces:
 *
 * - `cfx status [--chain <id|name>]` — pings one or every known chain
 *   and prints the head block (eSpace) or epoch (Core Space) plus latency.
 * - `cfx derive [--mnemonic <m>|--generate] [--count N] [--start I]
 *               [--type standard|mining] [--core-network-id <id>]` — derives
 *   dual-space accounts (EVM 0x… + Core base32 cfx[…]:…).
 * - `cfx generate [--strength 128|256]` — emits a fresh BIP-39 mnemonic.
 *
 * Output is human-readable by default; pass `--json` for machine-readable
 * output suitable for shell pipelines.
 */

export { type ParsedArgs, parseArgs } from './args.js';
export { type DeriveReport, runDerive } from './commands/derive.js';
export { type GenerateReport, runGenerate } from './commands/generate.js';
export { runStatus, type StatusReport } from './commands/status.js';
export { run } from './run.js';
