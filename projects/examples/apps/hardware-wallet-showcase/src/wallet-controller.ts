import { useEffect, useMemo, useRef, useState } from 'react';
import { type DevNodeStatusSnapshot, devNodeStatus, packDevNodeTxs } from './devnode-client.js';
import type { MemoryDemoResult } from './keystore-demo.js';
import {
  closeLedgerSession,
  createLedgerSession,
  type LedgerMode,
  type LedgerSession,
} from './ledger-session.js';
import {
  broadcastAndRefresh,
  buildTransaction,
  DEFAULT_TX,
  formatNativeBalance,
  fundConnectedAddress,
  getNativeBalance,
  LOCAL_RPC,
  setTransferDraft,
  signBroadcastAndRefresh,
  type TxDraft,
} from './wallet-actions.js';
import { createDeployAction } from './wallet-controller-deploy.js';
import { createKeystoreControls } from './wallet-controller-keystore.js';
import { createLocalNodeControls } from './wallet-controller-local-node.js';
import { requireSession, runWalletAction as runAction } from './wallet-controller-runtime.js';
import { CORE_PATH, EVM_PATH, initialState, supportsWebHid } from './wallet-state.js';

export function useWalletController() {
  const webHid = useMemo(() => supportsWebHid(), []);
  const sessionRef = useRef<LedgerSession | null>(null);
  const [mode, setMode] = useState<LedgerMode>('espace');
  const [path, setPath] = useState(EVM_PATH);
  const [rpcUrl, setRpcUrl] = useState(LOCAL_RPC.espace);
  const [txDraft, setTxDraft] = useState<TxDraft>(DEFAULT_TX);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('0');
  const [devNode, setDevNode] = useState<DevNodeStatusSnapshot | null>(null);
  const [memoryDemo, setMemoryDemo] = useState<MemoryDemoResult | null>(null);
  const [state, setState] = useState(initialState);
  const connected = Boolean(sessionRef.current && state.address);
  const busy = state.status === 'busy';
  const localNode = createLocalNodeControls({ connected, setDevNode, setState, runWalletAction });
  const keystore = createKeystoreControls({ runWalletAction, setMemoryDemo, setState });
  const deployBasicErc20 = createDeployAction({
    getMode: () => mode,
    getRpcUrl: () => rpcUrl,
    getSession: () => sessionRef.current,
    packIfLocalNodeRuns,
    runWalletAction,
    setState,
  });

  useEffect(() => () => void closeLedgerSession(sessionRef.current), []);
  useEffect(() => {
    void devNodeStatus()
      .then(setDevNode)
      .catch(() => setDevNode({ status: 'stopped', running: false }));
  }, []);

  async function disconnect() {
    await closeLedgerSession(sessionRef.current);
    sessionRef.current = null;
    setState((current) => ({
      ...current,
      status: 'idle',
      address: '',
      coreAddress: '',
      error: '',
      activity: '',
    }));
  }

  async function setModePath(next: LedgerMode) {
    await disconnect();
    setMode(next);
    setPath(next === 'espace' ? EVM_PATH : CORE_PATH);
    setRpcUrl(LOCAL_RPC[next]);
    setState((current) => ({ ...current, rawTx: '', txHash: '', balance: '' }));
  }

  function setPathAndDisconnect(value: string) {
    void disconnect();
    setPath(value);
  }

  async function toggleConnection() {
    if (connected) return runWalletAction('Disconnect Ledger transport', disconnect);
    return runWalletAction('Connect Ledger and verify the address on device', async () => {
      if (!webHid) throw new Error('WebHID is unavailable in this browser');
      await disconnect();
      const session = await createLedgerSession(mode, path, true);
      sessionRef.current = session;
      setState((current) => ({
        ...current,
        status: 'ready',
        address: session.signer.account.address,
        coreAddress: session.signer.account.coreAddress ?? '',
        notice: 'Ledger connected and address verified.',
      }));
    });
  }

  async function signMessage() {
    await runWalletAction('Review and approve the message on Ledger', async () => {
      const session = requireSession(sessionRef.current);
      const rawTx = await session.signer.signMessage(state.message);
      setState((current) => ({ ...current, status: 'ready', rawTx, notice: 'Message signed.' }));
    });
  }

  async function signTransaction() {
    await runWalletAction('Review and approve the transaction on Ledger', async () => {
      const session = requireSession(sessionRef.current);
      const tx = buildTransaction(mode, session.signer, txDraft);
      const rawTx = await session.signer.signTransaction(tx);
      setState((current) => ({
        ...current,
        status: 'ready',
        rawTx,
        txHash: '',
        notice: 'Transfer signed. Broadcast the signed transaction to submit it.',
      }));
    });
  }

  async function sendTransfer() {
    await runWalletAction('Review on Ledger, then sending transfer to local RPC', async () => {
      const session = requireSession(sessionRef.current);
      const { rawTx, txHash, balance } = await signBroadcastAndRefresh({
        rpcUrl,
        mode,
        signer: session.signer,
        draft: txDraft,
        afterBroadcast: packIfLocalNodeRuns,
      });
      setState((current) => ({
        ...current,
        status: 'ready',
        rawTx,
        txHash,
        balance,
        notice: 'Transfer sent and balance refreshed.',
      }));
    });
  }

  async function refreshBalance() {
    await runWalletAction('Reading balance from local RPC', async () => {
      const session = requireSession(sessionRef.current);
      const balance = await getNativeBalance(rpcUrl, mode, session.signer);
      setState((current) => ({
        ...current,
        status: 'ready',
        balance,
        notice: 'Balance refreshed.',
      }));
    });
  }

  async function broadcast() {
    await runWalletAction('Sending the signed raw transaction to local RPC', async () => {
      if (!state.rawTx.startsWith('0x')) throw new Error('Sign a transaction first');
      const session = requireSession(sessionRef.current);
      const { txHash, balance } = await broadcastAndRefresh({
        rpcUrl,
        mode,
        signer: session.signer,
        rawTx: state.rawTx as `0x${string}`,
        afterBroadcast: packIfLocalNodeRuns,
      });
      setState((current) => ({
        ...current,
        status: 'ready',
        txHash,
        balance,
        notice: 'Transaction broadcast and balance refreshed.',
      }));
    });
  }

  async function packIfLocalNodeRuns() {
    if (devNode?.running) setDevNode(await packDevNodeTxs());
  }

  function updateTransferDraft(nextTo = transferTo, nextAmount = transferAmount) {
    setTransferTo(nextTo);
    setTransferAmount(nextAmount);
    setTxDraft((current) => setTransferDraft({ to: nextTo, amountCfx: nextAmount, current }));
  }

  async function faucetConnectedAddress() {
    await runWalletAction('Funding the connected address from the devnode faucet', async () => {
      const session = requireSession(sessionRef.current);
      const faucet = devNode?.faucet;
      if (!faucet) throw new Error('Start the local node before using the faucet');
      const txHash = await fundConnectedAddress({ rpcUrl, mode, signer: session.signer, faucet });
      setDevNode(await packDevNodeTxs());
      const balance = await getNativeBalance(rpcUrl, mode, session.signer);
      setState((current) => ({
        ...current,
        status: 'ready',
        txHash,
        balance,
        notice: 'Faucet funded the connected address and balance was refreshed.',
      }));
    });
  }

  async function runWalletAction(activity: string, action: () => Promise<void>) {
    return runAction(setState, activity, action);
  }

  return {
    webHid,
    mode,
    path,
    rpcUrl,
    txDraft,
    transferTo,
    transferAmount,
    state,
    balanceLabel: formatNativeBalance(state.balance),
    devNode,
    memoryDemo,
    connected,
    busy,
    setModePath,
    setPathAndDisconnect,
    setRpcUrl,
    setTxDraft,
    updateTransferDraft,
    toggleConnection,
    signMessage,
    signTransaction,
    sendTransfer,
    deployBasicErc20,
    refreshBalance,
    broadcast,
    refreshLocalNodeStatus: localNode.refreshLocalNodeStatus,
    startLocalNode: localNode.startLocalNode,
    stopLocalNode: localNode.stopLocalNode,
    mineLocalNode: localNode.mineLocalNode,
    faucetConnectedAddress,
    runMemoryDemo: keystore.runMemoryDemo,
    updateMessage: (message: string) => setState((current) => ({ ...current, message })),
  };
}
