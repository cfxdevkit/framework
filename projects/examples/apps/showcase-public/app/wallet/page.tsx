'use client';

import { parseCFX } from '@cfxdevkit/cdk';
import { getFluentCoreProvider } from '@cfxdevkit/wallet-connect';
import { useCoreWallet } from '@cfxdevkit/wallet-connect/hooks';
import { useEffect, useMemo, useState } from 'react';
import { parseEther, toHex } from 'viem';
import { useAccount, useBalance, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { SiteLayout } from '../site-layout';
import { buildCip23Payload, buildEip712Payload, CORE_TESTNET_ID } from './wallet/data';
import { WalletAccountCards } from './wallet-account-cards';
import { WalletActionCards } from './wallet-action-cards';

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
}

interface CoreChainState {
  balance: string | null;
  epoch: string | null;
  gasPrice: string | null;
}

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  // Strip out Core base32 addresses (cfxtest:/cfx:) that Fluent may briefly emit
  // through window.ethereum during Core chain switches — viem rejects them.
  const validHexAddress = address?.startsWith('0x') ? (address as `0x${string}`) : undefined;
  const { data: balanceData } = useBalance({ address: validHexAddress });
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const core = useCoreWallet();

  const [espaceMessage, setEspaceMessage] = useState('Hello from showcase-public eSpace');
  const [espaceSignature, setEspaceSignature] = useState('');
  const [espaceTypedSignature, setEspaceTypedSignature] = useState('');
  const [espaceTxHash, setEspaceTxHash] = useState('');
  const [espaceValue, setEspaceValue] = useState('0');
  const [espaceActionError, setEspaceActionError] = useState('');
  const [espaceBusy, setEspaceBusy] = useState(false);

  const [coreMessage, setCoreMessage] = useState('Hello from showcase-public Core');
  const [coreSignature, setCoreSignature] = useState('');
  const [coreTypedSignature, setCoreTypedSignature] = useState('');
  const [coreTxHash, setCoreTxHash] = useState('');
  const [coreValue, setCoreValue] = useState('0');
  const [coreActionError, setCoreActionError] = useState('');
  const [coreBusy, setCoreBusy] = useState(false);
  const [coreChainState, setCoreChainState] = useState<CoreChainState>({
    balance: null,
    epoch: null,
    gasPrice: null,
  });

  const eip712Payload = useMemo(
    () => buildEip712Payload(chainId, validHexAddress),
    [chainId, validHexAddress],
  );
  const coreChainIdNumber = core.chainId ? Number(BigInt(core.chainId)) : CORE_TESTNET_ID;
  const cip23Payload = useMemo(
    () => buildCip23Payload(coreChainIdNumber, core.address),
    [coreChainIdNumber, core.address],
  );

  useEffect(() => {
    if (!core.isConnected || !core.address) {
      setCoreChainState({ balance: null, epoch: null, gasPrice: null });
      return;
    }
    const provider = getFluentCoreProvider();
    if (!provider) return;
    let cancelled = false;

    async function refreshCoreState() {
      try {
        const [balance, epoch, gasPrice] = await Promise.all([
          provider?.request({ method: 'cfx_getBalance', params: [core.address, 'latest_state'] }),
          provider?.request({ method: 'cfx_epochNumber' }),
          provider?.request({ method: 'cfx_gasPrice' }),
        ]);
        if (cancelled) return;
        setCoreChainState({
          balance: typeof balance === 'string' ? balance : null,
          epoch: typeof epoch === 'string' ? epoch : null,
          gasPrice: typeof gasPrice === 'string' ? gasPrice : null,
        });
      } catch {
        if (!cancelled) setCoreChainState((prev) => prev);
      }
    }

    void refreshCoreState();
    const timer = setInterval(() => void refreshCoreState(), 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [core.address, core.isConnected]);

  async function signEspaceMessage() {
    if (!walletClient) return;
    setEspaceBusy(true);
    setEspaceActionError('');
    setEspaceSignature('');
    try {
      const signature = await walletClient.signMessage({ message: espaceMessage });
      setEspaceSignature(signature);
    } catch (error) {
      setEspaceActionError(errorText(error));
    } finally {
      setEspaceBusy(false);
    }
  }

  async function signEspaceTypedData() {
    if (!walletClient || !validHexAddress) return;
    setEspaceBusy(true);
    setEspaceActionError('');
    setEspaceTypedSignature('');
    try {
      const signature = await walletClient.signTypedData(eip712Payload as never);
      setEspaceTypedSignature(signature);
    } catch (error) {
      setEspaceActionError(errorText(error));
    } finally {
      setEspaceBusy(false);
    }
  }

  async function sendEspaceSelfTransfer() {
    if (!walletClient || !validHexAddress) return;
    setEspaceBusy(true);
    setEspaceActionError('');
    setEspaceTxHash('');
    try {
      const hash = await walletClient.sendTransaction({
        to: validHexAddress,
        value: parseEther(espaceValue.trim() || '0'),
      });
      setEspaceTxHash(hash);
    } catch (error) {
      setEspaceActionError(errorText(error));
    } finally {
      setEspaceBusy(false);
    }
  }

  async function signCoreMessage() {
    const provider = getFluentCoreProvider();
    if (!provider || !core.address) return;
    setCoreBusy(true);
    setCoreActionError('');
    setCoreSignature('');
    try {
      const signature = (await provider.request({
        method: 'personal_sign',
        params: [coreMessage, core.address],
      })) as string;
      setCoreSignature(signature);
    } catch (error) {
      setCoreActionError(errorText(error));
    } finally {
      setCoreBusy(false);
    }
  }

  async function signCoreTypedData() {
    const provider = getFluentCoreProvider();
    if (!provider || !core.address) return;
    setCoreBusy(true);
    setCoreActionError('');
    setCoreTypedSignature('');
    try {
      const signature = (await provider.request({
        method: 'cfx_signTypedData_v4',
        params: [core.address, JSON.stringify(cip23Payload)],
      })) as string;
      setCoreTypedSignature(signature);
    } catch (error) {
      setCoreActionError(errorText(error));
    } finally {
      setCoreBusy(false);
    }
  }

  async function sendCoreSelfTransfer() {
    const provider = getFluentCoreProvider();
    if (!provider || !core.address) return;
    setCoreBusy(true);
    setCoreActionError('');
    setCoreTxHash('');
    try {
      const value = parseCFX(coreValue.trim() || '0');
      const hash = (await provider.request({
        method: 'cfx_sendTransaction',
        params: [{ from: core.address, to: core.address, value: toHex(value) }],
      })) as string;
      setCoreTxHash(hash);
    } catch (error) {
      setCoreActionError(errorText(error));
    } finally {
      setCoreBusy(false);
    }
  }

  return (
    <SiteLayout>
      <WalletAccountCards
        address={address}
        balanceData={balanceData}
        chainId={chainId}
        chainName={chain?.name}
        core={core}
        coreChainState={coreChainState}
        isConnected={isConnected}
        isSwitching={isSwitching}
        switchChain={switchChain}
        validHexAddress={validHexAddress}
      />
      <WalletActionCards
        core={core}
        coreActionError={coreActionError}
        coreBusy={coreBusy}
        coreMessage={coreMessage}
        coreSignature={coreSignature}
        coreTxHash={coreTxHash}
        coreTypedSignature={coreTypedSignature}
        coreValue={coreValue}
        espaceActionError={espaceActionError}
        espaceBusy={espaceBusy}
        espaceMessage={espaceMessage}
        espaceSignature={espaceSignature}
        espaceTxHash={espaceTxHash}
        espaceTypedSignature={espaceTypedSignature}
        espaceValue={espaceValue}
        onCoreMessageChange={setCoreMessage}
        onCoreValueChange={setCoreValue}
        onEspaceMessageChange={setEspaceMessage}
        onEspaceValueChange={setEspaceValue}
        onSendCoreSelfTransfer={sendCoreSelfTransfer}
        onSendEspaceSelfTransfer={sendEspaceSelfTransfer}
        onSignCoreMessage={signCoreMessage}
        onSignCoreTypedData={signCoreTypedData}
        onSignEspaceMessage={signEspaceMessage}
        onSignEspaceTypedData={signEspaceTypedData}
        validHexAddress={validHexAddress}
        walletReady={!!walletClient}
      />
    </SiteLayout>
  );
}
