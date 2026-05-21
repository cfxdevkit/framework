# @cfxdevkit/services

**Scope:** Stateless service primitives sitting just above `@cfxdevkit/cdk`.

**Responsibilities**
- AES-256-GCM encryption helpers
- Encrypted keystore format + read/write (file, memory, Ledger hardware wallet)
- DEX adapters (Swappi today; pluggable interface for future DEXs)
- Token metadata service
- Session token management and bearer token parsing
- Embedded wallet integration via keystore-backed managers
- Audit logging for keystore operations

Depends on: `@cfxdevkit/cdk` only.

## Install

```bash
npm install @cfxdevkit/services
```

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

export { MemoryNonceStoreOptions } from "./auth";
export { NonceEntry } from "./auth";
export { createMemoryNonceStore } from "./auth";
export { MemoryNonceStore } from "./auth";
export { SessionToken } from "./auth";
export { SessionTokenOptions } from "./auth";
export { VerifySessionTokenOptions } from "./auth";
export { readBearerToken } from "./auth";
export { signSessionToken } from "./auth";
export { verifySessionToken } from "./auth";

export { SecretRef, Capability, StoredSecret, KeystoreCapabilities, KeystoreListOptions, KeystoreCallOptions, KeystorePutInput, KeystoreProvider } from "./keystore";
export { AuditEntry, AuditLogger, Timestamp } from "./keystore-audit";

export { MemoryNonceStoreOptions, NonceEntry, createMemoryNonceStore, MemoryNonceStore } from "./keystore-memory";

export { KeystoreFileProvider, KeystoreFileProviderOptions } from "./keystore-file";

export { KeystoreLedgerProvider, LedgerKeyPath, LedgerKeyPathOptions } from "./keystore-ledger";

export { encryptData, decryptData, generateKey, deriveKeyFromPassword } from "./crypto";

export { EmbeddedWallet, EmbeddedWalletManagerOptions, EmbeddedWalletManager, KeystoreEmbeddedWalletManager, createEmbeddedWalletManager } from "./embedded-wallet";

export { createAppendOnlyAuditLogger, AppendOnlyAuditLoggerOptions } from "./keystore-audit";
```

---

## `./auth`

Session token and bearer token utilities for stateless authentication.

```ts
export { MemoryNonceStoreOptions, NonceEntry, createMemoryNonceStore, MemoryNonceStore } from "./auth";
export { SessionToken, SessionTokenOptions, VerifySessionTokenOptions } from "./auth";
export { readBearerToken, signSessionToken, verifySessionToken } from "./auth";
```

---

## `./keystore`

Core keystore interfaces and types.

```ts
export interface SecretRef {
  id: string;
  path: string[];
}

export interface Capability {
  name: string;
  args?: Record<string, unknown>;
}

export interface StoredSecret {
  id: string;
  path: string[];
  encryptedValue: Uint8Array;
  nonce: Uint8Array;
  capabilities: Capability[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KeystoreCapabilities {
  list: boolean;
  get: boolean;
  put: boolean;
  delete: boolean;
}

export interface KeystoreListOptions {
  prefix?: string[];
}

export interface KeystoreCallOptions {
  capability: Capability;
}

export interface KeystorePutInput {
  id: string;
  path: string[];
  value: Uint8Array;
  capabilities: Capability[];
}

export interface KeystoreProvider {
  list(options?: KeystoreListOptions): Promise<StoredSecret[]>;
  get(id: string): Promise<StoredSecret | null>;
  put(input: KeystorePutInput): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## `./keystore-audit`

Audit logging for keystore operations.

```ts
export interface AuditEntry {
  timestamp: Timestamp;
  operation: string;
  keystoreId?: string;
  secretId?: string;
  caller?: string;
  success: boolean;
  error?: string;
}

export interface AuditLogger {
  log(entry: AuditEntry): void;
}

export function createAppendOnlyAuditLogger(opts: AppendOnlyAuditLoggerOptions): AuditLogger;

export interface AppendOnlyAuditLoggerOptions {
  onLog?: (entry: AuditEntry) => void;
}
```

---

## `./keystore-memory`

In-memory keystore provider.

```ts
export { MemoryNonceStoreOptions, NonceEntry, createMemoryNonceStore, MemoryNonceStore } from "./keystore-memory";
```

---

## `./keystore-file`

File-backed encrypted keystore provider.

```ts
export interface KeystoreFileProviderOptions {
  path: string;
  password: string | (() => string | Promise<string>);
}

export class KeystoreFileProvider implements KeystoreProvider {
  constructor(opts: KeystoreFileProviderOptions);
  list(options?: KeystoreListOptions): Promise<StoredSecret[]>;
  get(id: string): Promise<StoredSecret | null>;
  put(input: KeystorePutInput): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## `./keystore-ledger`

Ledger hardware wallet-backed keystore provider.

```ts
export interface LedgerKeyPath {
  purpose: number;
  coinType: number;
  account: number;
  change: number;
  index: number;
}

export interface LedgerKeyPathOptions {
  path: LedgerKeyPath;
}

export class KeystoreLedgerProvider implements KeystoreProvider {
  constructor(opts: LedgerKeyPathOptions);
  list(options?: KeystoreListOptions): Promise<StoredSecret[]>;
  get(id: string): Promise<StoredSecret | null>;
  put(input: KeystorePutInput): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## `./crypto`

AES-256-GCM encryption helpers.

```ts
export function encryptData(plaintext: Uint8Array, key: Uint8Array, nonce?: Uint8Array): { ciphertext: Uint8Array; nonce: Uint8Array };
export function decryptData(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array): Uint8Array;
export function generateKey(): Uint8Array;
export function deriveKeyFromPassword(password: string, salt: Uint8Array): Uint8Array;
```

---

## `./embedded-wallet`

Embedded wallet integration using keystore-backed secret storage.

```ts
export interface EmbeddedWallet {
  id: string;
  address: string;
  createdAt: Timestamp;
}

export interface EmbeddedWalletManagerOptions {
  keystore: KeystoreProvider;
}

export interface EmbeddedWalletManager {
  createWallet(): Promise<EmbeddedWallet>;
  listWallets(): Promise<EmbeddedWallet[]>;
  getWallet(id: string): Promise<EmbeddedWallet | null>;
  deleteWallet(id: string): Promise<void>;
}

export class KeystoreEmbeddedWalletManager implements EmbeddedWalletManager {
  constructor(options: EmbeddedWalletManagerOptions);
  createWallet(): Promise<EmbeddedWallet>;
  listWallets(): Promise<EmbeddedWallet[]>;
  getWallet(id: string): Promise<EmbeddedWallet | null>;
  deleteWallet(id: string): Promise<void>;
}

export function createEmbeddedWalletManager(options: EmbeddedWalletManagerOptions): KeystoreEmbeddedWalletManager;
```

<!-- readme-hash: 37c1d0dc903a25f5a89302c4f79b44a71b54a4bbc01070fe0c61f661281e1cc2 -->
