import type { Signer } from '@cfxdevkit/core/wallet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type DevNodeStatusSnapshot, devNodeStatus, packDevNodeTxs } from './devnode-client.js';
import type { MemoryDemoResult } from './keystore-demo.js';
import { closeLedgerSession, type LedgerMode, type LedgerSession } from './ledger-session.js';
import {
  DEFAULT_TX,
  formatNativeBalance,
  LOCAL_RPC,
  setTransferDraft,
  type TxDraft,
} from './wallet-actions.js';
import { createDeployAction } from './wallet-controller-deploy.js';
import { createKeystoreControls } from './wallet-controller-keystore.js';
import { createLedgerControls } from './wallet-controller-ledger.js';
import { createLocalNodeControls } from './wallet-controller-local-node.js';
import { runWalletAction as runAction } from './wallet-controller-runtime.js';
import { EVM_PATH, initialState, supportsWebHid } from './wallet-state.js';

export function useWalletController() {
  const webHid = useMemo(() => supportsWebHid(), []);
  const sessionRef = useRef<LedgerSession | null>(null);
  const managedSignerRef = useRef<Signer | null>(null);
  const [mode, setMode] = useState<LedgerMode>('espace');
  const [path, setPath] = useState(EVM_PATH);
  const [rpcUrl, setRpcUrl] = useState(LOCAL_RPC.espace);
  const [txDraft, setTxDraft] = useState<TxDraft>(DEFAULT_TX);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('0');
  const [devNode, setDevNode] = useState<DevNodeStatusSnapshot | null>(null);
  const [memoryDemo, setMemoryDemo] = useState<MemoryDemoResult | null>(null);
  const [fileUnlocked, setFileUnlocked] = useState(false);
  const [state, setState] = useState(initialState);
  const connected = Boolean(sessionRef.current && state.address);
  const busy = state.status === 'busy';
  const localNode = createLocalNodeControls({ connected, setDevNode, setState, runWalletAction });
  const ledger = createLedgerControls({
    getDevNode: () => devNode,
    getMode: () => mode,
    getPath: () => path,
    getRpcUrl: () => rpcUrl,
    getState: () => state,
    getTxDraft: () => txDraft,
    isConnected: () => connected,
    packIfLocalNodeRuns,
    runWalletAction,
    sessionRef,
    setMode,
    setPath,
    setRpcUrl,
    setState,
    webHid,
  });
  const keystore = createKeystoreControls({
    getDevNode: () => devNode,
    getMode: () => mode,
    getRpcUrl: () => rpcUrl,
    getState: () => state,
    getTxDraft: () => txDraft,
    managedSignerRef,
    packIfLocalNodeRuns,
    runWalletAction,
    sessionRef,
    setDevNode,
    setFileUnlocked,
    setMemoryDemo,
    setState,
  });
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

  async function packIfLocalNodeRuns() {
    if (devNode?.running) setDevNode(await packDevNodeTxs());
  }

  function updateTransferDraft(nextTo = transferTo, nextAmount = transferAmount) {
    setTransferTo(nextTo);
    setTransferAmount(nextAmount);
    setTxDraft((current) => setTransferDraft({ to: nextTo, amountCfx: nextAmount, current }));
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
    managedConnected: Boolean(managedSignerRef.current),
    fileUnlocked,
    connected,
    busy,
    selectBackend: keystore.selectBackend,
    setModePath: ledger.setModePath,
    setPathAndDisconnect: ledger.setPathAndDisconnect,
    setRpcUrl,
    setTxDraft,
    updateTransferDraft,
    toggleConnection: ledger.toggleConnection,
    signMessage: ledger.signMessage,
    signTransaction: ledger.signTransaction,
    sendTransfer: ledger.sendTransfer,
    deployBasicErc20,
    refreshBalance: ledger.refreshBalance,
    broadcast: ledger.broadcast,
    refreshLocalNodeStatus: localNode.refreshLocalNodeStatus,
    startLocalNode: localNode.startLocalNode,
    stopLocalNode: localNode.stopLocalNode,
    mineLocalNode: localNode.mineLocalNode,
    faucetConnectedAddress: ledger.faucetConnectedAddress,
    unlockFile: keystore.unlockFile,
    connectMemory: keystore.connectMemory,
    refreshManagedBalance: keystore.refreshManagedBalance,
    signManagedMessage: keystore.signManagedMessage,
    signManagedTransaction: keystore.signManagedTransaction,
    broadcastManaged: keystore.broadcastManaged,
    sendManagedTransfer: keystore.sendManagedTransfer,
    faucetManaged: keystore.faucetManaged,
    deployManaged: keystore.deployManaged,
    runMemoryDemo: (message?: string) => keystore.runMemoryDemo(message),
    updateMessage: (message: string) => setState((current) => ({ ...current, message })),
  };
}
