# `@cfxdevkit/keystore-server`

> Standalone Hono keystore router extracted from devnode-server.

## Install

```bash
pnpm add @cfxdevkit/keystore-server
```

## Usage

```typescript
import { createKeystoreApp } from '@cfxdevkit/keystore-server';
import { KeystoreService } from '@cfxdevkit/keystore';
import { Hono } from 'hono';

const keystore = new KeystoreService();
const app = createKeystoreApp({
  keystore,
  basePath: '/keystore', // optional: mount path prefix
  logger: console,       // optional: logger instance (supports debug/warn/error)
});

// Mount `app` in your Hono server
const honoApp = new Hono();
honoApp.route('/keystore', app);
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 14 symbols |

### Key exports

- `createKeystoreApp(options: KeystoreServerAppOptions): Hono`  
  Creates a Hono app instance with keystore routes mounted. Accepts `port`, `host`, `keystore`, `routes`, `basePath`, and `logger` options.

- `createKeystoreRoutes(keystore: KeystoreService, options?: { basePath?: string }): Hono`  
  Creates a Hono router with keystore routes, without app wrapper.

- `RevealKind` (`'mnemonic' | 'private-key'`)  
  Specifies the secret type to reveal.

- `KeystoreLifecyclePhase` (`'blank' | 'locked' | 'unlocked' | 'active-wallet'`)  
  Represents the current state of the keystore lifecycle.

- `KeystoreService`  
  Core service interface for keystore operations (imported from `@cfxdevkit/keystore`).

- `WalletSummary`, `ActiveWalletSummary`, `WalletAccountSummary`  
  Interfaces describing wallet and account metadata returned by keystore endpoints.

- `__packageName` (`"@cfxdevkit/keystore-server"`)  
  Runtime identifier for package introspection.

- `KeystoreServerAppOptions`  
  Options object for `createKeystoreApp`, including `port`, `host`, `keystore`, `routes`, `basePath`, and `logger`.

- `KeystoreServerRoutesOptions`  
  Options object for `createKeystoreRoutes`, including optional `basePath`.

- `KeystoreError`  
  Error type used by keystore endpoints.

- `KeystoreResponse`  
  Generic response wrapper type used across keystore endpoints.

- `MnemonicRevealResponse`, `PrivateKeyRevealResponse`  
  Typed responses for secret reveal operations.

- `WalletCreateRequest`, `WalletUnlockRequest`  
  Request payload types for wallet creation and unlocking.

- `AccountDeriveRequest`  
  Request payload type for account derivation.

- `WalletSummaryResponse`, `ActiveWalletSummaryResponse`  
  Response types wrapping wallet summaries in keystore API responses.

<!-- readme-hash: ee1e447f1147ad9f815676ba2966b42a92cca17ce8c44be7639c1bd95f5bf3c3 -->
