import { createDevNode, type DevNode } from '@cfxdevkit/devnode';

/** In-process devnode singleton. */
let _node: DevNode | undefined;

/** Expose the singleton for server cleanup and resource endpoints. */
export function getNodeSingleton(): DevNode | undefined {
  return _node;
}

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
      if (_node?.getStatus() === 'running') {
        return text(`Node already running.\n${JSON.stringify(nodeSnapshot(_node), null, 2)}`);
      }
      _node = createDevNode();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        await _node.start();
        clearTimeout(timeout);
        return text(`Node started.\n${JSON.stringify(nodeSnapshot(_node), null, 2)}`);
      } catch (err) {
        clearTimeout(timeout);
        _node = undefined;
        return errText(
          `Failed to start node: ${err instanceof Error ? err.message : String(err)}\nHint: Make sure @xcfx/node binary is installed.`,
        );
      }
    }

    case 'cfxdevkit_node_stop': {
      if (!_node || _node.getStatus() !== 'running') {
        return text('Node is not running.');
      }
      await _node.stop();
      _node = undefined;
      return text('Node stopped.');
    }

    case 'cfxdevkit_node_status': {
      if (!_node) {
        return text(
          'Node status: stopped\nHint: Run cfxdevkit_node_start to start a local Conflux node.',
        );
      }
      return text(
        `Node status: ${_node.getStatus()}\n${JSON.stringify(nodeSnapshot(_node), null, 2)}`,
      );
    }

    case 'cfxdevkit_node_mine': {
      if (!_node || _node.getStatus() !== 'running') {
        return errText('Node is not running. Run cfxdevkit_node_start first.');
      }
      const blocks = Math.max(1, Math.floor(Number(args.blocks ?? 1)));
      await _node.mine(blocks);
      return text(`Mined ${blocks} block(s).`);
    }

    default:
      return errText(`Unknown node tool: ${name}`);
  }
}

function nodeSnapshot(node: DevNode) {
  return {
    status: node.getStatus(),
    urls: node.urls,
    accounts: node.accounts.map((a) => ({
      index: node.accounts.indexOf(a),
      espaceAddress: a.evmAddress,
      coreAddress: a.coreAddress,
      initialBalanceCfx: a.initialBalanceCfx,
    })),
    faucet: {
      espaceAddress: node.faucet.evmAddress,
      coreAddress: node.faucet.coreAddress,
    },
    mining: node.getMiningStatus(),
  };
}
