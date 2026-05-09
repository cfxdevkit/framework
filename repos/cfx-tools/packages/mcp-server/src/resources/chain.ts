import {
  type CoreSpaceClient,
  coreSpaceLocal,
  createClient,
  type EspaceClient,
  espaceLocal,
  formatCFX,
  http,
} from '@cfxdevkit/core';
import type { DevNode } from '@cfxdevkit/devnode';

export const chainResources = [
  {
    uri: 'cfxdevkit://chain/status',
    name: 'Chain Status',
    description: 'Current status of the local devnode (eSpace and Core Space).',
    mimeType: 'application/json',
  },
  {
    uri: 'cfxdevkit://chain/accounts',
    name: 'Dev Accounts',
    description: 'List of pre-funded devnode accounts with balances.',
    mimeType: 'application/json',
  },
];

function json(obj: unknown) {
  return {
    contents: [{ uri: '', mimeType: 'application/json', text: JSON.stringify(obj, null, 2) }],
  };
}

function jsonError(uri: string, message: string) {
  return {
    contents: [
      { uri, mimeType: 'application/json', text: JSON.stringify({ error: message }, null, 2) },
    ],
  };
}

export async function readChainResource(uri: string, getNode: () => DevNode | undefined) {
  const node = getNode();

  if (uri === 'cfxdevkit://chain/status') {
    if (!node || node.getStatus() !== 'running') {
      return jsonError(uri, 'Node is not running. Run cfxdevkit_node_start first.');
    }
    try {
      const espaceClient = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
      const coreClient = createClient({
        chain: coreSpaceLocal,
        transport: http(),
      }) as CoreSpaceClient;
      const [espaceBlock, coreStatus, miningStatus] = await Promise.all([
        espaceClient.getBlockNumber(),
        coreClient.getStatus(),
        node.getMiningStatus(),
      ]);
      const result = json({
        node: node.getStatus(),
        urls: node.urls,
        eSpace: { blockNumber: espaceBlock.toString() },
        coreSpace: { epochNumber: coreStatus.epochNumber.toString() },
        mining: miningStatus,
      });
      const first = result.contents[0];
      if (first) first.uri = uri;
      return result;
    } catch (err) {
      return jsonError(
        uri,
        `Failed to fetch status: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (uri === 'cfxdevkit://chain/accounts') {
    if (!node || node.getStatus() !== 'running') {
      return jsonError(uri, 'Node is not running. Run cfxdevkit_node_start first.');
    }
    try {
      const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
      const accounts = await Promise.all(
        node.accounts.map(async (a, i) => {
          const bal = await client.getBalance(a.evmAddress).catch(() => 0n);
          return {
            index: i,
            evmAddress: a.evmAddress,
            coreAddress: a.coreAddress,
            balance: formatCFX(bal),
          };
        }),
      );
      const result = json({ accounts });
      const first = result.contents[0];
      if (first) first.uri = uri;
      return result;
    } catch (err) {
      return jsonError(
        uri,
        `Failed to fetch accounts: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return jsonError(uri, `Unknown chain resource: ${uri}`);
}
