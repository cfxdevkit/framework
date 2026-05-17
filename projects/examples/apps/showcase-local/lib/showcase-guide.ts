export type LocalChapterSlug = 'devnode' | 'keystore' | 'session-key' | 'compiler' | 'deploy';

export type LocalChapterStatus = 'ready' | 'guide';

export interface LocalChapter {
  slug: LocalChapterSlug;
  title: string;
  description: string;
  status: LocalChapterStatus;
  next: string;
}

export interface LocalFlowStep {
  slug: LocalChapterSlug;
  title: string;
  detail: string;
}

export const LOCAL_SHOWCASE_TITLE = 'Conflux Backend Showcase';

export const DEFAULT_SHOWCASE_LOCAL_MNEMONIC =
  'test test test test test test test test test test test junk';

export const DEVNODE_SEED_WALLET_NAME = 'Devnode Seed';

export const LOCAL_CHAPTERS: readonly LocalChapter[] = [
  {
    slug: 'devnode',
    title: 'DevNode',
    description:
      'Start or restart the local chain only when Local is selected and a stored node profile is ready.',
    status: 'ready',
    next: 'Use the selected node profile so the local genesis accounts stay aligned with the keystore.',
  },
  {
    slug: 'keystore',
    title: 'Keystore',
    description:
      'Initialize the encrypted backend keystore and generate or import stored mnemonics.',
    status: 'ready',
    next: 'Activate the signer you want the session-key and deploy flows to reuse.',
  },
  {
    slug: 'session-key',
    title: 'Session Key',
    description: 'Issue a capability-bound signer from the active backend wallet.',
    status: 'ready',
    next: 'Scope the delegated signer to the currently selected network and space.',
  },
  {
    slug: 'compiler',
    title: 'Compiler',
    description: 'Compile Solidity source into ABI and bytecode using the backend compiler route.',
    status: 'ready',
    next: 'Carry the compiled artifact straight into deploy without leaving the page.',
  },
  {
    slug: 'deploy',
    title: 'Deploy',
    description: 'Deploy with the active backend signer against local, testnet, or mainnet.',
    status: 'ready',
    next: 'Keep faucet/help links visible when the selected public network needs gas.',
  },
] as const;

export const LOCAL_FLOW: readonly LocalFlowStep[] = [
  {
    slug: 'keystore',
    title: 'Choose network, space, and passphrase',
    detail:
      'Set the environment up first so the keystore, local node, and later actions all share one deliberate signer story.',
  },
  {
    slug: 'keystore',
    title: 'Initialize and unlock the backend keystore',
    detail:
      'Generate or import mnemonic roots before you attempt session-key issuance or deployment.',
  },
  {
    slug: 'devnode',
    title: 'Select the local node profile and start the node only when Local is selected',
    detail:
      'The local devnode reads the selected stored profile on start/restart, so profile selection comes before lifecycle actions.',
  },
  {
    slug: 'session-key',
    title: 'Delegate a constrained signer',
    detail:
      'Create a session key only after the parent backend signer is ready for the selected environment.',
  },
  {
    slug: 'compiler',
    title: 'Compile a contract artifact',
    detail: 'Turn Solidity input into ABI and bytecode that the deploy section can reuse directly.',
  },
  {
    slug: 'deploy',
    title: 'Deploy and inspect the result',
    detail:
      'Use the selected network plus the unlocked backend signer to deploy and then inspect the receipt.',
  },
] as const;

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
