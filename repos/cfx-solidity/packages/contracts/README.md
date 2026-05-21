# @cfxdevkit/contracts

Standard contract bindings (ERC-20 / 721 / 1155 / Multicall3) and a thin,
framework-native `read` / `write` / `deploy` surface for `@cfxdevkit/cdk`.

```ts
import { erc20 } from '@cfxdevkit/contracts/erc20';
import { createClient, http } from '@cfxdevkit/cdk';
import { espaceTestnet } from '@cfxdevkit/cdk/chains';

const client = createClient({ chain: espaceTestnet, transport: http() });
const symbol = await erc20.symbol({ client, address: '0xToken…' });
```

## Installation

```bash
npm install @cfxdevkit/contracts @cfxdevkit/cdk
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 23 symbols |
| `./abis` | 5 symbols |
| `./read` | 3 symbols |
| `./write` | 6 symbols |
| `./deploy` | 4 symbols |
| `./erc20` | 2 symbols |
| `./bridge` | 10 symbols |
| `./errors` | 2 symbols |

## Usage

### Read calls

Use `readContract` for view/pure functions:

```ts
import { readContract } from '@cfxdevkit/contracts';
import { erc20 } from '@cfxdevkit/contracts/erc20';

const balance = await readContract({
  client,
  abi: erc20.abi,
  address: '0xToken…',
  functionName: 'balanceOf',
  args: ['0xUser…'],
});
```

### Write calls

Use `prepareWrite` to construct a transaction, then `sendWrite` to submit it:

```ts
import { prepareWrite, sendWrite } from '@cfxdevkit/contracts';
import { erc20 } from '@cfxdevkit/contracts/erc20';

const tx = await prepareWrite({
  client,
  abi: erc20.abi,
  address: '0xToken…',
  functionName: 'transfer',
  args: ['0xUser…', 1000n],
});

const receipt = await sendWrite({ client, tx });
```

### Deploy

Deploy contracts using `deployContract`:

```ts
import { deployContract } from '@cfxdevkit/contracts';

const result = await deployContract({
  client,
  abi: myContractAbi,
  bytecode: '0x...',
  args: ['arg1', 42n],
});
```

### ERC-20 helpers

Convenience wrappers for common ERC-20 functions:

```ts
import { erc20 } from '@cfxdevkit/contracts/erc20';

const symbol = await erc20.symbol({ client, address: '0xToken…' });
const decimals = await erc20.decimals({ client, address: '0xToken…' });
```

### Bridge support

Bridge contract bindings and helpers are available under `./bridge`:

```ts
import { bridge } from '@cfxdevkit/contracts/bridge';

// Example: get cross-space transfer status
const status = await bridge.getTransferStatus({ client, id: '0x...' });
```

## Error handling

All errors are typed under `ContractsErrorCode` and extend `ContractsError`:

```ts
import { ContractsError } from '@cfxdevkit/contracts';

try {
  await readContract(...);
} catch (err) {
  if (err instanceof ContractsError) {
    console.error(err.code); // e.g., 'contracts/reverted'
  }
}
```

## eSpace & Core Space

Fully compatible with both eSpace and Core Space chains. Specify your target chain via `client.chain`.

See [API.md](./API.md) for the full surface and [STRUCTURE.md](./STRUCTURE.md)
for the layout.

<!-- readme-hash: f3652e82216cc229c66713999612320065765990214d7b9baa25d420d3f472c8 -->
