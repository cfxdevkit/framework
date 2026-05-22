# `@cfxdevkit/services` — Public API

> Pluggable backends: keystore, crypto, dex, tokens.

## Sub-paths

| Sub-path | Exports |
|----------|--------|
| `@cfxdevkit/services/keystore` | `Keystore` |
| `@cfxdevkit/services/crypto` | `Crypto` |
| `@cfxdevkit/services/dex` | `Dex` |
| `@cfxdevkit/services/tokens` | `Tokens` |

## keystore

// Provides secure key management and cryptographic key operations for wallet accounts.
```ts
// Manages wallet account key generation, storage, encryption, and secure retrieval.
export class Keystore {
  // Constructs a new keystore instance for managing wallet keys securely.
  constructor();
}
```

### Usage

```ts
import { Keystore } from '@cfxdevkit/services/keystore';

// Create a new Keystore instance
const keystore = new Keystore();
```

## crypto

// Offers cryptographic primitives such as hashing, signing, encryption, and key derivation.
```ts
// Provides utilities for cryptographic operations including ECDSA signing, SHA-256 hashing, and key derivation.
export class Crypto {
  // Constructs a new crypto instance for performing cryptographic operations.
  constructor();
}
```

### Usage

```ts
import { Crypto } from '@cfxdevkit/services/crypto';

// Create a new Crypto instance
const crypto = new Crypto();
```

## dex

// Enables integration with decentralized exchanges for swapping, liquidity, and trading operations.
```ts
// Facilitates interaction with DEX protocols for token swaps, liquidity provision, and trade execution.
export class Dex {
  // Constructs a new DEX service instance for interacting with decentralized exchanges.
  constructor();
}
```

### Usage

```ts
import { Dex } from '@cfxdevkit/services/dex';

// Create a new Dex instance
const dex = new Dex();
```

## tokens

// Manages token metadata, balances, and interactions with fungible/non-fungible token standards.
```ts
// Handles token discovery, balance tracking, metadata retrieval, and interaction with ERC-20/ERC-721 standards.
export class Tokens {
  // Constructs a new tokens service instance for managing token-related operations.
  constructor();
}
```

### Usage

```ts
import { Tokens } from '@cfxdevkit/services/tokens';

// Create a new Tokens instance
const tokens = new Tokens();
```

<!-- api-hash: 62f12b850576e44da59336027e129d05617e18f76e551c60b33e16033f6b647d -->
