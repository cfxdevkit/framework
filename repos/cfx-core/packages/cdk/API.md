# `@cfxdevkit/cdk` — Public API

> Conflux RPC client, contract I/O, addresses, units, errors.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 87 symbols |
| `./address` | 4 symbols |
| `./chains` | 12 symbols |
| `./client` | 15 symbols |
| `./errors` | 7 symbols |
| `./types` | 16 symbols |
| `./units` | 13 symbols |
| `./wallet` | 20 symbols |

---

## `.`

```ts
export declare function hexToBase32(hexAddress: Hex, networkId: number, opts?: {
export declare function base32ToHex(base32Address: string, opts?: {
export declare function isBase32Address(address: string): boolean;
export declare function getCoreAddress(address: string): string;
export declare function getChain(idOrName: ChainId | string): ChainConfig;
export declare function listChains(filter?: {
export declare function defineChain(input: ChainConfig): ChainConfig;
export declare function createClient(input: CreateClientInput): Client;
export declare function isCfxError(value: unknown): value is CfxError;
export declare function formatToken(value: Wei, token: {
export declare function formatCFX(value: Wei): string;
export declare function parseCFX(value: string): Wei;
export declare function formatDrip(value: Wei): string;
export declare function parseDrip(value: string): Wei;
export declare function formatGDrip(value: Wei): string;
export declare function parseGDrip(value: string): Wei;
export declare function stringifyBigInt(value: unknown, space?: number): string;
export declare function signerFromPrivateKey(privateKey: Hex, coreNetworkId?: CoreNetworkId): Signer;
export type ChainFamily = 'core' | 'espace';
export type Network = 'mainnet' | 'testnet' | 'devnet' | 'local';
export type Client = EspaceClient | CoreSpaceClient;
export type Address = ViemAddress;
export type Hash = ViemHash;
export type Hex = ViemHex;
export type Wei = bigint;
export type ChainId = number;
export type BlockTag = ViemBlockTag | bigint;
export type Block = ViemBlock;
export type TxRequest = ViemTxRequest;
export type TxReceipt = ViemTxReceipt;
export type TypedData = ViemTypedDataDefinition;
export type RawLog = ViemLog;
export type EpochTag = 'earliest' | 'latest_checkpoint' | 'latest_finalized' | 'latest_mined' | 'latest_state';
export interface ChainConfig {
export interface RpcRequest {
export interface CallOptions {
export interface GetBalanceOptions extends CallOptions {
export interface CoreCallOptions extends CallOptions {
export interface EspaceClient extends ClientBase {
export interface CoreSpaceClient extends ClientBase {
export interface CreateClientInput {
export interface CfxErrorInit {
export interface NodeStatus {
export interface CoreLogFilter {
export interface CoreLog {
export interface SponsorInfo {
export interface Account {
export interface SignableTx {
export interface SignOptions {
export interface Signer {
export declare const espaceMainnet: ChainConfig;
export declare const espaceTestnet: ChainConfig;
export declare const espaceLocal: ChainConfig;
export declare const coreSpaceMainnet: ChainConfig;
export declare const coreSpaceTestnet: ChainConfig;
export declare const coreSpaceLocal: ChainConfig;
export declare const MAX_UINT256: bigint;
export declare const MAX_UINT128: bigint;
export declare const ZERO_ADDRESS: Address;
export { HttpTransportOptions }
export { Transport }
export { WsTransportOptions }
export { fallback }
export { http }
export { ws }
export { formatUnits }
export { parseUnits }
export { CoreNetworkId }
export { DeriveAccountInput }
export { DeriveAccountsInput }
export { DeriveDualAccountInput }
export { DerivedAccount }
export { DualAddressAccount }
export { coreAddressFromPrivateKey }
export { DEFAULT_CORE_PATH }
export { DEFAULT_ESPACE_PATH }
export { deriveAccount }
export { deriveAccounts }
export { deriveDualAccount }
export { deriveDualAccounts }
export { generateMnemonic }
export { validateMnemonic }
export declare class CfxError extends Error {
export declare class RpcError extends CfxError {
export declare class ContractError extends CfxError {
export declare class WalletError extends CfxError {
export declare class KeystoreError extends CfxError {
```

---

## `./address`

```ts
export declare function hexToBase32(hexAddress: Hex, networkId: number, opts?: {
export declare function base32ToHex(base32Address: string, opts?: {
export declare function isBase32Address(address: string): boolean;
export declare function getCoreAddress(address: string): string;
```

---

## `./chains`

```ts
export type ChainFamily = 'core' | 'espace';
export type Network = 'mainnet' | 'testnet' | 'devnet' | 'local';
export interface ChainConfig {
export declare const espaceMainnet: ChainConfig;
export declare const espaceTestnet: ChainConfig;
export declare const espaceLocal: ChainConfig;
export declare const coreSpaceMainnet: ChainConfig;
export declare const coreSpaceTestnet: ChainConfig;
export declare const coreSpaceLocal: ChainConfig;
export declare function getChain(idOrName: ChainId | string): ChainConfig;
export declare function listChains(filter?: {
export declare function defineChain(input: ChainConfig): ChainConfig;
```

---

## `./client`

```ts
export { HttpTransportOptions }
export { Transport }
export { WsTransportOptions }
export { fallback }
export { http }
export { ws }
export interface RpcRequest {
export interface CallOptions {
export interface GetBalanceOptions extends CallOptions {
export interface CoreCallOptions extends CallOptions {
export interface EspaceClient extends ClientBase {
export interface CoreSpaceClient extends ClientBase {
export interface CreateClientInput {
export type Client = EspaceClient | CoreSpaceClient;
export declare function createClient(input: CreateClientInput): Client;
```

---

## `./errors`

```ts
export interface CfxErrorInit {
export declare class CfxError extends Error {
export declare class RpcError extends CfxError {
export declare class ContractError extends CfxError {
export declare class WalletError extends CfxError {
export declare class KeystoreError extends CfxError {
export declare function isCfxError(value: unknown): value is CfxError;
```

---

## `./types`

```ts
export type Address = ViemAddress;
export type Hash = ViemHash;
export type Hex = ViemHex;
export type Wei = bigint;
export type ChainId = number;
export type BlockTag = ViemBlockTag | bigint;
export type Block = ViemBlock;
export type TxRequest = ViemTxRequest;
export type TxReceipt = ViemTxReceipt;
export type TypedData = ViemTypedDataDefinition;
export type RawLog = ViemLog;
export type EpochTag = 'earliest' | 'latest_checkpoint' | 'latest_finalized' | 'latest_mined' | 'latest_state';
export interface NodeStatus {
export interface CoreLogFilter {
export interface CoreLog {
export interface SponsorInfo {
```

---

## `./units`

```ts
export { formatUnits }
export { parseUnits }
export declare const MAX_UINT256: bigint;
export declare const MAX_UINT128: bigint;
export declare const ZERO_ADDRESS: Address;
export declare function formatToken(value: Wei, token: {
export declare function formatCFX(value: Wei): string;
export declare function parseCFX(value: string): Wei;
export declare function formatDrip(value: Wei): string;
export declare function parseDrip(value: string): Wei;
export declare function formatGDrip(value: Wei): string;
export declare function parseGDrip(value: string): Wei;
export declare function stringifyBigInt(value: unknown, space?: number): string;
```

---

## `./wallet`

```ts
export { CoreNetworkId }
export { DeriveAccountInput }
export { DeriveAccountsInput }
export { DeriveDualAccountInput }
export { DerivedAccount }
export { DualAddressAccount }
export { coreAddressFromPrivateKey }
export { DEFAULT_CORE_PATH }
export { DEFAULT_ESPACE_PATH }
export { deriveAccount }
export { deriveAccounts }
export { deriveDualAccount }
export { deriveDualAccounts }
export { generateMnemonic }
export { validateMnemonic }
export interface Account {
export interface SignableTx {
export interface SignOptions {
export interface Signer {
export declare function signerFromPrivateKey(privateKey: Hex, coreNetworkId?: CoreNetworkId): Signer;
```

<!-- api-hash: 4b40ece81b80d5e3142124247a9af8c5d5519b751f648502ddc35389ba38b618 -->
