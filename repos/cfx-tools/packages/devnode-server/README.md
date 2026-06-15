# `@cfxdevkit/devnode-server`

> Shared Hono control plane for the local Conflux dev node.

## Install

```bash
pnpm add @cfxdevkit/devnode-server
```

## Sub-paths

| Import | Contents |
|--------|---------|
| `@cfxdevkit/devnode-server` | Core server types, controller, registry, and network state management |
| `@cfxdevkit/devnode-server/cli` | CLI entrypoint and argument parsing utilities |

## Usage

### Server

```typescript
import { createDevnodeServerApp } from '@cfxdevkit/devnode-server';

const app = createDevnodeServerApp();

// Start the server (e.g., with Hono's fetch or a custom adapter)
const port = 52000;
const server = Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Devnode server running at http://127.0.0.1:${port}`);
```

The server exposes HTTP endpoints to manage the local Conflux dev node, including:
- Starting, restarting, and wiping the node
- Toggling mining
- Registering and querying deployed contracts
- Accessing network state (e.g., chain IDs, capabilities)

It uses a shared `DevnodeServerController` to orchestrate node lifecycle operations and a `ContractRegistry` to track deployed contracts across networks.

### CLI

```bash
npx @cfxdevkit/devnode-server start
npx @cfxdevkit/devnode-server restart
npx @cfxdevkit/devnode-server wipe
npx @cfxdevkit/devnode-server mine
```

CLI commands accept optional arguments (e.g., `--port`, `--host`, `--base-url`). Run `npx @cfxdevkit/devnode-server --help` for full usage.

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: a451dab22a27d5b8386b003d75f4abc46ea245d3adc167b0d72662f7009e03d2 -->
