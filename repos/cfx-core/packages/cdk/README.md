# `@cfxdevkit/cdk` — Foundation client

The chain-aware client + signer layer everything else in `@cfxdevkit/*` builds on.
Cross-space first: every primitive works on Conflux **eSpace** (EVM, viem-backed)
and **Core Space** (Conflux-native, cive-backed) through a single discriminated
union (`client.family === 'espace' | 'core'`).

## Install

```bash
npm install @cfxdevkit/cdk
```

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/cdk/client`  | `createClient`, `http`, `ws`, `fallback` (`EspaceClient` ∪ `CoreSpaceClient`) |
| `@cfxdevkit/cdk/wallet`  | Mnemonic derivation, dual-address accounts, `signerFromPrivateKey` (signs both spaces via viem & cive) |
| `@cfxdevkit/cdk/chains`  | Built-in chain configs (`espaceMainnet`, `espaceTestnet`, `coreSpaceMainnet`, `coreSpaceTestnet`, …) |
| `@cfxdevkit/cdk/address` | Base32 ↔ hex codec (`hexToBase32`, `base32ToHex`, `isBase32Address`, `getCoreAddress`) |
| `@cfxdevkit/cdk/units`   | Decimal helpers (`formatCFX/parseCFX`, `formatDrip/parseDrip`, `formatGDrip/parseGDrip`) |
| `@cfxdevkit/cdk/types`   | Shared primitives (`Address`, `Hex`, `Hash`, `Wei`, `BlockTag`, `EpochTag`, `NodeStatus`, `CoreLog…`, `SponsorInfo`) |
| `@cfxdevkit/cdk/errors`  | `CfxError` + typed error codes |

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

## Usage

### Create a client

```ts
import { createClient, http, espaceTestnet } from '@cfxdevkit/cdk'

const client = createClient({
  chain: espaceTestnet,
  transport: http('https://testnet.confluxrpc.com')
})

const blockNumber = await client.getBlockNumber()
```

### Sign and send a transaction (eSpace)

```ts
import { signerFromPrivateKey, parseCFX } from '@cfxdevkit/cdk'

const signer = signerFromPrivateKey('0x…', espaceTestnet.id)
const txHash = await client.sendRawTransaction({
  to: '0x…',
  value: parseCFX('1'),
  gas: 21_000n,
  gasPrice: 1_000_000_000n,
  ...signer
})
```

### Sign and send a transaction (Core Space)

```ts
import { signerFromPrivateKey, parseCFX, coreSpaceTestnet } from '@cfxdevkit/cdk'

const signer = signerFromPrivateKey('0x…', coreSpaceTestnet.id)
const txHash = await client.sendRawTransaction({
  to: '0x…',
  value: parseCFX('1'),
  gas: 21_000n,
  gasPrice: 1_000_000_000n,
  ...signer
})
```

### Address utilities

```ts
import { hexToBase32, base32ToHex, getCoreAddress } from '@cfxdevkit/cdk'

const base32 = hexToBase32('0x1234…', espaceTestnet.id)
const hex = base32ToHex(base32)
const coreAddr = getCoreAddress(base32)
```

### Units

```ts
import { formatCFX, parseCFX, formatDrip, parseDrip } from '@cfxdevkit/cdk'

const cfx = formatCFX(1_000_000_000_000_000_000n) // '1.0'
const drip = parseCFX('1.0') // 1_000_000_000_000_000_000n
const dripStr = formatDrip(drip) // '1000000000000000000'
```

### Chain configs

```ts
import { espaceMainnet, coreSpaceTestnet, getChain } from '@cfxdevkit/cdk'

const chain = getChain('conflux-espace-testnet')
console.log(chain.family) // 'espace'
```

### Error handling

```ts
import { isCfxError, CfxError } from '@cfxdevkit/cdk'

try {
  await client.getBlockNumber()
} catch (err) {
  if (isCfxError(err)) {
    console.log(err.code, err.message)
  }
}
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 69b8f5461582b449d57669f9dfdf3a9dfc8b1230cb9fc9a1b9ed87e385884ecf -->
