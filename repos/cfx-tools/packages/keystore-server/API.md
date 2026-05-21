# `@cfxdevkit/keystore-server` — Public API

> Standalone Hono keystore router extracted from devnode-server.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 14 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/keystore-server";
export interface KeystoreServerAppOptions {
export interface WalletSummary {
export interface ActiveWalletSummary extends WalletSummary {
export interface WalletAccountSummary {
export interface RevealRequestSummary {
export interface RevealedSecret {
export interface KeystoreResetGuidance {
export interface KeystoreStatus {
export declare function createKeystoreApp(options: KeystoreServerAppOptions): Hono;
export declare function createKeystoreRoutes(keystore: KeystoreService, options?: {
export type RevealKind = 'mnemonic' | 'private-key';
export type KeystoreLifecyclePhase = 'blank' | 'locked' | 'unlocked' | 'active-wallet';
export declare class KeystoreService {
```

<!-- api-hash: 2cff488d60829206c00cc17739764c844841c54f5173a2a148f650e9a7dbe325 -->
