# `@cfxdevkit/contracts` — Public API

> Standard contract bindings (ERC-20 / 721 / 1155, Multicall3) plus a thin,
> framework-native `read` / `write` / `deploy` surface that consumes
> `@cfxdevkit/core`'s `Client` and `Signer`.
>
> **Status:** `read` works for both eSpace and Core Space. `write` and `deploy`
> are still eSpace-only in this revision — Core Space transaction support
> arrives in the next phase. Calling those entry points with a `family: 'core'`
> client throws `ContractsError({ code: 'contracts/unsupported-family' })`.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/contracts/abis` | Standard ABIs as `as const` arrays |
| `@cfxdevkit/contracts/read` | `readContract({ client, address, abi, functionName, args })` |
| `@cfxdevkit/contracts/write` | `prepareWrite()` / `sendWrite()` / `waitForReceipt()` |
| `@cfxdevkit/contracts/deploy` | `deployContract({ client, signer, abi, bytecode, args })` |
| `@cfxdevkit/contracts/erc20` | Typed ERC-20 helpers (`balanceOf`, `transfer`, …) |
| `@cfxdevkit/contracts/errors` | `ContractsError` + `ContractsErrorCode` |

Importing the sub-paths instead of the barrel keeps tree-shaking sharp.

---

## `./abis`

```ts
export const ERC20_ABI: typeof viem.erc20Abi;
export const ERC721_ABI: typeof viem.erc721Abi;
export const ERC1155_ABI: typeof viem.erc1155Abi;
export const MULTICALL3_ABI: typeof viem.multicall3Abi;
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
```

Sourced from `viem` (which tracks the canonical interfaces) and re-exported under
framework-stable aliases, so consumers don't pin a viem version of their own.

---

## `./read`

```ts
function readContract<TAbi, TName>(input: {
  client: Client;                                  // espace or core
  address: string;                                 // 0x hex (espace) or base32 (core)
  abi: TAbi;
  functionName: TName;                             // 'view' | 'pure'
  args?: ContractFunctionArgs<TAbi, 'view' | 'pure', TName>;
  blockTag?: 'latest' | 'pending' | 'earliest' | 'finalized' | 'safe' | bigint;
  epochTag?: 'latest_state' | 'latest_mined' | 'latest_finalized' | 'latest_checkpoint' | 'earliest';
  from?: string;
  signal?: AbortSignal;
}): Promise<DecodedReturn>;
```

Dispatches `eth_call` for eSpace and `cfx_call` (default `epochTag: 'latest_state'`)
for Core Space. Address shape is validated per family: passing 0x hex to a
Core client (or base32 to an eSpace client) raises
`ContractsError({ code: 'contracts/invalid-argument' })`. Decode failures raise
`ContractsError({ code: 'contracts/decode-failure' })`.

---

## `./write`

```ts
// Pure helper — encode only. Hand off the SignableTx to any external signer.
function prepareWrite<TAbi, TName>(input: {
  address: Address;
  abi: TAbi;
  functionName: TName;                             // 'nonpayable' | 'payable'
  args?: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TName>;
  value?: bigint;
  chainId: number;
  nonce?: number; gas?: bigint;
  maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint;
}): SignableTx;

// Full pipeline — fills nonce/gas/fees, signs with `signer`, broadcasts.
function sendWrite<TAbi, TName>(input: {
  client: Client; signer: Signer;
  address: Address; abi: TAbi; functionName: TName;
  args?: ...; value?: bigint;
  maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint;
  waitForReceipt?: boolean;
  pollIntervalMs?: number;        // default 1500
  receiptTimeoutMs?: number;      // default 60_000
  signOptions?: SignOptions;
}): Promise<{
  hash: Hex;
  request: SignableTx;
  rawTransaction: Hex;
  receipt?: TxReceipt;
}>;

function waitForReceipt(
  client: Client,
  hash: Hex,
  opts: { pollIntervalMs: number; timeoutMs: number },
): Promise<TxReceipt>;
```

Defaults: `maxPriorityFeePerGas = 1 gwei`, `maxFeePerGas = baseFee*2 + tip`.
A reverted receipt raises `ContractsError({ code: 'contracts/reverted' })`;
timing out raises `'contracts/receipt-timeout'`.

---

## `./deploy`

```ts
function deployContract<TAbi>(input: {
  client: Client; signer: Signer;
  abi: TAbi; bytecode: Hex;
  args?: ContractConstructorArgs<TAbi>;
  value?: bigint;
  gas?: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint;
  waitForReceipt?: boolean;
  pollIntervalMs?: number; receiptTimeoutMs?: number;
  signOptions?: SignOptions;
}): Promise<{
  hash: Hex;
  request: SignableTx;
  rawTransaction: Hex;
  address?: Address;             // populated when waitForReceipt: true
  receipt?: TxReceipt;
}>;
```

---

## `./erc20`

Pre-bound, typed ERC-20 helpers. `Erc20Bind = { client; address }`; write helpers
also take `signer`.

```ts
erc20.name({ client, address }): Promise<string>
erc20.symbol({ client, address }): Promise<string>
erc20.decimals({ client, address }): Promise<number>
erc20.totalSupply({ client, address }): Promise<bigint>
erc20.balanceOf({ client, address }, owner): Promise<bigint>
erc20.allowance({ client, address }, owner, spender): Promise<bigint>
erc20.transfer({ client, address, signer }, to, amount, opts?): Promise<SendWriteResult>
erc20.approve({ client, address, signer }, spender, amount, opts?): Promise<SendWriteResult>
```

---

## `./errors`

```ts
type ContractsErrorCode =
  | 'contracts/unsupported-family'
  | 'contracts/decode-failure'
  | 'contracts/receipt-timeout'
  | 'contracts/reverted'
  | 'contracts/invalid-argument';

class ContractsError extends CfxError { /* .code: ContractsErrorCode */ }
```

---

## Deferred

The following land in subsequent ports and are intentionally absent from this
revision:

- Core Space (`family: 'core'`) **writes/deploys** via `cfx_sendRawTransaction`
  and the Conflux tx serializer
- ERC-721 / ERC-1155 typed convenience helpers (ABIs are exported today)
- Multicall3 batching helper (`multicall({ client, calls })`)
- Conflux internal contracts (Sponsor, Staking, Cross-space)
- Address registry (`createRegistry({ source: 'file' | 'memory' })`)
- Event subscription helpers (`watchTransfers`, etc.)
