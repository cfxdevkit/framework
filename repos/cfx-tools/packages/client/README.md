# `@cfxdevkit/client`

> Typed HTTP client for the Conflux Devkit devnode-server control plane.

## Install

```bash
pnpm add @cfxdevkit/client
```

## Usage

```typescript
import { ConfluxDevkitClient } from '@cfxdevkit/client';

const client = ConfluxDevkitClient.createConfluxDevkitClient({
  baseUrl: 'http://localhost:12345',
});

// Start a node with a specific profile
await client.createNodeNamespace().start({ profile: 'devnet' });

// Restart the node
await client.createNodeNamespace().restart();

// Wipe node state and restart
await client.createNodeNamespace().wipe({ profile: 'devnet' });

// Start/stop mining
await client.createMiningNamespace().mine({ start: true });

// Deploy a contract from a compiled artifact
const artifact = { /* compiled artifact */ };
const receipt = await client.createDeployNamespace().deployContract({
  artifact,
  constructorArgs: [],
  sender: '0x...',
});

console.log('Deployed at:', receipt.contractAddress);

// Compile Solidity source
const result = await client.createCompilerNamespace().compile({
  sources: { 'Greeter.sol': 'pragma solidity ^0.8.0; contract Greeter {}' },
  outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
});

// Manage accounts and wallets
const accounts = await client.createAccountsNamespace().list();
const wallet = await client.createKeystoreNamespace().createWallet({ password: 'secret' });

// Bootstrap a node from a template
const templates = await client.createBootstrapNamespace().listTemplates();
const deployResult = await client.createBootstrapNamespace().deployTemplate({
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

<!-- readme-hash: a30d16a01b1a086de7ac44dc1a5274cde7e81315ff5e73f364443734fde1e138 -->
