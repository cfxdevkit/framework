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
| `./hardware/onekey` | 5 symbols |
| `./hardware/ledger` | 8 symbols |
| `./hardware/satochip` | 3 symbols |
| `./init` | 8 symbols |
| `./policies` | 3 symbols |
| `./session-key` | 5 symbols |

---

## `.`

### Usage

```ts
import { initLocalWallet, createSessionKey } from '@cfxdevkit/wallet';

const wallet = await initLocalWallet({ /* ... */ });
const sessionKey = await createSessionKey({ /* ... */ });
```

```ts
// Package identifier for runtime type checking
export declare const __packageName: "@cfxdevkit/wallet";
// A single task to be executed in a transaction batch
export { BatchTask }
// Configuration options for the transaction batcher
export { TransactionBatcherOptions }
// The result of a transaction batch execution
export { TransactionBatchResult }
// Base class for hardware wallet adapters
export { HardwareWalletAdapter }
// Enumeration of supported hardware wallet types
export { HardwareWalletKind }
// Type representing a raw EVM signature
export { RawEvmSignature }
// The default derivation path for EVM-compatible chains
export { EVM_DEFAULT_PATH }
// Finalizes an EIP-1559 transaction by computing and attaching gas fees
export { finaliseEip1559Tx }
// A collection of all supported hardware wallet kinds
export { HARDWARE_WALLET_KINDS }
// Converts a raw signature to a hex string
export { rawSignatureToHex }
// Converts a value to its canonical hex representation
export { toCanonicalHex }
// Class for batching and executing multiple transactions
export declare class TransactionBatcher<T = unknown> {
  // Constructs a new batcher with given options
  constructor(options: TransactionBatcherOptions);
  // Adds a task to the batch
  addTask(task: BatchTask<T>): void;
  // Executes all tasks in the batch
  execute(): Promise<TransactionBatchResult<T>>;
}
// Error thrown during session key operations
export declare class SessionKeyError extends CfxError {
  constructor(message: string);
}
// Error thrown during hardware wallet operations
export declare class HardwareWalletError extends CfxError {
  constructor(message: string);
}
// Returns the default path for the local keystore
export declare function defaultKeystorePath(): string;
// Initializes a new local wallet with encryption and key derivation
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;
// Opens an existing local wallet using its passphrase
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;
// Rotates the passphrase for a local wallet
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;
// Wraps a signer with specific capabilities to restrict its signing authority
export declare function withCapability(inner: Signer, capability?: Capability): Signer;
// Validates if a transaction complies with a given capability
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;
// Checks if a capability is empty (i.e., grants no restrictions)
export declare function isEmptyCapability(c: Capability): boolean;
// Creates a new session key with optional capability restrictions
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
// Generates the canonical attestation message for a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
// Creates a signer from a keystore file
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;
// Creates a read-only signer that only provides an address
export declare function readonlySigner(address: Address): Signer;
// Input parameters for initializing a local wallet
export interface InitLocalWalletInput {
  keystorePath: string;
  passphrase: string;
}
// Result of initializing a local wallet
export interface InitLocalWalletResult {
  keystorePath: string;
  signer: Signer;
}
// Input parameters for opening a local wallet
export interface OpenLocalWalletInput {
  keystorePath: string;
  passphrase: string;
}
// Result of opening a local wallet
export interface OpenLocalWalletResult {
  signer: Signer;
}
// Input parameters for creating a session key
export interface CreateSessionKeyInput {
  parentSigner: Signer;
  capability?: Capability;
  ttl?: number;
}
// Interface representing a session key
export interface SessionKey {
  address: Address;
  attestation: SessionAttestation;
  signer: Signer;
}
// Interface representing a session key attestation
export interface SessionAttestation {
  parent: Address;
  capability: Capability;
  timestamp: number;
  signature: RawEvmSignature;
}
// Creates a new session key
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
// Generates the canonical attestation message for a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
```

---

## `./batcher`

### Usage

```ts
import { TransactionBatcher } from '@cfxdevkit/wallet/batcher';

const batcher = new TransactionBatcher();
batcher.addTask({ ... });
const result = await batcher.execute();
```

```ts
// Class for managing and executing transaction batches
export declare class TransactionBatcher<T = unknown> {
  // Constructs a new batcher with given options
  constructor(options: TransactionBatcherOptions);
  // Adds a task to the batch
  addTask(task: BatchTask<T>): void;
  // Executes all tasks in the batch
  execute(): Promise<TransactionBatchResult<T>>;
}
```

---

## `./signers`

### Usage

```ts
import { signerFromKeystore, readonlySigner } from '@cfxdevkit/wallet/signers';

const signer = await signerFromKeystore({ keystorePath: '...', password: '...' });
const readOnly = readonlySigner('0x...');
```

```ts
// Input for creating a signer from a keystore
export interface SignerFromKeystoreInput {
  keystorePath: string;
  password: string;
}
// Creates a signer from a keystore file
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;
// Creates a read-only signer that only provides an address
export declare function readonlySigner(address: Address): Signer;
```

---

## `./errors`

### Usage

```ts
import { SessionKeyError, HardwareWalletError } from '@cfxdevkit/wallet/errors';

try {
  // ...
} catch (e) {
  if (e instanceof SessionKeyError) { /* ... */ }
}
```

```ts
// Error thrown during session key operations
export declare class SessionKeyError extends CfxError {
  constructor(message: string);
}
// Error thrown during hardware wallet operations
export declare class HardwareWalletError extends CfxError {
  constructor(message: string);
}
```

---

## `./hardware`

### Usage

```ts
import { HardwareWalletAdapter } from '@cfxdevkit/wallet/hardware';

const adapter = new HardwareWalletAdapter({ ... });
const signature = await adapter.signTransaction(tx);
```

```ts
// Base class for hardware wallet adapters
export declare class HardwareWalletAdapter {
  // Constructs a hardware wallet adapter with given input
  constructor(input: HardwareWalletAdapterInput);
  // Signs a transaction using the hardware wallet
  signTransaction(tx: SignableTx): Promise<Signature>;
}
```

---

## `./hardware/onekey`

### Usage

```ts
import { OneKeySdkLike } from '@cfxdevkit/wallet/hardware/onekey';

// Use the OneKey SDK-like interface
```

```ts
// Interface mimicking the OneKey SDK
export interface OneKeySdkLike {
  // Creates a Ledger Eth app instance
  createLedgerEthApp(): LedgerEthAppLike;
  // Creates a Ledger HID transport instance
  createNodeHidLedgerTransport(): LedgerTransportLike;
  // Creates a signer using the OneKey SDK
  signerFromOneKey(input: SignerFromOneKeyInput): Promise<Signer>;
}
```

---

## `./hardware/ledger`

### Usage

```ts
import { createLedgerHardwareAdapter } from '@cfxdevkit/wallet/hardware/ledger';

const adapter = createLedgerHardwareAdapter({ ... });
```

```ts
// Input for creating a Ledger hardware adapter
export interface LedgerHardwareAdapterInput extends Omit<SignerFromLedgerInput, 'path'> {
  transport: LedgerTransportLike;
}
// Factory function to create a Ledger hardware adapter
export declare function createLedgerHardwareAdapter(input: LedgerHardwareAdapterInput): HardwareWalletAdapter;
```

---

## `./hardware/satochip`

### Usage

```ts
import { signerFromSatochip } from '@cfxdevkit/wallet/hardware/satochip';

const signer = await signerFromSatochip();
```

```ts
// Configuration for the Satochip bridge
export interface SatochipBridgeConfig {
  // Configuration options
}
// Creates a signer using Satochip
export declare function signerFromSatochip(input?: SignerFromSatochipInput): Promise<Signer>;
```

---

## `./init`

### Usage

```ts
import { initLocalWallet, defaultKeystorePath } from '@cfxdevkit/wallet/init';

const path = defaultKeystorePath();
const wallet = await initLocalWallet({ ... });
```

```ts
// Returns the default path for the local keystore
export declare function defaultKeystorePath(): string;
// Initializes a new local wallet with encryption and key derivation
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;
// Opens an existing local wallet using its passphrase
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;
// Rotates the passphrase for a local wallet
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;
// Wraps a signer with specific capabilities to restrict its signing authority
export declare function withCapability(inner: Signer, capability?: Capability): Signer;
// Validates if a transaction complies with a given capability
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;
// Checks if a capability is empty (i.e., grants no restrictions)
export declare function isEmptyCapability(c: Capability): boolean;
// Creates a new session key with optional capability restrictions
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
// Generates the canonical attestation message for a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
```

---

## `./policies`

### Usage

```ts
import { withCapability, checkCapability } from '@cfxdevkit/wallet/policies';

const restrictedSigner = withCapability(signer, capability);
const error = checkCapability(capability, tx);
```

```ts
// Wraps a signer with specific capabilities to restrict its signing authority
export declare function withCapability(inner: Signer, capability?: Capability): Signer;
// Validates if a transaction complies with a given capability
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;
// Checks if a capability is empty (i.e., grants no restrictions)
export declare function isEmptyCapability(c: Capability): boolean;
```

---

## `./session-key`

### Usage

```ts
import { createSessionKey, canonicalAttestationMessage } from '@cfxdevkit/wallet/session-key';

const sessionKey = await createSessionKey({ ... });
const msg = canonicalAttestationMessage(addr, parent, cap);
```

```ts
// Creates a new session key with optional capability restrictions
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;
// Generates the canonical attestation message for a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
```

<!-- api-hash: 2498983ca89a969e26ce2878206c3d3d05145ab7b198e17b08fc56a29363736a -->
