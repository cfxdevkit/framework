# `@cfxdevkit/contracts` — Public API

> Standard contract bindings (ERC-20 / 721 / 1155, Multicall3) plus a thin,
> framework-native `read` / `write` / `deploy` surface that consumes
> `@cfxdevkit/core`'s `Client` and `Signer`.
>
> **Status:** `read`, `write`, `deploy`, and `erc20` work for both eSpace and
> Core Space. Conflux-backed signing and `cfx_sendRawTransaction` dispatch
> are wired in; `client.family` selects the correct path.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/contracts/abis` | Standard ABIs as `as const` arrays |
| `@cfxdevkit/contracts/read` | `readContract({ client, address, abi, functionName, args })` |
| `@cfxdevkit/contracts/write` | `prepareWrite()` / `sendWrite()` / `waitForReceipt()` |
| `@cfxdevkit/contracts/deploy` | `deployContract({ client, signer, abi, bytecode, args })` |
| `@cfxdevkit/contracts/erc20` | Typed ERC-20 helpers (`balanceOf`, `transfer`, …) |
| `@cfxdevkit/contracts/bridge` | CrossSpaceCall helpers (`transferToEspace`, `withdrawFromMapped`, mapped balance/address) |
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

## `./bridge`

Wraps the Conflux **CrossSpaceCall** internal contract
(`0x0888000000000000000000000000000000000006`, on Core Space). Every helper
requires `client.family === 'core'` and a signer with `account.coreAddress` set.

```ts
export const CROSS_SPACE_CALL_HEX = '0x0888000000000000000000000000000000000006';
export const CROSS_SPACE_CALL_ABI;

// Core → eSpace
function transferToEspace({ client, signer, to: '0x…', value: bigint, … }): Promise<SendWriteResult>;
function callEspace({ client, signer, to: '0x…', data: Hex, value?: bigint, … }): Promise<SendWriteResult>;

// eSpace → Core (recall from your mapped account)
function withdrawFromMapped({ client, signer, value: bigint, … }): Promise<SendWriteResult>;

// Reads
function getMappedBalance({ client, coreHexAddress: Hex }): Promise<bigint>;
function getMappedNonce({ client, coreHexAddress: Hex }): Promise<bigint>;

// Helpers
function mappedEspaceAddress(coreHexAddress: Hex): `0x${string}`;  // keccak256(coreHex)[12:32]
function uint256Hex(n: bigint): Hex;
function hexToUint256(hex: Hex): bigint;
```

The bridge surface mirrors how Conflux defines cross-space transfers in the
spec: every operation is initiated from **Core Space** — there is no
"eSpace→Core" RPC. To move CFX out of eSpace, top up your *mapped* eSpace
account (the one returned by `mappedEspaceAddress(yourCoreHex)`), then call
`withdrawFromMapped(amount)` from Core.

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

- ERC-721 / ERC-1155 typed convenience helpers (ABIs are exported today)
- Multicall3 batching helper (`multicall({ client, calls })`)
- Conflux internal contracts beyond CrossSpaceCall (Sponsor, Staking)
- Address registry (`createRegistry({ source: 'file' | 'memory' })`)
- Event subscription helpers (`watchTransfers`, etc.)
