# @cfxdevkit/wallet

**Scope:** Focused wallet primitives — session keys, capability-scoped signers, batched transactions.

**Responsibilities**
- Session key generation and lifecycle (including attestation)
- Capability/policy enforcement on signers (e.g., gas limits, allowed methods)
- Batched transaction helpers (multicall + multisend via `TransactionBatcher`)
- Re-exports a curated subset of `core` wallet APIs for convenience

Depends on: `@cfxdevkit/cdk`, `@cfxdevkit/services` (for keystore).

Security note: this package is the **only** blessed entrypoint for automated signers.

## Install

```bash
npm install @cfxdevkit/wallet
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 34 symbols |
| `./batcher` | 4 symbols |
| `./signers` | 3 symbols |
| `./errors` | 2 symbols |
| `./hardware` | 8 symbols |
| `./hardware/onekey` | 5 symbols |
| `./hardware/ledger` | 8 symbols |
| `./hardware/satochip` | 3 symbols |
| `./init` | 8 symbols |
| `./policies` | 3 symbols |
| `./session-key` | 5 symbols |

---

## `.`

Core wallet primitives and convenience re-exports.

```ts
export declare const __packageName: "@cfxdevkit/wallet";

// Batched transactions
export { BatchTask, TransactionBatcherOptions, TransactionBatchResult }
export declare class TransactionBatcher<T = unknown> {
  constructor(options?: TransactionBatcherOptions);
  add(task: BatchTask): void;
  execute(): Promise<TransactionBatchResult<T>>;
}

// Hardware wallets
export { HardwareWalletAdapter, HardwareWalletKind, HARDWARE_WALLET_KINDS, EVM_DEFAULT_PATH }
export declare function detectHardwareWallet(kind: HardwareWalletKind): Promise<HardwareWalletAdapter>;
export declare function getHardwareWalletAdapter(kind: HardwareWalletKind): Promise<HardwareWalletAdapter>;
export declare function getHardwareWalletPath(kind: HardwareWalletKind, index: number): string;
export declare function signWithHardwareWallet(adapter: HardwareWalletAdapter, path: string, message: string): Promise<RawEvmSignature>;

// Utilities
export { RawEvmSignature, finaliseEip1559Tx, rawSignatureToHex, toCanonicalHex }

// Errors
export declare class SessionKeyError extends CfxError {
  constructor(message: string, code?: string);
}
export declare class HardwareWalletError extends CfxError {
  constructor(message: string, code?: string);
}

// Local wallet management
export declare function defaultKeystorePath(): string;
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;

// Capability-scoped signers
export declare function withCapability(inner: Signer, capability?: Capability): Signer;
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;
export declare function isEmptyCapability(c: Capability): boolean;

// Session keys
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;

// Signers
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;
export declare function readonlySigner(address: Address): Signer;

// Interfaces
export interface InitLocalWalletInput { keystorePath: string; passphrase: string; }
export interface InitLocalWalletResult { keystorePath: string; address: Address; }
export interface OpenLocalWalletInput { keystorePath: string; passphrase: string; }
export interface OpenLocalWalletResult { keystorePath: string; address: Address; }
export interface CreateSessionKeyInput {
  parentSigner: Signer;
  parentPassphrase?: string;
  capability: Capability;
  nonce?: bigint;
}
export interface SessionKey {
  address: Address;
  privateKey: string;
  attestation: SessionAttestation;
}
export interface SessionAttestation {
  parent: Address;
  capability: Capability;
  nonce: bigint;
  signature: string;
}
export interface SignerFromKeystoreInput { keystorePath: string; passphrase: string; }
```

---

## `./batcher`

Batched transaction execution via `TransactionBatcher`.

```ts
export { BatchTask, TransactionBatcherOptions, TransactionBatchResult }
export declare class TransactionBatcher<T = unknown> {
  constructor(options?: TransactionBatcherOptions);
  add(task: BatchTask): void;
  execute(): Promise<TransactionBatchResult<T>>;
}
```

---

## `./signers`

Signer creation and wrappers.

```ts
export interface SignerFromKeystoreInput { keystorePath: string; passphrase: string; }
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;
export declare function readonlySigner(address: Address): Signer;
```

---

## `./errors`

Custom error types.

```ts
export { SessionKeyError, HardwareWalletError }
```

---

## `./hardware`

Hardware wallet abstraction and utilities.

```ts
export { HardwareWalletAdapter, HardwareWalletKind, HARDWARE_WALLET_KINDS, EVM_DEFAULT_PATH }
export declare function detectHardwareWallet(kind: HardwareWalletKind): Promise<HardwareWalletAdapter>;
export declare function getHardwareWalletAdapter(kind: HardwareWalletKind): Promise<HardwareWalletAdapter>;
export declare function getHardwareWalletPath(kind: HardwareWalletKind, index: number): string;
export declare function signWithHardwareWallet(adapter: HardwareWalletAdapter, path: string, message: string): Promise<RawEvmSignature>;
```

---

## `./hardware/onekey`

OneKey hardware wallet support.

```ts
export { OneKeyAdapter }
export declare function detectOneKey(): Promise<OneKeyAdapter>;
export declare function getOneKeyAdapter(): Promise<OneKeyAdapter>;
export declare function getOneKeyPath(index: number): string;
export declare function signWithOneKey(adapter: OneKeyAdapter, path: string, message: string): Promise<RawEvmSignature>;
```

---

## `./hardware/ledger`

Ledger hardware wallet support.

```ts
export { LedgerAdapter }
export declare function detectLedger(): Promise<LedgerAdapter>;
export declare function getLedgerAdapter(): Promise<LedgerAdapter>;
export declare function getLedgerPath(index: number): string;
export declare function signWithLedger(adapter: LedgerAdapter, path: string, message: string): Promise<RawEvmSignature>;
export declare function getLedgerAppVersion(adapter: LedgerAdapter): Promise<string>;
export declare function isLedgerAppOpen(adapter: LedgerAdapter): Promise<boolean>;
export declare function openLedgerApp(adapter: LedgerAdapter): Promise<void>;
export declare function closeLedgerApp(adapter: LedgerAdapter): Promise<void>;
```

---

## `./hardware/satochip`

Satochip hardware wallet support.

```ts
export { SatochipAdapter }
export declare function detectSatochip(): Promise<SatochipAdapter>;
export declare function getSatochipAdapter(): Promise<SatochipAdapter>;
export declare function signWithSatochip(adapter: SatochipAdapter, path: string, message: string): Promise<RawEvmSignature>;
```

---

## `./init`

Local wallet initialization and passphrase management.

```ts
export { InitLocalWalletInput, InitLocalWalletResult }
export { OpenLocalWalletInput, OpenLocalWalletResult }
export declare function defaultKeystorePath(): string;
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;
```

---

## `./policies`

Capability-based signer restrictions.

```ts
export { Capability }
export declare function withCapability(inner: Signer, capability?: Capability): Signer;
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;
export declare function isEmptyCapability(c: Capability): boolean;
```

---

## `./session-key`

Session key generation and attestation.

```ts
export { CreateSessionKeyInput, SessionKey, SessionAttestation }
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
```

## Usage

```ts
import {
  initLocalWallet,
  createSessionKey,
  withCapability,
  TransactionBatcher,
  BatchTask
} from '@cfxdevkit/wallet';

// Initialize a new local wallet
const { keystorePath, address } = await initLocalWallet({
  keystorePath: '/path/to/keystore',
  passphrase: 'secure-passphrase'
});

// Create a session key with limited capability
const parentSigner = await signerFromKeystore({ keystorePath, passphrase: 'secure-passphrase' });
const sessionKey = await createSessionKey({
  parentSigner,
  capability: {
    gasLimit: 1_000_000n,
    methods: ['cfx_sendTransaction']
  }
});

// Wrap the session key with capability enforcement
const sessionSigner = withCapability(sessionKey, sessionKey.capability);

// Batch multiple transactions
const batcher = new TransactionBatcher();
batcher.add(BatchTask.multicall([
  { to: '0x...', data: '0x...' },
  { to: '0x...', data: '0x...' }
]));
batcher.add(BatchTask.multisend([
  { to: '0x...', value: 1n },
  { to: '0x...', value: 2n }
]));
const result = await batcher.execute();
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 7a4da19edb9bcd4ad58f3345d5bfe908cdefdbe1412f84b8014368b68428c649 -->
