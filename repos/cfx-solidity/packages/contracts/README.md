# @cfxdevkit/contracts

Standard contract bindings (ERC-20 / 721 / 1155 / Multicall3) and a thin,
framework-native `read` / `write` / `deploy` surface for `@cfxdevkit/core`.

```ts
import { erc20 } from '@cfxdevkit/contracts/erc20';
import { createClient, http } from '@cfxdevkit/core';
import { espaceTestnet } from '@cfxdevkit/core';

const client = createClient({ chain: espaceTestnet, transport: http() });
const symbol = await erc20.symbol({ client, address: '0xToken…' });
```

See [API.md](./API.md) for the full surface and [STRUCTURE.md](./STRUCTURE.md)
for the layout.

eSpace-only in this revision; Core Space support lands next.
