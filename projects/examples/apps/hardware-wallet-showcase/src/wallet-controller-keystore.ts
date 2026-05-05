import type { Dispatch, SetStateAction } from 'react';
import { type MemoryDemoResult, runMemoryKeystoreDemo } from './keystore-demo.js';
import type { LedgerState } from './wallet-state.js';

export function createKeystoreControls(input: {
  runWalletAction(activity: string, action: () => Promise<void>): Promise<void>;
  setMemoryDemo: Dispatch<SetStateAction<MemoryDemoResult | null>>;
  setState: Dispatch<SetStateAction<LedgerState>>;
}) {
  return {
    async runMemoryDemo() {
      await input.runWalletAction(
        'Creating an in-memory keystore and signing a message',
        async () => {
          const result = await runMemoryKeystoreDemo();
          input.setMemoryDemo(result);
          input.setState((current) => ({
            ...current,
            status: 'ready',
            notice: result.notice,
            address: result.address,
            rawTx: result.signature,
          }));
        },
      );
    },
  };
}
