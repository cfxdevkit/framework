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
  Creates a Hono app instance with keystore routes mounted.

- `createKeystoreRoutes(keystore: KeystoreService, options?: { basePath?: string }): Hono`  
  Creates a Hono router with keystore routes, without app wrapper.

- `RevealKind` (`'mnemonic' | 'private-key'`)  
  Specifies the secret type to reveal.

- `KeystoreLifecyclePhase` (`'blank' | 'locked' | 'unlocked' | 'active-wallet'`)  
  Represents the current state of the keystore lifecycle.

- `KeystoreService`  
  Core service interface for keystore operations (imported from `@cfxdevkit/keystore`).

<!-- readme-hash: b5b4c421f6db64bc006934dd1e857bba55ed0d7178954db721797c5bb304d546 -->
