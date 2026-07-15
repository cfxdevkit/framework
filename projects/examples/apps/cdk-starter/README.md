# @cfxdevkit/example-cdk-starter

A living example application that demonstrates the full **Conflux DevKit (CDK)** API surface.

This package is **private** and bundled with source code — it serves as an interactive walkthrough of how to use the CDK client, wallet, chains, addresses, units, and error systems. It's designed to be a reference you can run, read, and adapt.

---

## What's Inside

The package re-exports the entire CDK public API for convenience, but the real value is the executable demo code:

| Module | Purpose |
|--------|---------|
| `src/demo.ts` | Executable entry point — runs all 6 sections |
| `src/index.ts` | Re-exports the full CDK API surface (sub-paths recommended for tree-shaking) |
| `src/demos/chains.ts` | Chain catalog, network lookup, error handling |
| `src/demos/units.ts` | CFX/drip/Gdrip formatting and parsing, token helpers |
| `src/demos/address.ts` | Hex ↔ base32 address codec, validation, normalization |
| `src/demos/errors.ts` | Typed error hierarchy, cause chaining, JSON serialization |
| `src/demos/client-live.ts` | Live RPC demo (eSpace + Core Space testnet) |
| `src/demos/wallet.ts` | Mnemonic generation, HD derivation, dual-space signing |

### Test Suites

15 test files covering every public API:

| Test File | Coverage |
|-----------|----------|
| `test/chains.test.ts` | Chain catalog, lookup by ID/network/family, error on unknown |
| `test/units.test.ts` | formatCFX, parseCFX, formatGDrip, formatToken, stringifyBigInt |
| `test/address.test.ts` | hexToBase32, base32ToHex, isBase32Address, getCoreAddress |
| `test/errors.test.ts` | CfxError hierarchy, isCfxError, toJSON, cause chaining |
| `test/client.test.ts` | createClient, HTTP transport, chain config validation |
| `test/wallet.test.ts` | deriveAccount, deriveDualAccount, signerFromMnemonic |

---

## Quick Start

### Run the Demo

```bash
# From the monorepo root
pnpm --filter @cfxdevkit/example-cdk-starter demo

# Or directly
npx tsx projects/examples/apps/cdk-starter/src/demo.ts
```

The demo walks through 6 sections (1–4 pure, 5 live RPC, 6 local wallet):

1. **Chains** — Static chain configs and catalog lookup
2. **Units** — CFX, drip, and Gdrip formatting/parsing
3. **Address** — Hex ↔ base32 codec (text encoding only)
4. **Errors** — Typed error hierarchy and cause chaining
5. **Client (live)** — eSpace + Core Space testnet RPC calls
6. **Wallet** — Mnemonic generation, HD derivation, dual-space signing

### Run the Tests

```bash
pnpm --filter @cfxdevkit/example-cdk-starter test
```

### Import from Sub-paths

The re-exports in `src/index.ts` are for convenience. For production use, import directly:

```typescript
// Recommended — tree-shakable
import { createClient, http } from '@cfxdevkit/cdk/client';
import { espaceTestnet } from '@cfxdevkit/cdk/chains';
import { formatCFX } from '@cfxdevkit/cdk/units';
import { hexToBase32 } from '@cfxdevkit/cdk/address';

// Conduit imports (available but not tree-shaken)
import { createClient, espaceTestnet, formatCFX } from './src/index';
```

---

## Architecture

### Dual-Space Design

Conflux has two execution environments that share the same native token (CFX):

- **eSpace** — EVM-compatible (Ethereum-style). Addresses: `0x...` (hex)
- **Core Space** — Native Conflux (CIP standard). Addresses: `cfx:...` (base32)

The CDK handles both spaces through a unified API:

| Layer | eSpace | Core Space |
|-------|--------|------------|
| Address | Hex (0x...) | Base32 (cfx:...) |
| Signer | viem (EIP-1559) | cive (CIP-1559) |
| HD Path | m/44'/60'/0'/0/{index} | m/44'/503'/0'/0/{index} |
| RPC | eth_* methods | cfx_* methods |

### Error System

All CDK errors extend `CfxError` with typed subclasses:

```typescript
import { CfxError, RpcError, isCfxError } from '@cfxdevkit/cdk/errors';

const err = new RpcError({ code: 'rpc/timeout', message: 'timed out' });
console.log(isCfxError(err)); // true
console.log(err.toJSON());   // { name: 'RpcError', code: 'rpc/timeout', ... }
```

Errors support cause chaining via the standard `cause` property:

```typescript
const root = new Error('ECONNREFUSED');
const wrapped = new RpcError({ code: 'rpc/network', message: 'failed', cause: root });
```

---

## Security Notes

- **Private keys never leave the Signer/account object.** The demo prints addresses and signatures but never logs private keys.
- **Mnemonics are generated in-memory only.** They are never written to disk or logged.
- **Wallet demos use testnet endpoints.** No real funds are sent or received.
- The cdk-starter package is `private: true` in package.json — it's not published to npm.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@cfxdevkit/cdk` | Core CDK library — client, wallet, chains, address, units, errors |
| `@cfxdevkit/tsconfig` | Shared TypeScript configuration |
| `vitest` | Test runner |
| `tsx` | Demo executor (runs TypeScript directly) |

---

## License

Conflux DevKit project license — same as the monorepo root.
