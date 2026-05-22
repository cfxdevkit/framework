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

### Usage

```ts
import { createClient, espaceMainnet, http } from '@cfxdevkit/cdk';

const client = createClient({
  chain: espaceMainnet,
  transport: http(),
});
```

```ts
// Converts a hex address to a base32 address
export declare function hexToBase32(hexAddress: Hex, networkId: number, opts?: {
  // Whether to include the network prefix (e.g., "cfx") in the output
}): string;

// Converts a base32 address to a hex address
export declare function base32ToHex(base32Address: string, opts?: {
  // Whether to include the "0x" prefix in the output
}): Hex;

// Checks if a string is a valid base32 address
export declare function isBase32Address(address: string): boolean;

// Returns the core address for a given address
export declare function getCoreAddress(address: string): string;

// Retrieves the configuration for a specific chain
export declare function getChain(idOrName: ChainId | string): ChainConfig;

// Returns a list of available chains
export declare function listChains(filter?: {
  // Optional filter to restrict chains by family or network
}): ChainConfig[];

// Defines a custom chain configuration
export declare function defineChain(input: ChainConfig): ChainConfig;
```

---

## `./address`

### Usage

```ts
import { hexToBase32 } from '@cfxdevkit/cdk/address';

const base32 = hexToBase32('0x...', 1);
```

```ts
// Converts a hex address to a base32 address
export declare function hexToBase32(hexAddress: Hex, networkId: number, opts?: {
  // Whether to include the network prefix (e.g., "cfx") in the output
}): string;

// Converts a base32 address to a hex address
export declare function base32ToHex(base32Address: string, opts?: {
  // Whether to include the "0x" prefix in the output
}): Hex;

// Checks if a string is a valid base32 address
export declare function isBase32Address(address: string): boolean;

// Returns the core address for a given address
export declare function getCoreAddress(address: string): string;
```

---

## `./chains`

### Usage

```ts
import { espaceMainnet } from '@cfxdevkit/cdk/chains';

console.log(espaceMainnet.id);
```

```ts
// Represents the family of the chain
export type ChainFamily = 'core' | 'espace';

// Represents the network environment
export type Network = 'mainnet' | 'testnet' | 'devnet' | 'local';

// Configuration for a blockchain chain
export interface ChainConfig {
  // Chain identifier, name, RPC endpoints, and other metadata
}

// Espace mainnet configuration
export declare const espaceMainnet: ChainConfig;

// Espace testnet configuration
export declare const espaceTestnet: ChainConfig;

// Espace local configuration
export declare const espaceLocal: ChainConfig;

// Core-Espace mainnet configuration
export declare const coreSpaceMainnet: ChainConfig;

// Core-Espace testnet configuration
export declare const coreSpaceTestnet: ChainConfig;

// Core-Espace local configuration
export declare const coreSpaceLocal: ChainConfig;

// Retrieves the configuration for a specific chain
export declare function getChain(idOrName: ChainId | string): ChainConfig;

// Returns a list of available chains
export declare function listChains(filter?: {
  // Optional filter to restrict chains by family or network
}): ChainConfig[];

// Defines a custom chain configuration
export declare function defineChain(input: ChainConfig): ChainConfig;
```

---

## `./client`

### Usage

```ts
import { createClient, http } from '@cfxdevkit/cdk/client';
import { espaceMainnet } from '@cfxdevkit/cdk/chains';

const client = createClient({
  chain: espaceMainnet,
  transport: http(),
});
```

```ts
// Exported transport options
export { HttpTransportOptions }

// Exported transport type
export { Transport }

// Exported websocket options
export { WsTransportOptions }

// Exported fallback transport
export { fallback }

// Exported http transport
export { http }

// Exported ws transport
export { ws }

// Parameters for an RPC request
export interface RpcRequest {
  // Method name and parameters for an RPC call
}

// Options for RPC calls
export interface CallOptions {
  // Common options for RPC method calls (e.g., timeout, headers)
}

// Options for fetching balance
export interface GetBalanceOptions extends CallOptions {
  // Additional options specific to balance queries (e.g., block number)
}

// Options for Core RPC calls
export interface CoreCallOptions extends CallOptions {
  // Core-specific RPC call options (e.g., epoch parameter)
}

// Client for Espace network
export interface EspaceClient extends ClientBase {
  // Espace-specific RPC methods and utilities
}

// Client for Core-Espace network
export interface CoreSpaceClient extends ClientBase {
  // Core-specific RPC methods and utilities
}

// Input for creating a client
export interface CreateClientInput {
  // Chain and transport configuration for client initialization
}

// Initialization parameters for CfxError
export interface CfxErrorInit {
  // Error code, message, and optional context for SDK errors
}

// Status information of a node
export interface NodeStatus {
  // Node synchronization, consensus, and version info
}

// Filter for Core logs
export interface CoreLogFilter {
  // Criteria for filtering Core network logs (e.g., address, topics)
}

// A log entry from the Core network
export interface CoreLog {
  // Log data including address, topics, data, and block info
}

// Information about transaction sponsorship
export interface SponsorInfo {
  // Sponsor address, gas limit, and collateral details for sponsored transactions
}

// Represents a blockchain account
export interface Account {
  // Address and optional private key or signer reference
}

// A transaction that can be signed
export interface SignableTx {
  // Transaction fields required for signing (e.g., nonce, gas, value)
}

// Options for signing a transaction
export interface SignOptions {
  // Options like chain ID override or nonce hint during signing
}

// An object capable of signing transactions
export interface Signer {
  // Interface for signing transactions and messages
}

// Espace mainnet configuration
export declare const espaceMainnet: ChainConfig;

// Espace testnet configuration
export declare const espaceTestnet: ChainConfig;

// Espace local configuration
export declare const espaceLocal: ChainConfig;

// Core-Espace mainnet configuration
export declare const coreSpaceMainnet: ChainConfig;

// Core-Espace testnet configuration
export declare const coreSpaceTestnet: ChainConfig;

// Core-Espace local configuration
export declare const coreSpaceLocal: ChainConfig;

// Maximum value of a uint256
export declare const MAX_UINT256: bigint;

// Maximum value of a uint128
export declare const MAX_UINT128: bigint;

// The zero address
export declare const ZERO_ADDRESS: Address;
```

---

## `./errors`

### Usage

```ts
import { CfxError, RpcError, ContractError } from '@cfxdevkit/cdk/errors';

try {
  // ...
} catch (err) {
  if (err instanceof RpcError) {
    console.error('RPC error:', err.message);
  }
}
```

```ts
// Base error class for the SDK
export declare class CfxError extends Error {
  // Base error with standardized code and context
}

// Error class for RPC failures
export declare class RpcError extends CfxError {
  // Wraps RPC response errors with status and data
}

// Error class for contract execution failures
export declare class ContractError extends CfxError {
  // Thrown on revert, out-of-gas, or other contract execution issues
}

// Error class for wallet operations
export declare class WalletError extends CfxError {
  // Thrown during account creation, signing, or key management
}

// Error class for keystore operations
export declare class KeystoreError extends CfxError {
  // Thrown on keystore encryption/decryption or file I/O failures
}
```

---

## `./types`

### Usage

```ts
import { Hex, Address, ChainId } from '@cfxdevkit/cdk/types';

const hex: Hex = '0x1234';
const address: Address = '0x...';
const chainId: ChainId = 1;
```

```ts
// Hex-encoded string (must start with '0x')
export type Hex = string;

// Conflux address (hex or base32 format)
export type Address = string;

// Chain identifier number
export type ChainId = number;

// Block number specifier (e.g., 'latest_mined', 'earliest', or hex)
export type BlockNumber = 'latest_state' | 'latest_mined' | 'earliest' | Hex;

// Hex-encoded transaction hash
export type TransactionHash = Hex;

// Hex-encoded block hash
export type BlockHash = Hex;

// Index of a log in its transaction
export type LogIndex = number;

// Index of a transaction in its block
export type TransactionIndex = number;

// Hex-encoded transaction nonce
export type Nonce = Hex;

// Hex-encoded gas limit or used gas
export type Gas = Hex;

// Hex-encoded gas price
export type GasPrice = Hex;

// Hex-encoded value (in drips)
export type Value = Hex;

// Hex-encoded arbitrary data (e.g., calldata)
export type Data = Hex;

// Topics filter for logs (single topic, array, or null for any)
export type FilterTopics = Hex | Hex[] | null;

// Input for a call (read-only) request
export type CallRequest = {
  // From/to address, gas, value, data, etc.
};

// Input for a transaction request (write)
export type TransactionRequest = {
  // Full transaction fields including nonce, gas, value, data, etc.
};
```

---

## `./units`

### Usage

```ts
import { formatUnits, parseUnits } from '@cfxdevkit/cdk/units';

const formatted = formatUnits('1000000000000000000', 18); // '1'
const parsed = parseUnits('1', 18); // '1000000000000000000'
```

```ts
// Exported format units
export { formatUnits }

// Exported parse units
export { parseUnits }

// Exported core network ID type
export { CoreNetworkId }

// Unit name for Conflux native token (CFX)
export type Unit = 'cfx' | 'drip';

// Unit name for various denominations (including wei)
export type UnitName = 'cfx' | 'drip' | 'nfi' | 'fi' | 'wei';

// Input value for unit conversion (string, number, or bigint)
export type UnitValue = string | number | bigint;

// Options for formatting units
export interface FormatUnitsOptions {
  // Rounding mode and decimal precision settings
}

// Options for parsing units
export interface ParseUnitsOptions {
  // Decimal places and validation behavior
}
```

---

## `./wallet`

### Usage

```ts
import { deriveAccount, generateMnemonic } from '@cfxdevkit/cdk/wallet';

const mnemonic = generateMnemonic();
const account = deriveAccount(mnemonic, { path: "m/44'/503'/0'/0/0" });
```

```ts
// Exported derivation input
export { DeriveAccountInput }

// Exported derivation input for multiple accounts
export { DeriveAccountsInput }

// Exported derivation input for dual accounts
export { DeriveDualAccountInput }

// Exported derived account type
export { DerivedAccount }

// Exported dual address account type
export { DualAddressAccount }

// Exported function to get core address
export { coreAddressFromPrivateKey }

// Exported default core path
export { DEFAULT_CORE_PATH }

// Exported default espace path
export { DEFAULT_ESPACE_PATH }

// Exported function to derive account
export { deriveAccount }

// Exported function to derive accounts
export { deriveAccounts }

// Exported function to derive dual account
export { deriveDualAccount }

// Exported function to derive dual accounts
export { deriveDualAccounts }

// Exported function to generate mnemonic
export { generateMnemonic }

// Exported function to validate mnemonic
export { validateMnemonic }
```

<!-- api-hash: 4b40ece81b80d5e3142124247a9af8c5d5519b751f648502ddc35389ba38b618 -->
