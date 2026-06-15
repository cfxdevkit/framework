# `@cfxdevkit/devnode`

> Local Conflux dev node lifecycle. Wraps `@xcfx/node` to bring up a
> dual-space (Core + eSpace) chain on deterministic ports with pre-funded
> genesis accounts. **Dev / test only — Node.js host required.**

## Install

```sh
pnpm add @cfxdevkit/devnode
```

## Quick start

```ts
import { createDevNode } from '@cfxdevkit/devnode';

const node = createDevNode();
await node.start();

// node.urls.core    → http://127.0.0.1:12537   (matches coreSpaceLocal)
// node.urls.espace  → http://127.0.0.1:8545    (matches espaceLocal)
// node.accounts[0]  → pre-funded with 10_000 CFX (xcfx-fixed; see below)

await node.stop();
```

Or from the terminal:

```sh
pnpm --filter @cfxdevkit/devnode build
pnpm --filter @cfxdevkit/devnode start            # default 10 accounts, auto-mining
# or globally after `pnpm install`:
cfxdevkit-devnode --accounts 4 --balance 1000
cfxdevkit-devnode --help
```

## Defaults

| field              | value                          | matches                          |
| ------------------ | ------------------------------ | -------------------------------- |
| Core HTTP / WS     | `12537` / `12536`              | `coreSpaceLocal` chain config    |
| eSpace HTTP / WS   | `8545` / `8546`                | `espaceLocal` chain config       |
| Core chain id      | `2029`                         | `coreSpaceLocal.id`              |
| eSpace chain id    | `2030`                         | `espaceLocal.id`                 |
| Genesis accounts   | `10` (BIP-44 standard branch)  | derived from a random mnemonic   |
| Faucet / miner     | `1` (BIP-44 mining branch)     | receives block rewards           |
| Initial balance    | `10_000` CFX per account       | hardcoded by `@xcfx/node`        |
| Auto-miner tick    | `2000` ms (`mine({numTxs:1})`) | packs Core + eSpace pending txs  |
| Data dir           | `~/.cfxdevkit/devnode/<rand>`  | created with `mkdir -p`          |

All overridable via {@link DevNodeConfig}.

## Why `mine({ numTxs: 1 })`?

The node is started with `devPackTxImmediately: false`, so eSpace
transactions never auto-pack onto the Core consensus path. The cive
test-client call `mine({ numTxs: 1 })` (`test_generateOneBlock` upstream) is
the only RPC that packs both Core and eSpace pending transactions into the
next block. The auto-miner runs that on a timer; explicit empty-block
advances are available via `node.mine(blocks)`.

## API surface

| symbol                | purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `createDevNode(cfg?)` | Construct a `DevNode` with sensible defaults.          |
| `DevNode`             | Lifecycle handle.                                      |
| `.start()`            | Boot the server + auto-miner.                          |
| `.stop()`             | Stop the auto-miner + shut down the server.            |
| `.restart()`          | `stop()` then `start()`.                               |
| `.mine(blocks?)`      | Advance N empty blocks (no tx packing).                |
| `.packMine()`         | Single `mine({ numTxs: 1 })` — packs pending txs.      |
| `.startMining(ms?)`   | Re-arm the auto-miner (one tick = `packMine()`).       |
| `.stopMining()`       | Disarm the auto-miner.                                 |
| `.urls`               | `{ core, espace, coreWs, espaceWs }` HTTP/WS URLs.     |
| `.accounts`           | Pre-funded `DualAddressAccount`s with initial balance. |
| `.faucet`             | Mining account (block-reward recipient).               |
| `.config.mnemonic`    | The BIP-39 mnemonic used for derivation.               |
| `.getStatus()`        | Lifecycle phase: `stopped`/`running`/…                 |
| `.getMiningStatus()`  | `{ enabled, intervalMs, ticks, startedAt? }`           |

## Not in scope (explicitly skipped from the upstream reference)

- Plugin registration on a higher-level "DevKit" object.
- `fundAccount` / `setNextBlockTimestamp` / `getLogs` (upstream stubs).
- `saveConfig` / `loadConfig` round-trips.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 9 symbols |
| `./cli` | 3 symbols |

---

## `.`

```ts
export { DevNodeError }
export { DevNodeErrorCode }
export { createDevNode }
export { DevNode }
export { DevNodeUrls }
export { DevNodeAccount }
export { DevNodeConfig }
export { DevNodeStatus }
export { MiningStatus }
```

---

## `./cli`

```ts
export interface ParsedArgs {
  command?: string;
  config?: string;
  verbose?: boolean;
  help?: boolean;
  accounts?: number;
  balance?: number;
  port?: number;
  espacePort?: number;
  wsPort?: number;
  espaceWsPort?: number;
  dataDir?: string;
  mnemonic?: string;
  autoMine?: boolean;
  mineInterval?: number;
}

export declare function parseArgs(argv: string[]): ParsedArgs;
export declare function printHelp(): void;
```

## Usage

```ts
import { parseArgs, printHelp } from '@cfxdevkit/devnode/cli';

// Parse CLI arguments
const args = parseArgs(process.argv.slice(2));

// Print help
printHelp();
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 77ac4d73da7119981d8d51e3724e12cfb9f3f459dcd14e3f62e2bbada7655b58 -->
