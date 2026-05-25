# @cfxdevkit/devnode-core

Lightweight Hono control plane for the Conflux devnode.

Exposes node lifecycle, compilation, mining, accounts, and network routes with no keystore or wallet dependencies.

## When to use this vs `@cfxdevkit/devnode-server`

| Package | Routes | Use when |
|---|---|---|
| `devnode-core` | health, node/*, compiler/*, mining/*, accounts/*, network/* | CI scripts, automated testing, lightweight tooling |
| `devnode-server` | all of core + keystore/*, contracts/*, deploy/*, session-key/*, bootstrap/* | Full developer environment with key management |

## Usage

```ts
import { serve } from '@hono/node-server';
import { createDevnodeCoreApp } from '@cfxdevkit/devnode-core';

const app = createDevnodeCoreApp();
serve({ fetch: app.fetch, port: 52000 }, (info) => {
  console.log(`devnode-core listening at http://127.0.0.1:${info.port}`);
});
```

## Starting via tooling-cli

```bash
# Start devnode-server (full stack, with keystore)
cdk devnode start [--port 52000] [--keystore-path .keystore.json]

# Stop
cdk devnode stop

# Status
cdk devnode status
```

Consumers connect to the running server using `@cfxdevkit/client`:

```ts
import { createConfluxDevkitClient } from '@cfxdevkit/client';
const client = createConfluxDevkitClient({ baseUrl: 'http://127.0.0.1:52000' });
await client.node.start({ config: { mnemonic: '...' } });
```
