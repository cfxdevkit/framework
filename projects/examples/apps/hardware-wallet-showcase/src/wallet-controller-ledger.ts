import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { DevNodeStatusSnapshot } from './devnode-client.js';
import { devNodeAccounts } from './devnode-client.js';
import {
  closeLedgerSession,
  createLedgerSession,
  type LedgerMode,
  type LedgerSession,
} from './ledger-session.js';
import {
  broadcastAndRefresh,
  buildTransaction,
  fundConnectedAddress,
  getNativeBalance,
  LOCAL_RPC,
  signBroadcastAndRefresh,
  type TxDraft,
} from './wallet-actions.js';
import { requireSession } from './wallet-controller-runtime.js';
import { CORE_PATH, EVM_PATH, type LedgerState } from './wallet-state.js';

export function createLedgerControls(input: {
  getDevNode(): DevNodeStatusSnapshot | null;
  getMode(): LedgerMode;
  getPath(): string;
  getRpcUrl(): string;
  getState(): LedgerState;
  getTxDraft(): TxDraft;
  isConnected(): boolean;
  packIfLocalNodeRuns(): Promise<void>;
  runWalletAction(activity: string, action: () => Promise<void>): Promise<void>;
  sessionRef: MutableRefObject<LedgerSession | null>;
  setMode: Dispatch<SetStateAction<LedgerMode>>;
  setPath: Dispatch<SetStateAction<string>>;
  setRpcUrl: Dispatch<SetStateAction<string>>;
  setState: Dispatch<SetStateAction<LedgerState>>;
  webHid: boolean;
}) {
  async function disconnect() {
    await closeLedgerSession(input.sessionRef.current);
    input.sessionRef.current = null;
    input.setState((current) => ({
      ...current,
      status: 'idle',
      address: '',
      coreAddress: '',
      error: '',
      activity: '',
    }));
  }

  return {
    disconnect,
    async setModePath(next: LedgerMode) {
      await disconnect();
      input.setMode(next);
      input.setPath(next === 'espace' ? EVM_PATH : CORE_PATH);
      input.setRpcUrl(LOCAL_RPC[next]);
      input.setState((current) => ({ ...current, rawTx: '', txHash: '', balance: '' }));
    },
    setPathAndDisconnect(value: string) {
      void disconnect();
      input.setPath(value);
    },
    async toggleConnection() {
      if (input.isConnected())
        return input.runWalletAction('Disconnect Ledger transport', disconnect);
      return input.runWalletAction('Connect Ledger and verify the address on device', async () => {
        if (!input.webHid) throw new Error('WebHID is unavailable in this browser');
        await disconnect();
        const session = await createLedgerSession(input.getMode(), input.getPath(), true);
        input.sessionRef.current = session;
        input.setState((current) => ({
          ...current,
          status: 'ready',
          address: session.signer.account.address,
          coreAddress: session.signer.account.coreAddress ?? '',
          notice: 'Ledger connected and address verified.',
        }));
      });
    },
    async signMessage() {
      await input.runWalletAction('Review and approve the message on Ledger', async () => {
        const rawTx = await requireSession(input.sessionRef.current).signer.signMessage(
          input.getState().message,
        );
        input.setState((current) => ({
          ...current,
          status: 'ready',
          rawTx,
          notice: 'Message signed.',
        }));
      });
    },
    async signTransaction() {
      await input.runWalletAction('Review and approve the transaction on Ledger', async () => {
        const session = requireSession(input.sessionRef.current);
        const rawTx = await session.signer.signTransaction(
          buildTransaction(input.getMode(), session.signer, input.getTxDraft()),
        );
        input.setState((current) => ({
          ...current,
          status: 'ready',
          rawTx,
          txHash: '',
          notice: 'Transfer signed. Broadcast the signed transaction to submit it.',
        }));
      });
    },
    async sendTransfer() {
      await input.runWalletAction(
        'Review on Ledger, then sending transfer to local RPC',
        async () => {
          const session = requireSession(input.sessionRef.current);
          const result = await signBroadcastAndRefresh({
            rpcUrl: input.getRpcUrl(),
            mode: input.getMode(),
            signer: session.signer,
            draft: input.getTxDraft(),
            afterBroadcast: input.packIfLocalNodeRuns,
          });
          input.setState((current) => ({
            ...current,
            status: 'ready',
            ...result,
            notice: 'Transfer sent and balance refreshed.',
          }));
        },
      );
    },
    async refreshBalance() {
      await input.runWalletAction('Reading balance from local RPC', async () => {
        const session = requireSession(input.sessionRef.current);
        const balance = await getNativeBalance(input.getRpcUrl(), input.getMode(), session.signer);
        input.setState((current) => ({
          ...current,
          status: 'ready',
          balance,
          notice: 'Balance refreshed.',
        }));
      });
    },
    async broadcast() {
      await input.runWalletAction('Sending the signed raw transaction to local RPC', async () => {
        const rawTx = input.getState().rawTx;
        if (!rawTx.startsWith('0x')) throw new Error('Sign a transaction first');
        const session = requireSession(input.sessionRef.current);
        const result = await broadcastAndRefresh({
          rpcUrl: input.getRpcUrl(),
          mode: input.getMode(),
          signer: session.signer,
          rawTx: rawTx as `0x${string}`,
          afterBroadcast: input.packIfLocalNodeRuns,
        });
        input.setState((current) => ({
          ...current,
          status: 'ready',
          ...result,
          notice: 'Transaction broadcast and balance refreshed.',
        }));
      });
    },
    async faucetConnectedAddress() {
      await input.runWalletAction(
        'Funding the connected address from the devnode faucet',
        async () => {
          const session = requireSession(input.sessionRef.current);
          const { faucet } = await devNodeAccounts();
          const txHash = await fundConnectedAddress({
            rpcUrl: input.getRpcUrl(),
            mode: input.getMode(),
            signer: session.signer,
            faucet,
          });
          await input.packIfLocalNodeRuns();
          const balance = await getNativeBalance(
            input.getRpcUrl(),
            input.getMode(),
            session.signer,
          );
          input.setState((current) => ({
            ...current,
            status: 'ready',
            txHash,
            balance,
            notice: 'Faucet funded the connected address and balance was refreshed.',
          }));
        },
      );
    },
  };
}
