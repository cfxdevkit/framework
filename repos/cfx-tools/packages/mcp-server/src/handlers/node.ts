import type { NodeStatus } from '@cfxdevkit/client';
import { getControlPlaneClient } from '../control-plane.js';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleNodeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_node_start': {
      const client = getControlPlaneClient();
      const current = await client.node.status();
      if (current.node.running) {
        return text(
          `Node already running.\n${JSON.stringify(nodeSnapshot(current.node), null, 2)}`,
        );
      }
      try {
        const started = await client.node.start();
        return text(`Node started.\n${JSON.stringify(nodeSnapshot(started.node), null, 2)}`);
      } catch (err) {
        return errText(
          `Failed to start node: ${err instanceof Error ? err.message : String(err)}\nHint: Make sure @xcfx/node binary is installed.`,
        );
      }
    }

    case 'cfxdevkit_node_stop': {
      const client = getControlPlaneClient();
      const current = await client.node.status();
      if (!current.node.running) {
        return text('Node is not running.');
      }
      await client.node.stop();
      return text('Node stopped.');
    }

    case 'cfxdevkit_node_status': {
      const { node } = await getControlPlaneClient().node.status();
      if (!node.running) {
        return text(
          'Node status: stopped\nHint: Run cfxdevkit_node_start to start a local Conflux node.',
        );
      }
      return text(`Node status: ${node.status}\n${JSON.stringify(nodeSnapshot(node), null, 2)}`);
    }

    case 'cfxdevkit_node_mine': {
      const client = getControlPlaneClient();
      const current = await client.node.status();
      if (!current.node.running) {
        return errText('Node is not running. Run cfxdevkit_node_start first.');
      }
      const blocks = Math.max(1, Math.floor(Number(args.blocks ?? 1)));
      await client.node.mine({ blocks });
      return text(`Mined ${blocks} block(s).`);
    }

    default:
      return errText(`Unknown node tool: ${name}`);
  }
}

function nodeSnapshot(node: NodeStatus) {
  return {
    status: node.status,
    urls: node.urls,
    accounts: node.accounts.map(
      (a: {
        coreAddress: string;
        evmAddress: string;
        index: number;
        initialBalanceCfx: number;
      }) => ({
        index: a.index,
        espaceAddress: a.evmAddress,
        coreAddress: a.coreAddress,
        initialBalanceCfx: a.initialBalanceCfx,
      }),
    ),
    faucet: node.faucet
      ? {
          espaceAddress: node.faucet.evmAddress,
          coreAddress: node.faucet.coreAddress,
        }
      : null,
    mining: node.mining,
  };
}
