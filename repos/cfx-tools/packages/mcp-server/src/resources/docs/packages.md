# cfxdevkit Packages

## @cfxdevkit/cdk

RPC client, account management, and chain utilities.

```ts
import { createClient, espaceLocal, coreSpaceLocal, formatCFX, parseCFX } from '@cfxdevkit/cdk';
import { signerFromPrivateKey, generateMnemonic, deriveDualAccounts } from '@cfxdevkit/cdk';

const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
const balance = await client.getBalance(address);           // returns bigint (wei)
const blockNum = await client.getBlockNumber();
const hash = await client.sendRawTransaction(signedTx);    // Hex → Hash
```

**Key types:** `EspaceClient`, `CoreSpaceClient`, `DualAddressAccount` (`evmAddress`, `coreAddress`, `privateKey`)

## @cfxdevkit/client + @cfxdevkit/devnode-server

Shared control-plane client and backend runtime.

```ts
import { createConfluxDevkitClient } from '@cfxdevkit/client';

const client = createConfluxDevkitClient({ baseUrl: 'http://localhost:3001' });
await client.node.start();
const { accounts } = await client.accounts.list();
await client.node.mine({ blocks: 5 });
await client.node.stop();
```

Tooling may embed `createDevnodeServerApp()` from `@cfxdevkit/devnode-server` for local operation, but runtime actions should go through the client surface.

## @cfxdevkit/compiler

Solidity compilation with bundled `solc`.

```ts
import { compile, listTemplates, getTemplate } from '@cfxdevkit/compiler';
const { artifacts, warnings } = await compile({
  sources: [{ path: 'Counter.sol', content: '...' }],
  solcVersion: '0.8.28',
});
// artifacts[0].abi, .bytecode (Hex), .contractName
```

Templates: `counter`, `erc20`, `erc721`, `multisig`

## @cfxdevkit/wallet

Key management, BIP-39 mnemonic, and signing.

```ts
import { signerFromPrivateKey, generateMnemonic, validateMnemonic, deriveDualAccounts } from '@cfxdevkit/cdk';
const mnemonic = generateMnemonic(256);
const accounts = deriveDualAccounts({ mnemonic, count: 10, startIndex: 0 });
const signer = signerFromPrivateKey(privateKey);
const signedTx = await signer.signTransaction(txRequest);
```

## @cfxdevkit/services

Higher-level services built on core. Includes keystore provider.

```ts
import { createFileKeystore, initFileKeystore, readFileKeystoreMnemonic } from '@cfxdevkit/services';
// SecretRef = { service: string; account: string }
const provider = await createFileKeystore({ path, passphrase });
const signer = await provider.getSigner({ service: 'main', account: 'deployer' });
```

## @cfxdevkit/contracts

Standard contract ABIs and helpers (ERC-20, ERC-721, etc.).

```ts
import { erc20Abi, erc721Abi } from '@cfxdevkit/contracts';
```

## @cfxdevkit/create

Project scaffolding — same templates as `npm create cfxdevkit`.

```ts
import { listTemplates, scaffoldProject, getTemplateFiles } from '@cfxdevkit/create';
await scaffoldProject('/path/to/output', 'minimal-dapp', { name: 'my-app', skipInstall: true });
```

## @cfxdevkit/defi-react

React component library for DeFi UIs. Requires `@cfxdevkit/theme/css`.

```tsx
import { AppNavBar, NavBrand, NavWalletActions, Button, Card } from '@cfxdevkit/defi-react/primitives';
import { TokenPicker } from '@cfxdevkit/defi-react/token-picker';
import { TxStatus } from '@cfxdevkit/defi-react/tx-status';
```
