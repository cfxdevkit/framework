# `@cfxdevkit/core` — Foundation client

The chain-aware client + signer layer everything else in `@cfxdevkit/*` builds on.
Cross-space first: every primitive works on Conflux **eSpace** (EVM, viem-backed)
and **Core Space** (Conflux-native, cive-backed) through a single discriminated
union (`client.family === 'espace' | 'core'`).

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/core/client`  | `createClient`, `http`, `ws`, `fallback` (`EspaceClient` ∪ `CoreSpaceClient`) |
| `@cfxdevkit/core/wallet`  | Mnemonic derivation, dual-address accounts, `signerFromPrivateKey` (signs both spaces via viem & cive) |
| `@cfxdevkit/core/chains`  | Built-in chain configs (`espaceMainnet`, `espaceTestnet`, `coreSpaceMainnet`, `coreSpaceTestnet`, …) |
| `@cfxdevkit/core/address` | Base32 ↔ hex codec (`hexToBase32`, `base32ToHex`, `isBase32Address`, `getCoreAddress`) |
| `@cfxdevkit/core/units`   | Decimal helpers (`formatCFX/parseCFX`, `formatDrip/parseDrip`, `formatGDrip/parseGDrip`) |
| `@cfxdevkit/core/types`   | Shared primitives (`Address`, `Hex`, `Hash`, `Wei`, `BlockTag`, `EpochTag`, `NodeStatus`, `CoreLog…`, `SponsorInfo`) |
| `@cfxdevkit/core/errors`  | `CfxError` + typed error codes |

## What lives where

- **`createClient({ chain, transport })`** returns the right client for the chain's `family`.
  - eSpace: `getBlockNumber`, `getBlock`, `getBalance`, `getTransactionReceipt`, `estimateGas`
  - Core Space: `getEpochNumber`, `getStatus`, `getBalance`, `getTransactionReceipt`,
    `getTransaction`, `getLogs`, `getSponsorInfo`, `getAdmin`
  - Both: `request({ method, params })` for any RPC the typed surface doesn't cover.
- **`signerFromPrivateKey(pk, coreNetworkId?)`** returns a `Signer` that signs both
  EIP-1559 (eSpace) and Conflux native (CIP-1559 / CIP-2930 / legacy) transactions
  via viem and cive respectively. Pass `coreNetworkId` to populate `account.coreAddress`.

**MUST NOT** depend on any other `@cfxdevkit/*` package.
