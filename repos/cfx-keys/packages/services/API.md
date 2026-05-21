# `@cfxdevkit/services` — Public API

> Pluggable backends: keystore, crypto, dex, tokens.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 30 symbols |
| `./auth` | 10 symbols |
| `./keystore` | 12 symbols |
| `./keystore-audit` | 2 symbols |
| `./keystore-memory` | 3 symbols |
| `./keystore-file` | 6 symbols |
| `./keystore-ledger` | 11 symbols |
| `./crypto` | 18 symbols |
| `./embedded-wallet` | 5 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/services";
export declare const noopAuditLogger: AuditLogger;
export { MemoryNonceStoreOptions }
export { NonceEntry }
export { createMemoryNonceStore }
export { MemoryNonceStore }
export { SessionToken }
export { SessionTokenOptions }
export { VerifySessionTokenOptions }
export { readBearerToken }
export { signSessionToken }
export { verifySessionToken }
export declare class KeystoreEmbeddedWalletManager implements EmbeddedWalletManagerInterface {
export declare function createEmbeddedWalletManager(options: EmbeddedWalletManagerOptions): KeystoreEmbeddedWalletManager;
export declare function createAppendOnlyAuditLogger(opts: AppendOnlyAuditLoggerOptions): AuditLogger;
export interface EmbeddedWallet {
export interface EmbeddedWalletManagerOptions {
export interface EmbeddedWalletManager {
export interface AppendOnlyAuditLoggerOptions {
export interface SecretRef {
export interface Capability {
export interface StoredSecret {
export interface KeystoreCapabilities {
export interface KeystoreListOptions {
export interface KeystoreCallOptions {
export interface KeystorePutInput {
export interface KeystoreProvider {
export interface AuditEntry {
export interface AuditLogger {
export type Timestamp = number;
```

---

## `./auth`

```ts
export { MemoryNonceStoreOptions }
export { NonceEntry }
export { createMemoryNonceStore }
export { MemoryNonceStore }
export { SessionToken }
export { SessionTokenOptions }
export { VerifySessionTokenOptions }
export { readBearerToken }
export { signSessionToken }
export { verifySessionToken }
```

---

## `./keystore`

```ts
export interface SecretRef {
export interface Capability {
export interface StoredSecret {
export interface KeystoreCapabilities {
export interface KeystoreListOptions {
export interface KeystoreCallOptions {
export interface KeystorePutInput {
export interface KeystoreProvider {
export interface AuditEntry {
export interface AuditLogger {
export type Timestamp = number;
export declare const noopAuditLogger: AuditLogger;
```

---

## `./keystore-audit`

```ts
export interface AppendOnlyAuditLoggerOptions {
export declare function createAppendOnlyAuditLogger(opts: AppendOnlyAuditLoggerOptions): AuditLogger;
```

---

## `./keystore-memory`

```ts
export interface MemoryKeystoreSeed {
export interface MemoryKeystoreOptions {
export declare function createMemoryKeystore(opts?: MemoryKeystoreOptions): KeystoreProvider;
```

---

## `./keystore-file`

```ts
export { changeFilePassphrase }
export { initFileKeystore }
export { KdfParams }
export interface FileKeystoreOptions {
export declare function readFileKeystoreMnemonic(input: {
export declare function createFileKeystore(opts: FileKeystoreOptions): KeystoreProvider;
```

---

## `./keystore-ledger`

```ts
export { createLedgerKeystore }
export { signerFromLedger }
export { createLedgerEthApp }
export { createNodeHidLedgerTransport }
export { LedgerAccountConfig }
export { LedgerAddressResponse }
export { LedgerEthAppLike }
export { LedgerKeystoreOptions }
export { LedgerSignatureResponse }
export { LedgerTransportLike }
export { SignerFromLedgerInput }
```

---

## `./crypto`

```ts
export interface EncryptInput {
export interface EncryptOutput {
export interface DecryptInput {
export interface Argon2idInput {
export interface HkdfInput {
export declare function encryptAesGcm(input: EncryptInput): Promise<EncryptOutput>;
export declare function decryptAesGcm(input: DecryptInput): Promise<Uint8Array>;
export declare function toHex(bytes: Uint8Array): Hex;
export declare function fromHex(hex: Hex): Uint8Array;
export declare function toBase64Url(bytes: Uint8Array): string;
export declare function fromBase64Url(text: string): Uint8Array;
export declare function deriveKeyArgon2id(input: Argon2idInput): Promise<AesGcmKey>;
export declare function deriveKeyHkdf(input: HkdfInput): Promise<Uint8Array>;
export declare function brandKey(bytes: Uint8Array): AesGcmKey;
export declare function generateAesGcmKey(): AesGcmKey;
export declare function randomBytes(n: number): Uint8Array;
export declare class CryptoError extends CfxError {
export type AesGcmKey = Uint8Array & {
```

---

## `./embedded-wallet`

```ts
export declare class KeystoreEmbeddedWalletManager implements EmbeddedWalletManagerInterface {
export declare function createEmbeddedWalletManager(options: EmbeddedWalletManagerOptions): KeystoreEmbeddedWalletManager;
export interface EmbeddedWallet {
export interface EmbeddedWalletManagerOptions {
export interface EmbeddedWalletManager {
```

<!-- api-hash: 62f12b850576e44da59336027e129d05617e18f76e551c60b33e16033f6b647d -->
