# `@cfxdevkit/client`

> Typed HTTP client for the Conflux Devkit devnode-server control plane.

## Install

```bash
pnpm add @cfxdevkit/client
```

## Usage

```typescript
import { createConfluxDevkitClient } from '@cfxdevkit/client';

const client = createConfluxDevkitClient({
  baseUrl: 'http://localhost:12345',
});

// Start a node with a specific profile
await client.node.start({ profile: 'devnet' });

// Restart the node
await client.node.restart();

// Wipe node state and restart
await client.node.wipe({ profile: 'devnet' });

// Start/stop mining
await client.node.mine({ start: true });

// Deploy a contract from a compiled artifact
const artifact = { /* compiled artifact */ };
const receipt = await client.deploy.deployContract({
  artifact,
  constructorArgs: [],
  sender: '0x...',
});

console.log('Deployed at:', receipt.contractAddress);

// Compile Solidity source
const result = await client.compiler.compile({
  sources: { 'Greeter.sol': 'pragma solidity ^0.8.0; contract Greeter {}' },
  outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
});

// Manage accounts and wallets
const accounts = await client.accounts.list();
const wallet = await client.keystore.createWallet({ password: 'secret' });

// Bootstrap a node from a template
const templates = await client.bootstrap.listTemplates();
const deployResult = await client.bootstrap.deployTemplate({
  templateName: 'devnet',
  config: { /* template-specific config */ },
});
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 76 symbols |

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: dc9a2ff0ae4e53c98f549a814711b6e042ee639af3c645cfbde53ec6d20bf45f -->
