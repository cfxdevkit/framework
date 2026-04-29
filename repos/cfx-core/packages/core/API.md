# framework/core — Public API

> Stability: every symbol below is `@stable` unless marked.
> Principles: [framework-design-principles.md](../../docs/architecture/framework-design-principles.md).
> Error model: [framework-error-types.md](../../docs/architecture/framework-error-types.md).
> **Implementation traceability:** see [PORTING.md](./PORTING.md) for the symbol-by-symbol mapping from the reference implementation (`devkit/packages/core@1.2.5`) to this contract — every source export is accounted for as PORT / RENAME / RESHAPE / RELOCATE / NEW / DROP, with phase-tracking checkboxes.

This document is the **contract**. If a function isn't here, it isn't public.

---

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/core/chains` | chain definitions & registry |
| `@cfxdevkit/core/client` | RPC client factory + transports |
| `@cfxdevkit/core/wallet` | HD derivation, account, signer interface |
| `@cfxdevkit/core/contract` | typed read / write / simulate / deploy / events |
| `@cfxdevkit/core/batch` | multicall, multisend, request batcher |
| `@cfxdevkit/core/abi` | standard ABI consts |
| `@cfxdevkit/core/address` | checksum, validate, eSpace ↔ Core conversion |
| `@cfxdevkit/core/units` | format, parse, precision (BigInt-only) |
| `@cfxdevkit/core/errors` | `CfxError` root + `RpcError`, `ContractError`, `WalletError` |
| `@cfxdevkit/core/types` | `Address`, `Hash`, `Hex`, `Wei`, `ChainId`, `BlockTag`, … |

---

## `core/chains`

### Module responsibility
Static catalog of chain configs. Pure data + lookup. **No I/O.**

### Public surface
```
type ChainConfig = {
  id: ChainId
  name: string
  network: 'mainnet' | 'testnet' | 'devnet' | 'local'
  family: 'espace' | 'core'
  nativeToken: { symbol: string; decimals: number }
  rpc: { http: string[]; ws?: string[] }
  explorer?: { name: string; url: string }
}

const espaceMainnet: ChainConfig
const espaceTestnet: ChainConfig
const coreSpaceMainnet: ChainConfig
const coreSpaceTestnet: ChainConfig

function getChain(idOrName: ChainId | string): ChainConfig    // throws CfxError if unknown
function listChains(): readonly ChainConfig[]
function defineChain(input: ChainConfig): ChainConfig         // identity validator
```

### Data flow
Consumers call `getChain('espace-mainnet')` → pass result to `client/createClient`.

---

## `core/client`

### Module responsibility
Build a typed RPC client from a `ChainConfig` + transport. **One client per chain.**
Client is opaque; all reads go through `core/contract` or low-level `client.request`.

### Public surface
```
type Transport = {
  kind: 'http' | 'ws' | 'fallback'
  request(req: { method: string; params?: unknown[] }, opts?: { signal?: AbortSignal }): Promise<unknown>
  close?(): Promise<void>
}

type Client = {
  chain: ChainConfig
  transport: Transport
  request<T>(req: { method: string; params?: unknown[] }, opts?: { signal?: AbortSignal }): Promise<T>
  // narrow public actions; everything else uses contract/* or batch/*
  getBlockNumber(opts?: { signal?: AbortSignal }): Promise<bigint>
  getBlock(tag: BlockTag, opts?: { signal?: AbortSignal }): Promise<Block>
  getBalance(address: Address, opts?: { tag?: BlockTag; signal?: AbortSignal }): Promise<Wei>
  getTransactionReceipt(hash: Hash, opts?: { signal?: AbortSignal }): Promise<TxReceipt | null>
  estimateGas(input: TxRequest, opts?: { signal?: AbortSignal }): Promise<bigint>
}

function http(url: string, opts?: { headers?; retries?: number }): Transport
function ws(url: string, opts?: { reconnect?: boolean }): Transport
function fallback(transports: Transport[]): Transport         // first-success-wins

function createClient(input: { chain: ChainConfig; transport: Transport }): Client
```

### Errors
Throws `RpcError` with codes `core/rpc/{timeout,rate-limit,server,network}`.

### Notes
- `Client` has **no auth**, **no signer**, **no chain switching**. To switch chain,
  create a new client.
- `Client` does not cache anything. Caching belongs to `react/` (react-query) or
  `batch/` (deduplication).

---

## `core/wallet`

### Module responsibility
HD derivation + a thin, framework-internal `Signer` interface. **No keystore I/O**
(that's `services/keystore`). **No session keys** (that's `wallet/session-key`).

### Public surface
```
type Account = {
  address: Address
  publicKey: Hex
  // private material is held by the Signer, never on Account
}

type SignableTx = {
  chainId: ChainId
  to?: Address
  value?: Wei
  data?: Hex
  nonce?: number
  gas?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
}

type Signer = {
  account: Account
  signTransaction(tx: SignableTx, opts?: { signal?: AbortSignal }): Promise<Hex>
  signMessage(message: string | Uint8Array, opts?: { signal?: AbortSignal }): Promise<Hex>
  signTypedData(typedData: TypedData, opts?: { signal?: AbortSignal }): Promise<Hex>
}

// HD derivation — pure
function deriveAccount(input: {
  mnemonic: string
  path?: string                 // default "m/44'/503'/0'/0/0" (Conflux) or "m/44'/60'/0'/0/0" for eSpace
  passphrase?: string
}): { account: Account; privateKey: Hex }

function deriveAccounts(input: {
  mnemonic: string
  basePath?: string
  count: number
  passphrase?: string
}): Array<{ account: Account; privateKey: Hex }>

// Signer factories — these need a private key in memory.
// Production code should not call these directly; use framework/services + framework/wallet/signers.
function signerFromPrivateKey(privateKey: Hex): Signer        // @internal — moved here for testing only
```

### Errors
`WalletError` with codes `core/wallet/{derivation,sign-rejected}`.

### Notes
- Mnemonic in / privateKey out is intentionally explicit. The blessed path stores
  it via `services/keystore` and unwraps via `wallet/signers`.
- No persistence here. No address books, no nicknames.

---

## `core/contract`

### Module responsibility
Typed contract I/O. **One function per verb.** No "ContractInstance" object.

### Public surface
```
type ReadInput<TAbi, TFn> = {
  client: Client
  address: Address
  abi: TAbi
  functionName: TFn
  args?: readonly unknown[]
  blockTag?: BlockTag
  signal?: AbortSignal
}

type WriteInput<TAbi, TFn> = {
  client: Client
  signer: Signer
  address: Address
  abi: TAbi
  functionName: TFn
  args?: readonly unknown[]
  value?: Wei
  gas?: bigint
  signal?: AbortSignal
}

type SimulateInput<TAbi, TFn> = ReadInput<TAbi, TFn> & { from?: Address; value?: Wei }

type DeployInput<TAbi> = {
  client: Client
  signer: Signer
  abi: TAbi
  bytecode: Hex
  args?: readonly unknown[]
  value?: Wei
  signal?: AbortSignal
}

type WatchInput<TAbi, TEvent> = {
  client: Client
  address?: Address | Address[]
  abi: TAbi
  eventName: TEvent
  fromBlock?: BlockTag
  signal?: AbortSignal              // closes the iterable
}

function readContract<TAbi, TFn>(input: ReadInput<TAbi, TFn>): Promise<unknown>
function simulateContract<TAbi, TFn>(input: SimulateInput<TAbi, TFn>): Promise<{ result: unknown; request: WriteInput<TAbi, TFn> }>
function writeContract<TAbi, TFn>(input: WriteInput<TAbi, TFn>): Promise<{ hash: Hash }>
function deployContract<TAbi>(input: DeployInput<TAbi>): Promise<{ hash: Hash; address: Address }>
function watchEvent<TAbi, TEvent>(input: WatchInput<TAbi, TEvent>): AsyncIterable<DecodedEvent>
function parseEventLog<TAbi>(input: { abi: TAbi; log: RawLog }): DecodedEvent
```

### Errors
`ContractError` with codes `core/contract/{revert, decode, estimate-gas}`.

### Notes
- No mutation, no shared state. Each call is independent.
- `watchEvent` returns an `AsyncIterable`; cancel via `AbortSignal`.
- `simulateContract` returns a re-usable `request` so the call site can do
  `await writeContract(sim.request)`.

---

## `core/batch`

### Module responsibility
Coalesce reads via Multicall3; submit several writes via a multisend. **Reads
only via Multicall3 — no caching.**

### Public surface
```
type ReadCall = { address: Address; abi: Abi; functionName: string; args?: readonly unknown[] }

function multicall(input: {
  client: Client
  calls: readonly ReadCall[]
  blockTag?: BlockTag
  allowFailure?: boolean
  signal?: AbortSignal
}): Promise<Array<{ status: 'success' | 'failure'; result: unknown; error?: ContractError }>>

type WriteCall = { to: Address; data: Hex; value?: Wei }

function multisend(input: {
  client: Client
  signer: Signer
  calls: readonly WriteCall[]
  signal?: AbortSignal
}): Promise<{ hash: Hash }>

function createBatcher(opts?: {
  windowMs?: number               // default 8
  maxBatchSize?: number           // default 100
}): {
  read<T>(call: ReadCall, ctx: { client: Client; signal?: AbortSignal }): Promise<T>
  flush(): Promise<void>
  close(): Promise<void>
}
```

### Notes
- `createBatcher` is the only stateful thing here. It keeps a window-coalesced
  queue. Tests inject `clock` via `__test` only when needed.

---

## `core/abi`

Static const exports. Tree-shakeable.

```
const erc20Abi: readonly [...]
const erc721Abi: readonly [...]
const erc1155Abi: readonly [...]
const multicall3Abi: readonly [...]
```

No functions.

---

## `core/address`

### Public surface
```
function isAddress(value: string): value is Address
function checksum(value: Address | string): Address           // throws if invalid
function assertAddress(value: string): asserts value is Address

// Conflux address-format bridge
function coreToEspace(coreAddress: string): Address
function espaceToCore(espaceAddress: Address, network: 'mainnet' | 'testnet'): string
```

Pure. No network.

---

## `core/units`

```
function formatUnits(value: Wei, decimals: number): string    // "1.234500"
function parseUnits(value: string, decimals: number): Wei     // throws on overflow / NaN
function formatToken(value: Wei, token: { decimals: number; symbol: string }): string
```

Pure. BigInt-only. No `Number`.

---

## `core/errors`

```
class CfxError extends Error { code: string; cause?: unknown; meta?: Record<string, unknown>; toJSON() }
class RpcError extends CfxError {}
class ContractError extends CfxError {}
class WalletError extends CfxError {}

function isCfxError(value: unknown): value is CfxError
```

---

## `core/types`

Re-exports the common value types listed in
[framework-error-types.md](../../docs/architecture/framework-error-types.md).
Plus:

```
type Block, TxRequest, TxReceipt, RawLog, DecodedEvent, TypedData, Abi
```

---

## Anti-goals (intentionally NOT in core)

- ❌ Wallet UI / connector (lives in `framework/wallet-connect`)
- ❌ Keystore I/O (lives in `framework/services/keystore`)
- ❌ Session keys (lives in `framework/wallet/session-key`)
- ❌ Caching layer (lives in `framework/react`)
- ❌ Strategy / scheduling (lives in `framework/executor` + `domains/automation`)
- ❌ Solidity compilation (lives in `framework/compiler`)
