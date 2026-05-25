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

```ts
// Package name identifier for @cfxdevkit/wallet
export declare const __packageName: "@cfxdevkit/wallet";

// Represents a single task in a batched transaction operation
export { BatchTask }

// Configuration options for the TransactionBatcher
export { TransactionBatcherOptions }

// Result structure returned after executing a batch of transactions
export { TransactionBatchResult }

// Interface abstracting hardware wallet adapters for signing operations
export { HardwareWalletAdapter }

// Enum-like type representing supported hardware wallet kinds
export { HardwareWalletKind }

// Raw EVM signature format (r, s, v components)
export { RawEvmSignature }

// Default derivation path for EVM-compatible addresses on hardware wallets
export { EVM_DEFAULT_PATH }

// Finalizes an EIP-1559 transaction by populating missing fields and computing signature
export { finaliseEip1559Tx }

// Array of all supported hardware wallet kinds
export { HARDWARE_WALLET_KINDS }

// Converts a raw signature object into its hex-encoded string representation
export { rawSignatureToHex }

// Converts a hex-encoded signature to canonical format (lowercase, 0x-prefixed)
export { toCanonicalHex }

// Class for batching and executing multiple transactions efficiently
export declare class TransactionBatcher<T = unknown> {
  // Batches and executes transactions with configurable concurrency and retry behavior
}

// Error class for session key-related failures
export declare class SessionKeyError extends CfxError {
  // Thrown when session key validation, creation, or usage fails
}

// Error class for hardware wallet communication failures
export declare class HardwareWalletError extends CfxError {
  // Thrown when interacting with hardware wallets (e.g., connection, signing errors)
}

// Returns the default file path for local keystore storage
export declare function defaultKeystorePath(): string;

// Initializes a new local wallet with a new keystore and passphrase
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;

// Opens an existing local wallet using its keystore and passphrase
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;

// Rotates the passphrase protecting a local wallet keystore
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;

// Wraps a signer to enforce a capability-based restriction on its signing authority
export declare function withCapability(inner: Signer, capability?: Capability): Signer;

// Validates whether a transaction complies with a given capability policy
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;

// Checks if a capability is empty (i.e., grants no restrictions)
export declare function isEmptyCapability(c: Capability): boolean;

// Creates a session key with specified capabilities and expiration
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;

// Generates the canonical message used to attest a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;

// Constructs a signer from an encrypted keystore file
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;

// Returns a signer that can only sign read-only operations (no actual signing)
export declare function readonlySigner(address: Address): Signer;

// Input interface for initializing a new local wallet
export interface InitLocalWalletInput {
  passphrase: string;
  keystorePath?: string;
}

// Result interface returned after initializing a local wallet
export interface InitLocalWalletResult {
  keystorePath: string;
  address: Address;
}

// Input interface for opening an existing local wallet
export interface OpenLocalWalletInput {
  passphrase: string;
  keystorePath?: string;
}

// Result interface returned after opening a local wallet
export interface OpenLocalWalletResult {
  keystorePath: string;
  address: Address;
}

// Input interface for creating a session key
export interface CreateSessionKeyInput {
  parentSigner: Signer;
  sessionAddress: Address;
  capability: Capability;
  expiration?: number;
}

// Represents a session key with its attestation and metadata
export interface SessionKey {
  address: Address;
  capability: Capability;
  attestation: SessionAttestation;
  expiration: number;
}

// Attestation object proving a session key’s authority
export interface SessionAttestation {
  parentAddress: Address;
  message: string;
  signature: string;
}

// Input interface for constructing a signer from a keystore
export interface SignerFromKeystoreInput {
  keystorePath: string;
  passphrase: string;
}
```

### Usage

```ts
import { initLocalWallet, openLocalWallet, signerFromKeystore } from '@cfxdevkit/wallet';

// Initialize a new wallet
const result = await initLocalWallet({ passphrase: 'my-secret' });

// Open existing wallet
const wallet = await openLocalWallet({ passphrase: 'my-secret', keystorePath: result.keystorePath });

// Create a signer for signing transactions
const signer = await signerFromKeystore({ keystorePath: result.keystorePath, passphrase: 'my-secret' });
```

---

## `./batcher`

```ts
// Represents a single transaction task in a batch
export { BatchTask }

// Options for configuring batcher behavior (e.g., concurrency, timeout)
export { TransactionBatcherOptions }

// Result of executing a batch of transactions
export { TransactionBatchResult }

// Class for batching and executing multiple transactions efficiently
export declare class TransactionBatcher<T = unknown> {
  // Adds a transaction to the batch
  add(task: BatchTask): void;

  // Executes all queued transactions in batches
  execute(options?: TransactionBatcherOptions): Promise<TransactionBatchResult<T>>;
}
```

### Usage

```ts
import { TransactionBatcher } from '@cfxdevkit/wallet';

const batcher = new TransactionBatcher();
batcher.add({ tx: tx1, signer });
batcher.add({ tx: tx2, signer });

const result = await batcher.execute({ concurrency: 2 });
```

---

## `./signers`

```ts
// Input interface for constructing a signer from a keystore
export interface SignerFromKeystoreInput {
  keystorePath: string;
  passphrase: string;
}

// Constructs a signer from an encrypted keystore file
export declare function signerFromKeystore(input: SignerFromKeystoreInput): Promise<Signer>;

// Returns a signer that can only sign read-only operations (no actual signing)
export declare function readonlySigner(address: Address): Signer;
```

### Usage

```ts
import { signerFromKeystore, readonlySigner } from '@cfxdevkit/wallet';

const signer = await signerFromKeystore({ keystorePath: '/path/to/keystore', passphrase: 'secret' });
const readOnly = readonlySigner('cfx:...'); // For read-only queries
```

---

## `./errors`

```ts
// Error class for session key-related failures
export declare class SessionKeyError extends CfxError {
  // Thrown when session key validation, creation, or usage fails
}

// Error class for hardware wallet communication failures
export declare class HardwareWalletError extends CfxError {
  // Thrown when interacting with hardware wallets (e.g., connection, signing errors)
}
```

### Usage

```ts
import { SessionKeyError } from '@cfxdevkit/wallet';

try {
  // ...
} catch (e) {
  if (e instanceof SessionKeyError) {
    console.error('Session key error:', e.message);
  }
}
```

---

## `./hardware`

```ts
// Interface abstracting hardware wallet adapters for signing operations
export { HardwareWalletAdapter }

// Enum-like type representing supported hardware wallet kinds
export { HardwareWalletKind }

// Raw EVM signature format (r, s, v components)
export { RawEvmSignature }

// Default derivation path for EVM-compatible addresses on hardware wallets
export { EVM_DEFAULT_PATH }

// Finalizes an EIP-1559 transaction by populating missing fields and computing signature
export { finaliseEip1559Tx }

// Array of all supported hardware wallet kinds
export { HARDWARE_WALLET_KINDS }

// Converts a raw signature object into its hex-encoded string representation
export { rawSignatureToHex }

// Converts a hex-encoded signature to canonical format (lowercase, 0x-prefixed)
export { toCanonicalHex }
```

### Usage

```ts
import { HARDWARE_WALLET_KINDS, finaliseEip1559Tx } from '@cfxdevkit/wallet';

console.log('Supported hardware wallets:', HARDWARE_WALLET_KINDS);
const finalizedTx = finaliseEip1559Tx(tx, chainId);
```

---

## `./hardware/onekey`

```ts
// Interface describing the OneKey SDK API
export interface OneKeySdkLike {
  // SDK methods for interacting with OneKey hardware wallets
}

// Parameters for signing a transaction with OneKey
export interface OneKeyTxParams {
  to: string;
  value: string;
  data?: string;
  gasLimit: string;
  gasPrice: string;
}

// Input interface for creating a signer from OneKey hardware wallet
export interface SignerFromOneKeyInput {
  sdk: OneKeySdkLike;
  path?: string;
}

// Generic response type for OneKey SDK calls
export type OneKeyResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Creates a signer backed by OneKey hardware wallet
export declare function signerFromOneKey(input: SignerFromOneKeyInput): Promise<Signer>;
```

### Usage

```ts
import { signerFromOneKey } from '@cfxdevkit/wallet/hardware/onekey';

const sdk = new OneKeySDK();
const signer = await signerFromOneKey({ sdk });
```

---

## `./hardware/ledger`

```ts
// Factory function to create a Ledger Ethereum app instance
export { createLedgerEthApp }

// Factory function to create a Node HID transport for Ledger devices
export { createNodeHidLedgerTransport }

// Creates a signer backed by Ledger hardware wallet
export { signerFromLedger }

// Interface describing the Ledger Ethereum app API
export { LedgerEthAppLike }

// Interface describing a Ledger transport layer
export { LedgerTransportLike }

// Input interface for creating a Ledger-backed signer
export { SignerFromLedgerInput }

// Extended input for creating a hardware adapter for Ledger
export interface LedgerHardwareAdapterInput extends Omit<SignerFromLedgerInput, 'path'> {
  // Additional options for adapter configuration
}

// Creates a HardwareWalletAdapter for Ledger devices
export declare function createLedgerHardwareAdapter(input: LedgerHardwareAdapterInput): HardwareWalletAdapter;
```

### Usage

```ts
import { createLedgerHardwareAdapter } from '@cfxdevkit/wallet/hardware/ledger';

const adapter = await createLedgerHardwareAdapter({ path: "m/44'/60'/0'/0/0" });
```

---

## `./hardware/satochip`

```ts
// Configuration for Satochip bridge communication
export interface SatochipBridgeConfig {
  // Bridge URL, timeout, etc.
}

// Input interface for creating a signer from Satochip hardware wallet
export interface SignerFromSatochipInput extends SatochipBridgeConfig {
  // Optional path override
}

// Creates a signer backed by Satochip hardware wallet
export declare function signerFromSatochip(input?: SignerFromSatochipInput): Promise<Signer>;
```

### Usage

```ts
import { signerFromSatochip } from '@cfxdevkit/wallet/hardware/satochip';

const signer = await signerFromSatochip({ bridgeUrl: 'http://localhost:8080' });
```

---

## `./init`

```ts
// Returns the default file path for local keystore storage
export declare function defaultKeystorePath(): string;

// Initializes a new local wallet with a new keystore and passphrase
export declare function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult>;

// Opens an existing local wallet using its keystore and passphrase
export declare function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult>;

// Rotates the passphrase protecting a local wallet keystore
export declare function rotateLocalPassphrase(input: {
  keystorePath: string;
  oldPassphrase: string;
  newPassphrase: string;
}): Promise<void>;

// Input interface for initializing a new local wallet
export interface InitLocalWalletInput {
  passphrase: string;
  keystorePath?: string;
}

// Result interface returned after initializing a local wallet
export interface InitLocalWalletResult {
  keystorePath: string;
  address: Address;
}

// Input interface for opening an existing local wallet
export interface OpenLocalWalletInput {
  passphrase: string;
  keystorePath?: string;
}

// Result interface returned after opening a local wallet
export interface OpenLocalWalletResult {
  keystorePath: string;
  address: Address;
}
```

### Usage

```ts
import { initLocalWallet, openLocalWallet, rotateLocalPassphrase } from '@cfxdevkit/wallet/init';

const result = await initLocalWallet({ passphrase: 'new-pass' });
await rotateLocalPassphrase({
  keystorePath: result.keystorePath,
  oldPassphrase: 'new-pass',
  newPassphrase: 'updated-pass'
});
```

---

## `./policies`

```ts
// Wraps a signer to enforce a capability-based restriction on its signing authority
export declare function withCapability(inner: Signer, capability?: Capability): Signer;

// Validates whether a transaction complies with a given capability policy
export declare function checkCapability(capability: Capability, tx: SignableTx): SessionKeyError | null;

// Checks if a capability is empty (i.e., grants no restrictions)
export declare function isEmptyCapability(c: Capability): boolean;
```

### Usage

```ts
import { withCapability, checkCapability, isEmptyCapability } from '@cfxdevkit/wallet/policies';

const restrictedSigner = withCapability(signer, { allowedTo: ['transfer'], maxAmount: '1000' });
const error = checkCapability(restrictedSigner.capability, tx);
```

---

## `./session-key`

```ts
// Input interface for creating a session key
export interface CreateSessionKeyInput {
  parentSigner: Signer;
  sessionAddress: Address;
  capability: Capability;
  expiration?: number;
}

// Represents a session key with its attestation and metadata
export interface SessionKey {
  address: Address;
  capability: Capability;
  attestation: SessionAttestation;
  expiration: number;
}

// Attestation object proving a session key’s authority
export interface SessionAttestation {
  parentAddress: Address;
  message: string;
  signature: string;
}

// Creates a session key with specified capabilities and expiration
export declare function createSessionKey(input: CreateSessionKeyInput): Promise<SessionKey>;

// Generates the canonical message used to attest a session key
export declare function canonicalAttestationMessage(sessionAddress: Address, parent: Address, c: Capability): string;
```

### Usage

```ts
import { createSessionKey, canonicalAttestationMessage } from '@cfxdevkit/wallet/session-key';

const sessionKey = await createSessionKey({
  parentSigner,
  sessionAddress: 'cfx:...',
  capability: { allowedTo: ['transfer'], maxAmount: '100' },
  expiration: Date.now() + 86400000
});

const attestationMsg = canonicalAttestationMessage(sessionKey.address, parentAddress, sessionKey.capability);
```

<!-- api-hash: 9df615f52853add8ca194d8633e451ed6c0928203d259b786cefb4a656f572fe -->
