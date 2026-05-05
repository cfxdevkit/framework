import type { Dispatch, SetStateAction } from 'react';
import type { LedgerMode, LedgerSession } from './ledger-session.js';
import { requireSession } from './wallet-controller-runtime.js';
import { deployBasicErc20WithSigner } from './wallet-deploy.js';
import type { LedgerState } from './wallet-state.js';

export function createDeployAction(input: {
  getMode(): LedgerMode;
  getRpcUrl(): string;
  getSession(): LedgerSession | null;
  packIfLocalNodeRuns(): Promise<void>;
  runWalletAction(activity: string, action: () => Promise<void>): Promise<void>;
  setState: Dispatch<SetStateAction<LedgerState>>;
}) {
  return async function deployBasicErc20() {
    await input.runWalletAction(
      'Review and approve the contract deployment on Ledger',
      async () => {
        const session = requireSession(input.getSession());
        const { artifact, rawTx, txHash, balance, contractAddress } =
          await deployBasicErc20WithSigner({
            rpcUrl: input.getRpcUrl(),
            mode: input.getMode(),
            signer: session.signer,
            afterBroadcast: input.packIfLocalNodeRuns,
          });
        input.setState((current) => ({
          ...current,
          status: 'ready',
          rawTx,
          txHash,
          balance,
          contractAddress,
          contractName: artifact.contractName,
          notice: contractAddress
            ? `${artifact.name} deployed and balance refreshed.`
            : `${artifact.name} deployment broadcast; receipt did not include an address yet.`,
        }));
      },
    );
  };
}
