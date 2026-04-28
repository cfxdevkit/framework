# Framework Error Taxonomy & Common Data Types

Single root, narrow code enums per package. Callers branch on `error.code`, never on
`instanceof` of a deep subclass and never on message strings.

## Root

`CfxError` lives in `framework/core/errors` and is extended by every other framework
error.

```
class CfxError extends Error
  readonly code: string             // package-prefixed enum, e.g. "core/rpc/timeout"
  readonly cause?: unknown
  readonly meta?: Record<string, unknown>  // structured context, never PII or keys
  toJSON(): { name; code; message; meta }  // safe to log
```

Rules:
- `code` is `<package>/<feature>/<reason>`, all lowercase, dash-separated.
- `meta` MUST NOT contain private keys, signatures, raw mnemonic words, or full
  request bodies. It MAY contain method, chain, address, txHash, durationMs.
- `toJSON()` is safe to ship to logs/sinks.

## Per-package error subclasses

| Package | Error class | Common codes |
|---------|------------|-------------|
| core | `RpcError` | `core/rpc/timeout`, `core/rpc/rate-limit`, `core/rpc/server`, `core/rpc/network` |
| core | `ContractError` | `core/contract/revert`, `core/contract/decode`, `core/contract/estimate-gas` |
| core | `WalletError` | `core/wallet/derivation`, `core/wallet/sign-rejected` |
| services | `KeystoreError` | `services/keystore/locked`, `.../not-found`, `.../bad-passphrase`, `.../backend-unavailable` |
| services | `CryptoError` | `services/crypto/decrypt-failed`, `.../bad-key` |
| services | `DexError` | `services/dex/no-route`, `.../slippage`, `.../insufficient-liquidity` |
| wallet | `SessionKeyError` | `wallet/session-key/expired`, `.../capability-denied`, `.../revoked` |
| compiler | `CompileError` | `compiler/solc/syntax`, `.../resolver/not-found`, `.../version-mismatch` |
| devnode | `NodeError` | `devnode/start-failed`, `.../port-in-use`, `.../crashed` |
| executor | `ExecutorError` | `executor/queue/full`, `.../job/timeout`, `.../job/non-retryable` |

## Common value types (defined in `framework/core/types`)

| Type | Definition | Notes |
|------|-----------|-------|
| `Address` | branded `0x${string}` (20 bytes hex) | checksum-cased on output |
| `Hash` | branded `0x${string}` (32 bytes hex) | |
| `Hex` | branded `0x${string}` | arbitrary-length |
| `Wei` | `bigint` | base unit, never `number` |
| `ChainId` | branded `number` | matches EIP-155 |
| `BlockTag` | `'latest' \| 'pending' \| 'finalized' \| bigint` | bigint is block number |
| `Timestamp` | branded `number` | unix seconds |
| `DurationMs` | branded `number` | unsigned |

All types are exported from `@cfxdevkit/core/types` so other packages share them.
