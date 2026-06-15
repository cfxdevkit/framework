# `@cfxdevkit/wallet` — Public API

> Session keys, signers, batched writes, capability policies.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 34 symbols |
| `./batcher` | 4 symbols |
| `./signers` | 3 symbols |
| `./errors` | 2 symbols |
| `./hardware` | 8 symbols |
| `./hardware/onekey` | 9 symbols |
| `./hardware/ledger` | 8 symbols |
| `./hardware/satochip` | 3 symbols |
| `./init` | 8 symbols |
| `./policies` | 3 symbols |
| `./session-key` | 5 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/wallet";
export { BatchTask }
export { TransactionBatcherOptions }
export { TransactionBatchResult }
export { HardwareWalletAdapter }
export { HardwareWalletKind }
export { RawEvmSignature }
export { EVM_DEFAULT_PATH }
export { finaliseEip1559Tx }
export { HARDWARE_WALLET_KINDS }
export { rawSignatureToHex }
export { toCanonicalHex }
export declare class TransactionBatcher<T = unknown> {
export declare class SessionKeyError extends CfxError {
export declare class HardwareWalletError extends CfxError {
export declare function defaultKeystorePath(): string;
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;
export declare function rotateLocalPassphrase(input: {
export declare function withCapability(inner: Signer, capability?: Capability): Signer;
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;
export declare function isEmptyCapability(c: Capability): boolean;
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;
export declare function readonlySigner(address: Address): Signer;
export interface InitLocalWalletInput {
export interface InitLocalWalletResult {
export interface OpenLocalWalletInput {
export interface OpenLocalWalletResult {
export interface CreateSessionKeyInput {
export interface SessionKey {
export interface SessionAttestation {
export interface SignerFromKeystoreInput {
```

---

## `./batcher`

```ts
export { BatchTask }
export { TransactionBatcherOptions }
export { TransactionBatchResult }
export declare class TransactionBatcher<T = unknown> {
```

---

## `./signers`

```ts
export interface SignerFromKeystoreInput {
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;
export declare function readonlySigner(address: Address): Signer;
```

---

## `./errors`

```ts
export declare class SessionKeyError extends CfxError {
export declare class HardwareWalletError extends CfxError {
```

---

## `./hardware`

```ts
export { HardwareWalletAdapter }
export { HardwareWalletKind }
export { RawEvmSignature }
export { EVM_DEFAULT_PATH }
export { finaliseEip1559Tx }
export { HARDWARE_WALLET_KINDS }
export { rawSignatureToHex }
export { toCanonicalHex }
```

---

## `./hardware/onekey`

```ts
export interface OneKeySdkLike {
export interface OneKeyTxParams {
export interface OneKeyCoreTxParams {
export interface SignerFromOneKeyInput {
export type OneKeyResponse<T> = {
export declare function signerFromOneKey(input: SignerFromOneKeyInput): Promise<Signer>;
export { SignerFromOneKeyCoreInput }
export { CORE_DEFAULT_PATH }
export { signerFromOneKeyCore }
```

---

## `./hardware/ledger`

```ts
export { createLedgerEthApp }
export { createNodeHidLedgerTransport }
export { signerFromLedger }
export { LedgerEthAppLike }
export { LedgerTransportLike }
export { SignerFromLedgerInput }
export interface LedgerHardwareAdapterInput extends Omit<SignerFromLedgerInput, 'path'> {
export declare function createLedgerHardwareAdapter(input: LedgerHardwareAdapterInput): HardwareWalletAdapter;
```

---

## `./hardware/satochip`

```ts
export interface SatochipBridgeConfig {
export interface SignerFromSatochipInput extends SatochipBridgeConfig {
export declare function signerFromSatochip(input?: SignerFromSatochipInput): Promise<Signer>;
```

---

## `./init`

```ts
export declare function defaultKeystorePath(): string;
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;
export declare function rotateLocalPassphrase(input: {
export interface InitLocalWalletInput {
export interface InitLocalWalletResult {
export interface OpenLocalWalletInput {
export interface OpenLocalWalletResult {
```

---

## `./policies`

```ts
export declare function withCapability(inner: Signer, capability?: Capability): Signer;
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;
export declare function isEmptyCapability(c: Capability): boolean;
```

---

## `./session-key`

```ts
export interface CreateSessionKeyInput {
export interface SessionKey {
export interface SessionAttestation {
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
```

<!-- api-hash: 975cab7b64c487a7b2e89f19fcce89bc7322d1ff3b953ddbd30d5946daa2c92f -->
