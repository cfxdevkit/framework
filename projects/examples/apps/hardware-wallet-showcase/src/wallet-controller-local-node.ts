import type { Dispatch, SetStateAction } from 'react';
import {
  type DevNodeStatusSnapshot,
  devNodeStatus,
  packDevNodeTxs,
  startDevNode,
  stopDevNode,
} from './devnode-client.js';
import type { LedgerState } from './wallet-state.js';

export function createLocalNodeControls(input: {
  connected: boolean;
  setDevNode: Dispatch<SetStateAction<DevNodeStatusSnapshot | null>>;
  setState: Dispatch<SetStateAction<LedgerState>>;
  runWalletAction(activity: string, action: () => Promise<void>): Promise<void>;
}) {
  return {
    async refreshLocalNodeStatus() {
      input.setDevNode(await devNodeStatus());
    },
    async startLocalNode() {
      await input.runWalletAction(
        'Starting local devnode through the showcase backend',
        async () => {
          input.setDevNode(await startDevNode());
          input.setState((current) => ({ ...current, status: input.connected ? 'ready' : 'idle' }));
        },
      );
    },
    async stopLocalNode() {
      await input.runWalletAction('Stopping local devnode', async () => {
        input.setDevNode(await stopDevNode());
        input.setState((current) => ({ ...current, status: input.connected ? 'ready' : 'idle' }));
      });
    },
    async mineLocalNode() {
      await input.runWalletAction('Packing pending Core and eSpace transactions', async () => {
        input.setDevNode(await packDevNodeTxs());
        input.setState((current) => ({ ...current, status: input.connected ? 'ready' : 'idle' }));
      });
    },
  };
}
