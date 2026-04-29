# `@cfxdevkit/cli`

Tiny developer CLI bundled with `@cfxdevkit/core`. Two surfaces:

- **`cfx status`** — pings each chain and prints head block / epoch + latency.
- **`cfx derive`** — derives dual-space accounts (EVM `0x…` + Core `cfx[…]:…`).
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
```

## Notes

- The default `--core-network-id` is `1029` (mainnet `cfx:…`).
  Use `1` for testnet (`cfxtest:…`) and `2029` for the local devnet (`net2029:…`).
- `--type mining` switches the BIP-44 account segment from `0'` to `1'`,
  matching the convention used by the original `@cfxdevkit/core` POC for
  faucet / miner accounts.
- Private keys are **not** printed unless you pass `--show-private-keys`.
