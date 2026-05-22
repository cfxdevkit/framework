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
run();

// Run CLI with custom arguments
run({
  command: 'status',
  chain: 'core-testnet',
  json: true
});
```

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: e16eaeec910323678685cb29619a8be3ddf036d991997a48a4ee72d8e390314c -->
