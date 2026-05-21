# `@cfxdevkit/contracts` — Public API

> Standard contract bindings (ERC-20/721/1155, multicall3) and a thin read/write/deploy surface for @cfxdevkit/cdk.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 23 symbols |
| `./abis` | 5 symbols |
| `./read` | 3 symbols |
| `./write` | 6 symbols |
| `./deploy` | 4 symbols |
| `./erc20` | 2 symbols |
| `./bridge` | 10 symbols |
| `./errors` | 2 symbols |

---

## `.`

```ts
export { ERC20_ABI }
export { ERC721_ABI }
export { ERC1155_ABI }
export { MULTICALL3_ABI }
export { MULTICALL3_ADDRESS }
export { DeployContractInput }
export { DeployContractResult }
export { toHex }
export { Erc20Bind }
export { erc20 }
export { waitForReceipt }
export declare function deployContract<TAbi extends Abi>(input: DeployContractInput<TAbi>): Promise<DeployContractResult>;
export declare function readContract<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'pure' | 'view'>>(input: ReadContractInput<TAbi, TName>): Promise<ReturnType<typeof decodeFunctionResult<TAbi, TName>>>;
export declare function prepareWrite<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>>(input: PrepareWriteInput<TAbi, TName>): SignableTx;
export declare function sendWrite<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>>(input: SendWriteInput<TAbi, TName>): Promise<SendWriteResult>;
export type ContractsErrorCode = 'contracts/unsupported-family' | 'contracts/decode-failure' | 'contracts/receipt-timeout' | 'contracts/reverted' | 'contracts/invalid-argument';
export type ReadEpochTag = Exclude<EpochTag, 'latest_confirmed'>;
export declare class ContractsError extends CfxError {
export interface ReadContractInput<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'pure' | 'view'>> {
export interface PrepareWriteInput<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>> {
export interface SendWriteInput<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>> extends Omit<PrepareWriteInput<TAbi, TName>, 'chainId' | 'family'> {
export interface SendWriteResult {
export declare const __packageName: "@cfxdevkit/contracts";
```

---

## `./abis`

```ts
export { ERC20_ABI }
export { ERC721_ABI }
export { ERC1155_ABI }
export { MULTICALL3_ABI }
export { MULTICALL3_ADDRESS }
```

---

## `./read`

```ts
export type ReadEpochTag = Exclude<EpochTag, 'latest_confirmed'>;
export interface ReadContractInput<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'pure' | 'view'>> {
export declare function readContract<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'pure' | 'view'>>(input: ReadContractInput<TAbi, TName>): Promise<ReturnType<typeof decodeFunctionResult<TAbi, TName>>>;
```

---

## `./write`

```ts
export { waitForReceipt }
export interface PrepareWriteInput<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>> {
export interface SendWriteInput<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>> extends Omit<PrepareWriteInput<TAbi, TName>, 'chainId' | 'family'> {
export interface SendWriteResult {
export declare function prepareWrite<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>>(input: PrepareWriteInput<TAbi, TName>): SignableTx;
export declare function sendWrite<TAbi extends Abi, TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>>(input: SendWriteInput<TAbi, TName>): Promise<SendWriteResult>;
```

---

## `./deploy`

```ts
export { DeployContractInput }
export { DeployContractResult }
export { toHex }
export declare function deployContract<TAbi extends Abi>(input: DeployContractInput<TAbi>): Promise<DeployContractResult>;
```

---

## `./erc20`

```ts
export interface Erc20Bind {
export declare const erc20: {
```

---

## `./bridge`

```ts
export { CROSS_SPACE_CALL_ABI }
export { CROSS_SPACE_CALL_HEX }
export declare function mappedEspaceAddress(coreHexAddress: Hex): `0x${string}`;
export declare function transferToEspace(opts: BridgeBaseOptions & {
export declare function callEspace(opts: BridgeBaseOptions & {
export declare function withdrawFromMapped(opts: BridgeBaseOptions & {
export declare function getMappedBalance(input: {
export declare function getMappedNonce(input: {
export declare function uint256Hex(n: bigint): Hex;
export declare function hexToUint256(hex: Hex): bigint;
```

---

## `./errors`

```ts
export type ContractsErrorCode = 'contracts/unsupported-family' | 'contracts/decode-failure' | 'contracts/receipt-timeout' | 'contracts/reverted' | 'contracts/invalid-argument';
export declare class ContractsError extends CfxError {
```

<!-- api-hash: 81b2681a9d5dbc36948be5b5342c9161d621fb2722b4f6fef16759058eeb72cb -->
