export const DEFAULT_SHOWCASE_LOCAL_MNEMONIC =
  'test test test test test test test test test test test junk';

export const DEVNODE_API_SNIPPET = `await fetch('/api/devnode/profile/<walletId>/select', {
  method: 'PUT',
});

const start = await fetch('/api/devnode/start', {
  method: 'POST',
});

const restart = await fetch('/api/devnode/restart', {
  method: 'POST',
});

const mine = await fetch('/api/devnode/mine', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ count: 1 }),
});`;

export const KEYSTORE_API_SNIPPET = `await fetch('/api/keystore/setup', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ passphrase: 'local-demo-passphrase' }),
});

await fetch('/api/keystore/accounts', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    name: 'Workspace Mnemonic',
    mnemonic: '${DEFAULT_SHOWCASE_LOCAL_MNEMONIC}',
  }),
});`;

export const SESSION_KEY_SNIPPET = `import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import { createSessionKey } from '@cfxdevkit/wallet/session-key';

const parent = signerFromPrivateKey(process.env.LOCAL_PRIVATE_KEY!);
const session = await createSessionKey({
  parent,
  capability: {
    chains: [2030],
    contracts: ['0xYourContract'],
    selectors: ['0xa9059cbb'],
    maxValuePerTx: 0n,
    notAfter: Date.now() + 15 * 60_000,
  },
});

await session.signer.signMessage('local showcase session');`;

export const COMPILER_SNIPPET = `import { compile } from '@cfxdevkit/compiler';

const result = await compile({
  solcVersion: '0.8.26',
  sources: [
    {
      path: 'Counter.sol',
      content: 'pragma solidity ^0.8.26; contract Counter { uint256 public value; }',
    },
  ],
});

const artifact = result.artifacts[0];
console.log(artifact?.abi, artifact?.bytecode);`;

export const DEPLOY_SNIPPET = `import { espaceLocal } from '@cfxdevkit/core/chains';
import { createClient, http } from '@cfxdevkit/core/client';
import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import { deployContract } from '@cfxdevkit/contracts/deploy';

const client = createClient({
  chain: espaceLocal,
  transport: http('http://127.0.0.1:8545'),
});

const signer = signerFromPrivateKey(process.env.LOCAL_PRIVATE_KEY!);
const result = await deployContract({
  client,
  signer,
  abi,
  bytecode,
  waitForReceipt: true,
});

console.log(result.address, result.hash);`;

export const CUSTOM_OPERATION_SNIPPET = `const response = await fetch(
  '/api/custom/block-number?network=local&space=espace',
  {
    method: 'GET',
    cache: 'no-store',
  },
);

const payload = await response.json();
console.log(payload.head, payload.chainId, payload.rpcUrl);`;
