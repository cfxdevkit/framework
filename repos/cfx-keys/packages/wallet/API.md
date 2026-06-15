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
// Package name identifier for @cfxdevkit/wallet
export declare const __packageName: "@cfxdevkit/wallet";

// Represents a single task in a batched transaction operation
export { BatchTask }

// Configuration options for the TransactionBatcher
export { TransactionBatcherOptions }

// Result structure returned after executing a batch of transactions
export { TransactionBatchResult }

// Abstract interface for hardware wallet adapters
export { HardwareWalletAdapter }

// Enum-like type representing supported hardware wallet kinds
export { HardwareWalletKind }

// Raw EVM signature format (r, s, v components)
export { RawEvmSignature }

// Default derivation path for EVM-compatible addresses on hardware wallets
export { EVM_DEFAULT_PATH }

// Finalizes an EIP-1559 transaction with proper signature encoding
export { finaliseEip1559Tx }

// Array of all supported hardware wallet kinds
export { HARDWARE_WALLET_KINDS }

// Converts a raw signature object into its hex string representation
export { rawSignatureToHex }

// Converts a hex-encoded value to canonical (lowercase, 0x-prefixed) format
export { toCanonicalHex }

// Batches multiple transactions into a single call for improved efficiency
export declare class TransactionBatcher<T = unknown> {
  // Constructs a new batcher instance
  constructor(options?: TransactionBatcherOptions);
  // Adds a transaction to the batch
  add(task: BatchTask): void;
  // Executes the batched transactions and returns results
  execute(): Promise<TransactionBatchResult<T>>;
}

// Error thrown when session key validation fails
export declare class SessionKeyError extends CfxError {
  // Constructs a new SessionKeyError with optional cause
  constructor(message: string, cause?: Error);
}

// Error thrown when hardware wallet interaction fails
export declare class HardwareWalletError extends CfxError {
  // Constructs a new HardwareWalletError with optional cause
  constructor(message: string, cause?: Error);
}

// Returns the default path to the local keystore file
export declare function defaultKeystorePath(): string;

// Initializes a new local wallet with a new keystore and passphrase
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;

// Opens an existing local wallet using its keystore and passphrase
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;

// Rotates the passphrase of an existing local wallet
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;

// Wraps a signer with a capability restriction for fine-grained authorization
export declare function withCapability(inner: Signer, capability?: Capability): Signer;

// Checks whether a given capability permits signing a specific transaction
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;

// Determines if a capability is empty (i.e., grants no permissions)
export declare function isEmptyCapability(c: Capability): boolean;

// Creates a new session key with specified capabilities and expiration
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;

// Generates the canonical message used to attest a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;

// Creates a signer from a local keystore file
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;

// Creates a read-only signer that cannot sign transactions
export declare function readonlySigner(address: Address): Signer;

// Input interface for initializing a new local wallet
export interface InitLocalWalletInput {
  keystorePath: string;
  passphrase: string;
}

// Result interface returned after initializing a local wallet
export interface InitLocalWalletResult {
  address: Address;
  keystorePath: string;
}

// Input interface for opening an existing local wallet
export interface OpenLocalWalletInput {
  keystorePath: string;
  passphrase: string;
}

// Result interface returned after opening a local wallet
export interface OpenLocalWalletResult {
  address: Address;
  signer: Signer;
}

// Input interface for creating a session key
export interface CreateSessionKeyInput {
  parentAddress: Address;
  sessionAddress: Address;
  capability: Capability;
  expiration?: number;
}

// Represents a session key with its attestation and metadata
export interface SessionKey {
  address: Address;
  capability: Capability;
  attestation: SessionAttestation;
  parentAddress: Address;
  expiration?: number;
}

// Attestation data for a session key, including signature and timestamp
export interface SessionAttestation {
  message: string;
  signature: string;
  timestamp: number;
}

// Input interface for creating a signer from a local keystore
export interface SignerFromKeystoreInput {
  keystorePath: string;
  passphrase: string;
}
```

### Usage

```ts
import { openLocalWallet, signerFromKeystore } from '@cfxdevkit/wallet';

// Open an existing wallet
const { signer } = await openLocalWallet({
  keystorePath: '/path/to/keystore',
  passphrase: 'my-secret-passphrase'
});

// Or create a signer directly from keystore
const signer = await signerFromKeystore({
  keystorePath: '/path/to/keystore',
  passphrase: 'my-secret-passphrase'
});
```

---

## `./batcher`

```ts
// Represents a single transaction task in a batch
export { BatchTask }

// Configuration options for the TransactionBatcher
export { TransactionBatcherOptions }

// Result structure returned after executing a batch of transactions
export { TransactionBatchResult }

// Batches multiple transactions into a single call for improved efficiency
export declare class TransactionBatcher<T = unknown> {
  constructor(options?: TransactionBatcherOptions);
  add(task: BatchTask): void;
  execute(): Promise<TransactionBatchResult<T>>;
}
```

### Usage

```ts
import { TransactionBatcher } from '@cfxdevkit/wallet/batcher';

const batcher = new TransactionBatcher();
batcher.add({ to: 'cfx:...', value: '0x1', data: '0x' });
batcher.add({ to: 'cfx:...', value: '0x2', data: '0x' });

const result = await batcher.execute();
console.log(result.results); // Array of transaction hashes or errors
```

---

## `./signers`

```ts
// Input interface for creating a signer from a local keystore
export interface SignerFromKeystoreInput {
  keystorePath: string;
  passphrase: string;
}

// Creates a signer from a local keystore file
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;

// Creates a read-only signer that cannot sign transactions
export declare function readonlySigner(address: Address): Signer;
```

### Usage

```ts
import { signerFromKeystore, readonlySigner } from '@cfxdevkit/wallet/signers';

const signer = await signerFromKeystore({
  keystorePath: '/path/to/keystore',
  passphrase: 'secret'
});

const readOnly = readonlySigner('cfx:...'); // For address-only operations
```

---

## `./errors`

```ts
// Error thrown when session key validation fails
export declare class SessionKeyError extends CfxError {
  constructor(message: string, cause?: Error);
}

// Error thrown when hardware wallet interaction fails
export declare class HardwareWalletError extends CfxError {
  constructor(message: string, cause?: Error);
}
```

### Usage

```ts
import { SessionKeyError } from '@cfxdevkit/wallet/errors';

try {
  // some operation
} catch (err) {
  if (err instanceof SessionKeyError) {
    console.error('Session key error:', err.message);
  }
}
```

---

## `./hardware`

```ts
// Abstract interface for hardware wallet adapters
export { HardwareWalletAdapter }

// Enum-like type representing supported hardware wallet kinds
export { HardwareWalletKind }

// Raw EVM signature format (r, s, v components)
export { RawEvmSignature }

// Default derivation path for EVM-compatible addresses on hardware wallets
export { EVM_DEFAULT_PATH }

// Finalizes an EIP-1559 transaction with proper signature encoding
export { finaliseEip1559Tx }

// Array of all supported hardware wallet kinds
export { HARDWARE_WALLET_KINDS }

// Converts a raw signature object into its hex string representation
export { rawSignatureToHex }

// Converts a hex-encoded value to canonical (lowercase, 0x-prefixed) format
export { toCanonicalHex }
```

### Usage

```ts
import { HARDWARE_WALLET_KINDS, EVM_DEFAULT_PATH } from '@cfxdevkit/wallet/hardware';

console.log(HARDWARE_WALLET_KINDS); // ['ledger', 'onekey', 'satochip']
console.log(EVM_DEFAULT_PATH); // "m/44'/60'/0'/0/0"
```

---

## `./hardware/onekey`

```ts
// Interface describing the OneKey SDK API surface
export interface OneKeySdkLike {
  // SDK methods for interacting with OneKey hardware wallets
}

// Parameters for signing a transaction on OneKey
export interface OneKeyTxParams {
  // Transaction fields required for signing
}

// Core transaction parameters used internally by OneKey
export interface OneKeyCoreTxParams {
  // Internal transaction representation
}

// Input interface for creating a signer from OneKey hardware wallet
export interface SignerFromOneKeyInput {
  sdk: OneKeySdkLike;
  path?: string;
}

// Generic response type from OneKey SDK
export type OneKeyResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Creates a signer from OneKey hardware wallet
export declare function signerFromOneKey(input: SignerFromOneKeyInput): Promise<Signer>;

// Input interface for creating a signer from OneKey Core (non-SDK)
export { SignerFromOneKeyCoreInput }

// Default derivation path for OneKey Core
export { CORE_DEFAULT_PATH }

// Creates a signer from OneKey Core hardware wallet
export { signerFromOneKeyCore }
```

### Usage

```ts
import { signerFromOneKey } from '@cfxdevkit/wallet/hardware/onekey';

const sdk = new OneKeySdk();
const signer = await signerFromOneKey({ sdk });
```

---

## `./hardware/ledger`

```ts
// Creates an instance of Ledger Ethereum app
export { createLedgerEthApp }

// Creates a Node HID transport for Ledger devices
export { createNodeHidLedgerTransport }

// Creates a signer from Ledger hardware wallet
export { signerFromLedger }

// Interface describing Ledger Ethereum app API
export { LedgerEthAppLike }

// Interface describing Ledger transport API
export { LedgerTransportLike }

// Input interface for creating a signer from Ledger
export { SignerFromLedgerInput }

// Input interface for creating a Ledger hardware adapter
export interface LedgerHardwareAdapterInput extends Omit<SignerFromLedgerInput, 'path'> {
  // Additional options for adapter setup
}

// Creates a hardware wallet adapter for Ledger devices
export declare function createLedgerHardwareAdapter(input: LedgerHardwareAdapterInput): HardwareWalletAdapter;
```

### Usage

```ts
import { createLedgerHardwareAdapter } from '@cfxdevkit/wallet/hardware/ledger';

const adapter = await createLedgerHardwareAdapter({
  path: "m/44'/60'/0'/0/0"
});
const signer = adapter.signer;
```

---

## `./hardware/satochip`

```ts
// Configuration for Satochip bridge connection
export interface SatochipBridgeConfig {
  // Bridge connection options
}

// Input interface for creating a signer from Satochip
export interface SignerFromSatochipInput extends SatochipBridgeConfig {
  // Optional path override
}

// Creates a signer from Satochip hardware wallet
export declare function signerFromSatochip(input?: SignerFromSatochipInput): Promise<Signer>;
```

### Usage

```ts
import { signerFromSatochip } from '@cfxdevkit/wallet/hardware/satochip';

const signer = await signerFromSatochip({
  // bridge config
});
```

---

## `./init`

```ts
// Returns the default path to the local keystore file
export declare function defaultKeystorePath(): string;

// Initializes a new local wallet with a new keystore and passphrase
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;

// Opens an existing local wallet using its keystore and passphrase
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;

// Rotates the passphrase of an existing local wallet
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;

// Input interface for initializing a new local wallet
export interface InitLocalWalletInput {
  keystorePath: string;
  passphrase: string;
}

// Result interface returned after initializing a local wallet
export interface InitLocalWalletResult {
  address: Address;
  keystorePath: string;
}

// Input interface for opening an existing local wallet
export interface OpenLocalWalletInput {
  keystorePath: string;
  passphrase: string;
}

// Result interface returned after opening a local wallet
export interface OpenLocalWalletResult {
  address: Address;
  signer: Signer;
}
```

### Usage

```ts
import { initLocalWallet, openLocalWallet } from '@cfxdevkit/wallet/init';

// Initialize new wallet
const result = await initLocalWallet({
  keystorePath: '/path/to/new/keystore',
  passphrase: 'new-secret'
});

// Open existing wallet
const { signer } = await openLocalWallet({
  keystorePath: result.keystorePath,
  passphrase: 'new-secret'
});
```

---

## `./policies`

```ts
// Wraps a signer with a capability restriction for fine-grained authorization
export declare function withCapability(inner: Signer, capability?: Capability): Signer;

// Checks whether a given capability permits signing a specific transaction
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;

// Determines if a capability is empty (i.e., grants no permissions)
export declare function isEmptyCapability(c: Capability): boolean;
```

### Usage

```ts
import { withCapability, checkCapability, isEmptyCapability } from '@cfxdevkit/wallet/policies';

const baseSigner = await signerFromKeystore(...);
const restrictedSigner = withCapability(baseSigner, {
  allowedTo: ['transfer'],
  maxAmount: '0x1000000000000000000' // 1 CFX
});

const err = checkCapability(restrictedSigner.capability, tx);
if (err) throw err;
```

---

## `./session-key`

```ts
// Input interface for creating a session key
export interface CreateSessionKeyInput {
  parentAddress: Address;
  sessionAddress: Address;
  capability: Capability;
  expiration?: number;
}

// Represents a session key with its attestation and metadata
export interface SessionKey {
  address: Address;
  capability: Capability;
  attestation: SessionAttestation;
  parentAddress: Address;
  expiration?: number;
}

// Attestation data for a session key, including signature and timestamp
export interface SessionAttestation {
  message: string;
  signature: string;
  timestamp: number;
}

// Creates a new session key with specified capabilities and expiration
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;

// Generates the canonical message used to attest a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
```

### Usage

```ts
import { createSessionKey } from '@cfxdevkit/wallet/session-key';

const sessionKey = await createSessionKey({
  parentAddress: 'cfx:...',
  sessionAddress: 'cfx:...',
  capability: {
    allowedTo: ['transfer'],
    maxAmount: '0x1000000000000000000'
  },
  expiration: Date.now() + 86400000 // 1 day
});
```

<!-- api-hash: 975cab7b64c487a7b2e89f19fcce89bc7322d1ff3b953ddbd30d5946daa2c92f -->
