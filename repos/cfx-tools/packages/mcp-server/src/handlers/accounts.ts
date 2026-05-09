import {
  createClient,
  type EspaceClient,
  espaceLocal,
  formatCFX,
  http,
  parseCFX,
  signerFromPrivateKey,
} from '@cfxdevkit/core';
import { getNodeSingleton } from './node.js';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

function requireRunningNode() {
  const node = getNodeSingleton();
  if (!node || node.getStatus() !== 'running') {
    return { error: 'Node is not running. Run cfxdevkit_node_start first.' };
  }
  return { node };
}

export async function handleAccountsTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_accounts_list': {
      const r = requireRunningNode();
      if ('error' in r) return errText(r.error);
      const { node } = r;

      // Fetch live balances for eSpace accounts
      const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
      const accountsWithBalances = await Promise.all(
        node.accounts.map(async (a, index) => {
          let balance = '?';
          try {
            const wei = await client.getBalance(a.evmAddress);
            balance = formatCFX(wei);
          } catch {
            balance = 'unavailable';
          }
          return {
            index,
            espaceAddress: a.evmAddress,
            coreAddress: a.coreAddress,
            balanceCfx: balance,
          };
        }),
      );

      return text(JSON.stringify(accountsWithBalances, null, 2));
    }

    case 'cfxdevkit_account_get': {
      const r = requireRunningNode();
      if ('error' in r) return errText(r.error);
      const { node } = r;

      const index = Number(args.index ?? 0);
      const account = node.accounts[index];
      if (!account) {
        return errText(
          `Account index ${index} not found. Node has ${node.accounts.length} accounts (0–${node.accounts.length - 1}).`,
        );
      }

      return text(
        JSON.stringify(
          {
            index,
            espaceAddress: account.evmAddress,
            coreAddress: account.coreAddress,
            initialBalanceCfx: account.initialBalanceCfx,
          },
          null,
          2,
        ),
      );
    }

    case 'cfxdevkit_account_fund': {
      const r = requireRunningNode();
      if ('error' in r) return errText(r.error);
      const { node } = r;

      const address = String(args.address ?? '');
      const amountCfx = String(args.amountCfx ?? '1');

      if (!address.startsWith('0x')) {
        return errText('Invalid address: must be a 0x-prefixed eSpace hex address.');
      }

      // Use the built-in devnode faucet via the eSpace client
      const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
      const faucetAccount = node.faucet;

      const amount = parseCFX(amountCfx);
      const signer = signerFromPrivateKey(faucetAccount.privateKey);

      try {
        const signedTx = await signer.signTransaction({
          to: address as `0x${string}`,
          value: amount,
          chainId: espaceLocal.id,
        });
        const txHash = await client.sendRawTransaction(signedTx);
        await node.mine(1);
        return text(`Funded ${address} with ${amountCfx} CFX.\nTx: ${txHash}`);
      } catch (err) {
        return errText(`Funding failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      return errText(`Unknown accounts tool: ${name}`);
  }
}
