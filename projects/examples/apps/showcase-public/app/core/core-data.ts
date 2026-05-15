import { formatCFX, formatGDrip, listChains, parseCFX } from '@cfxdevkit/core';

export const CHAINS = listChains();

export const UNIT_EXAMPLES = [
  { label: 'formatCFX(1_000_000_000_000_000_000n)', value: formatCFX(1_000_000_000_000_000_000n) },
  { label: 'formatGDrip(1_000_000_000n)', value: formatGDrip(1_000_000_000n) },
  { label: 'parseCFX("1.5") → drip', value: String(parseCFX('1.5')) },
];

export const CLIENT_SNIPPET = `// @cfxdevkit/core — low-level RPC clients for eSpace and Core Space
import { createClient, http, espaceTestnet, coreSpaceTestnet } from '@cfxdevkit/core';

// eSpace client (EVM-compatible, uses viem under the hood)
const espaceClient = createClient({
  chain: espaceTestnet,   // chain ID 71
  transport: http(),       // uses chain.rpc.http[0] by default
});

// Core Space client (Conflux-native JSON-RPC)
const coreClient = createClient({
  chain: coreSpaceTestnet, // chain ID 1
  transport: http(),
});

// Read-only calls — no wallet needed
const blockNumber = await espaceClient.getBlockNumber();
const balance = await espaceClient.getBalance('0xYourAddress');
const coreBalance = await coreClient.getBalance('cfxtest:aaYourAddress');

// Within React, consume via CfxProvider + useClient()
import { CfxProvider, useClient, useNativeBalance } from '@cfxdevkit/react';

<CfxProvider client={espaceClient}>
  {/* all children can now call useClient() */}
</CfxProvider>

// In a child component:
const client = useClient();
const { data: balance } = useNativeBalance({ address });`;

export const CODEC_SNIPPET = `import { hexToBase32, base32ToHex, isBase32Address } from '@cfxdevkit/core';

hexToBase32('0xABC…', 1)   // → 'cfxtest:aac…'  (networkId=1 for testnet)
hexToBase32('0xABC…', 1029) // → 'cfx:aac…'      (networkId=1029 for mainnet)
base32ToHex('cfxtest:aac…') // → '0xabc…'
isBase32Address('cfx:aac…') // → true`;

export const UNITS_SNIPPET = `import { formatCFX, formatGDrip, parseCFX } from '@cfxdevkit/core';

formatCFX(1_000_000_000_000_000_000n)  // → '1 CFX'
formatGDrip(1_000_000_000n)            // → '1 GDrip'
parseCFX('1.5')                        // → 1500000000000000000n  (drip)`;
