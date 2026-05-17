import { getControlPlaneClient } from '../control-plane.js';

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

export async function readChainResource(uri: string) {
  if (uri === 'cfxdevkit://chain/status') {
    const client = getControlPlaneClient();
    const { node } = await client.node.status();
    if (!node.running) {
      return jsonError(uri, 'Node is not running. Run cfxdevkit_node_start first.');
    }
    try {
      const result = json({
        node: node.status,
        urls: node.urls,
        accountCount: node.accounts.length,
        faucet: node.faucet
          ? { evmAddress: node.faucet.evmAddress, coreAddress: node.faucet.coreAddress }
          : null,
        mining: node.mining,
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
    const client = getControlPlaneClient();
    const { node } = await client.node.status();
    if (!node.running) {
      return jsonError(uri, 'Node is not running. Run cfxdevkit_node_start first.');
    }
    try {
      const { accounts } = await client.accounts.list();
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
