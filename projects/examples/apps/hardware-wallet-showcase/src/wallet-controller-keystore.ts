import type { Signer } from '@cfxdevkit/core/wallet';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { DevNodeStatusSnapshot } from './devnode-client.js';
import { devNodeAccounts } from './devnode-client.js';
import { fileKeystoreClient } from './file-keystore-client.js';
import {
  type KeystoreBackendId,
  type MemoryDemoResult,
  runMemoryKeystoreDemo,
} from './keystore-demo.js';
import { closeLedgerSession, type LedgerSession } from './ledger-session.js';
import {
  broadcastAndRefresh,
  buildTransaction,
  fundConnectedAddress,
  getNativeBalance,
  signBroadcastAndRefresh,
  type TxDraft,
} from './wallet-actions.js';
import { connectMemoryAccount } from './wallet-controller-memory.js';
import { deployBasicErc20WithSigner } from './wallet-deploy.js';
import { initialState, type LedgerState } from './wallet-state.js';

type Mode = 'core' | 'espace';

export function createKeystoreControls(input: {
  getDevNode(): DevNodeStatusSnapshot | null;
  getMode(): Mode;
  getRpcUrl(): string;
  getState(): LedgerState;
  getTxDraft(): TxDraft;
  managedSignerRef: MutableRefObject<Signer | null>;
  packIfLocalNodeRuns(): Promise<void>;
  runWalletAction(activity: string, action: () => Promise<void>): Promise<void>;
  sessionRef: MutableRefObject<LedgerSession | null>;
  setFileUnlocked: Dispatch<SetStateAction<boolean>>;
  setDevNode: Dispatch<SetStateAction<DevNodeStatusSnapshot | null>>;
  setMemoryDemo: Dispatch<SetStateAction<MemoryDemoResult | null>>;
  setState: Dispatch<SetStateAction<LedgerState>>;
}) {
  const memorySigner = () => {
    const signer = input.managedSignerRef.current;
    if (!signer) throw new Error('Create the memory keystore account first');
    return signer;
  };
  const applyAccount = (result: { address: string; coreAddress?: string; notice?: string }) => {
    input.setState((current) => ({
      ...current,
      status: 'ready',
      address: result.address,
      coreAddress: result.coreAddress ?? '',
      notice: result.notice ?? current.notice,
    }));
  };
  const applyFileResult = (result: Awaited<ReturnType<typeof fileKeystoreClient.signMessage>>) => {
    input.setState((current) => ({
      ...current,
      status: 'ready',
      address: result.address,
      coreAddress: result.coreAddress,
      rawTx: result.rawTx ?? current.rawTx,
      txHash: result.txHash ?? current.txHash,
      balance: result.balance ?? current.balance,
      contractAddress: result.contractAddress ?? current.contractAddress,
      contractName: result.artifact?.contractName ?? current.contractName,
      notice: result.notice,
    }));
  };
  return {
    async selectBackend(next: KeystoreBackendId) {
      if (next !== 'ledger') {
        await closeLedgerSession(input.sessionRef.current);
        input.sessionRef.current = null;
      }
      input.managedSignerRef.current = null;
      input.setState((current) => ({ ...initialState, message: current.message }));
    },
    async unlockFile(passphrase: string) {
      await input.runWalletAction('Unlocking encrypted file keystore', async () => {
        const result = await fileKeystoreClient.unlock(passphrase);
        input.setFileUnlocked(true);
        applyAccount({ ...result, notice: `Encrypted file keystore unlocked at ${result.path}` });
      });
    },
    async connectMemory(message?: string) {
      await input.runWalletAction('Creating an in-memory keystore account', async () => {
        await connectMemoryAccount({
          getMessage: () => input.getState().message,
          managedSignerRef: input.managedSignerRef,
          message,
          setMemoryDemo: input.setMemoryDemo,
          setState: input.setState,
        });
      });
    },
    async runMemoryDemo(message?: string) {
      await input.runWalletAction(
        'Creating an in-memory keystore and signing a message',
        async () => {
          const result = await runMemoryKeystoreDemo(message);
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
    async refreshManagedBalance(kind: 'memory' | 'file') {
      await input.runWalletAction('Reading balance from local RPC', async () => {
        if (kind === 'file') {
          const result = await fileKeystoreClient.balance(input.getMode());
          input.setState((current) => ({
            ...current,
            status: 'ready',
            balance: result.balance,
            notice: 'Balance refreshed.',
          }));
          return;
        }
        const balance = await getNativeBalance(input.getRpcUrl(), input.getMode(), memorySigner());
        input.setState((current) => ({
          ...current,
          status: 'ready',
          balance,
          notice: 'Balance refreshed.',
        }));
      });
    },
    async signManagedMessage(kind: 'memory' | 'file') {
      await input.runWalletAction('Signing message with keystore account', async () => {
        if (kind === 'file')
          return applyFileResult(await fileKeystoreClient.signMessage(input.getState().message));
        const rawTx = await memorySigner().signMessage(input.getState().message);
        input.setState((current) => ({
          ...current,
          status: 'ready',
          rawTx,
          notice: 'Message signed.',
        }));
      });
    },
    async signManagedTransaction(kind: 'memory' | 'file') {
      await input.runWalletAction('Signing transfer with keystore account', async () => {
        if (kind === 'file')
          return applyFileResult(
            await fileKeystoreClient.signTransfer(input.getMode(), input.getTxDraft()),
          );
        const rawTx = await memorySigner().signTransaction(
          buildTransaction(input.getMode(), memorySigner(), input.getTxDraft()),
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
    async broadcastManaged(kind: 'memory' | 'file') {
      await input.runWalletAction('Broadcasting signed transaction', async () => {
        const rawTx = input.getState().rawTx as `0x${string}`;
        if (kind === 'file')
          return applyFileResult(await fileKeystoreClient.broadcast(input.getMode(), rawTx));
        const result = await broadcastAndRefresh({
          rpcUrl: input.getRpcUrl(),
          mode: input.getMode(),
          signer: memorySigner(),
          rawTx,
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
    async sendManagedTransfer(kind: 'memory' | 'file') {
      await input.runWalletAction('Sending transfer with keystore account', async () => {
        if (kind === 'file')
          return applyFileResult(
            await fileKeystoreClient.sendTransfer(input.getMode(), input.getTxDraft()),
          );
        const result = await signBroadcastAndRefresh({
          rpcUrl: input.getRpcUrl(),
          mode: input.getMode(),
          signer: memorySigner(),
          draft: input.getTxDraft(),
          afterBroadcast: input.packIfLocalNodeRuns,
        });
        input.setState((current) => ({
          ...current,
          status: 'ready',
          ...result,
          notice: 'Transfer sent and balance refreshed.',
        }));
      });
    },
    async faucetManaged(kind: 'memory' | 'file') {
      await input.runWalletAction('Funding keystore account from devnode faucet', async () => {
        if (kind === 'file')
          return applyFileResult(await fileKeystoreClient.faucet(input.getMode()));
        const { faucet } = await devNodeAccounts();
        const txHash = await fundConnectedAddress({
          rpcUrl: input.getRpcUrl(),
          mode: input.getMode(),
          signer: memorySigner(),
          faucet,
        });
        await input.packIfLocalNodeRuns();
        const balance = await getNativeBalance(input.getRpcUrl(), input.getMode(), memorySigner());
        input.setState((current) => ({
          ...current,
          status: 'ready',
          txHash,
          balance,
          notice: 'Faucet funded keystore account.',
        }));
      });
    },
    async deployManaged(kind: 'memory' | 'file') {
      await input.runWalletAction('Deploying contract with keystore account', async () => {
        if (kind === 'file')
          return applyFileResult(await fileKeystoreClient.deploy(input.getMode()));
        const result = await deployBasicErc20WithSigner({
          rpcUrl: input.getRpcUrl(),
          mode: input.getMode(),
          signer: memorySigner(),
          afterBroadcast: input.packIfLocalNodeRuns,
        });
        input.setState((current) => ({
          ...current,
          status: 'ready',
          rawTx: result.rawTx,
          txHash: result.txHash,
          balance: result.balance,
          contractAddress: result.contractAddress,
          contractName: result.artifact.contractName,
          notice: `${result.artifact.name} deployed and balance refreshed.`,
        }));
      });
    },
  };
}
