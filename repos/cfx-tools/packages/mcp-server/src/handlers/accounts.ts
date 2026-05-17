import { getControlPlaneClient } from '../control-plane.js';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleAccountsTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_accounts_list': {
      const accounts = await getControlPlaneClient().accounts.list();
      return text(JSON.stringify(accounts.accounts, null, 2));
    }

    case 'cfxdevkit_account_get': {
      const index = Number(args.index ?? 0);
      const accounts = await getControlPlaneClient().accounts.list();
      const account = accounts.accounts[index];
      if (!account) {
        return errText(
          `Account index ${index} not found. Node has ${accounts.accounts.length} accounts (0-${accounts.accounts.length - 1}).`,
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
      const address = String(args.address ?? '');
      const amountCfx = String(args.amountCfx ?? '1');

      if (!address) return errText('address is required.');

      try {
        const funded = await getControlPlaneClient().accounts.fund({
          address,
          amount: amountCfx,
        });
        return text(`Funded ${address} with ${amountCfx} CFX.\nTx: ${funded.txHash}`);
      } catch (err) {
        return errText(`Funding failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      return errText(`Unknown accounts tool: ${name}`);
  }
}
