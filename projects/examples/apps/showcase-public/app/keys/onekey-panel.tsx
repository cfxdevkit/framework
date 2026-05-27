'use client';

import type { Signer } from '@cfxdevkit/cdk/wallet';
import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { signerFromOneKey, signerFromOneKeyCore } from '@cfxdevkit/wallet/hardware/onekey';
import { useEffect, useRef, useState } from 'react';
import { useWalletSessions } from '../wallet-session-context';
import { readBalances } from './balance-context';
import { OneKeyConnectionStatus } from './onekey-connection-status';
import { OneKeyPinPrompt } from './onekey-pin-prompt';
import {
  CIP23_PAYLOAD,
  CORE_NETWORK_ID,
  CORE_PATH,
  EIP712_PAYLOAD,
  ESPACE_CHAIN_ID,
  EVM_PATH,
  ensureWebUsbPermission,
  loadSdk,
  type OneKeySdkResult,
  type SdkInstance,
  withDeviceRetry,
} from './onekey-sdk';
import { OneKeySigningDemo } from './onekey-widgets';
import { PANEL_STYLE } from './panel-styles';
import { useOneKeyPinPrompt } from './use-onekey-pin-prompt';
import { WalletSummary } from './wallet-summary';

interface DeviceInfo {
  label: string;
  firmware: string;
  connectId: string;
  deviceId: string;
}
interface WalletState {
  sdk: SdkInstance;
  eSpaceSigner: Signer;
  coreSigner: Signer;
  eSpace: `0x${string}`;
  core: string;
  balances: { eSpace: string; core: string };
}

export function OneKeyPanel() {
  const sdkRef = useRef<SdkInstance | null>(null);
  const { registerSession, removeSession } = useWalletSessions();
  const [webUsbSupported, setWebUsbSupported] = useState<boolean | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [sigs, setSigs] = useState({ eSpaceMsg: '', eSpaceTyped: '', coreMsg: '', coreTyped: '' });
  const [message, setMessage] = useState('Hello from OneKey on Conflux');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const {
    pinPrompt,
    activePinKey,
    setPinPrompt,
    attachSdkUiListeners,
    appendPinDigit,
    clearLastPinDigit,
    submitPinPrompt,
    cancelPinPrompt,
  } = useOneKeyPinPrompt({
    sdkRef,
    deviceConnectId: device?.connectId,
    onCancelled: () => setError('PIN entry cancelled.'),
  });

  useEffect(() => {
    setWebUsbSupported(typeof navigator !== 'undefined' && 'usb' in navigator);
  }, []);

  async function connectDevice() {
    setBusy('connecting');
    setError('');
    setPinPrompt(null);
    if (device?.deviceId) removeSession(`onekey:${device.deviceId}`);
    setDevice(null);
    setWallet(null);
    try {
      const grantedUsbDevices = await ensureWebUsbPermission();
      const sdk = await loadSdk();
      attachSdkUiListeners(sdk);
      sdkRef.current = sdk;
      let devicesRes = await sdk.searchDevices();
      // OneKey can take a moment to enumerate after permission is granted.
      for (
        let attempt = 0;
        attempt < 3 && (!devicesRes.success || !devicesRes.payload[0]);
        attempt += 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        devicesRes = await sdk.searchDevices();
      }
      if (!devicesRes.success || !devicesRes.payload[0]) {
        if (grantedUsbDevices > 0) {
          throw new Error(
            'WebUSB permission is granted but OneKey SDK could not discover the device. Unplug/replug the device, close other tabs/apps that may be using it, keep it unlocked on the homescreen, then retry.',
          );
        }
        throw new Error(
          'No OneKey device found. Ensure it is connected, unlocked, and you approved the browser USB prompt.',
        );
      }
      const { connectId } = devicesRes.payload[0];
      const featRes = await sdk.getFeatures(connectId);
      if (!featRes.success) throw new Error('Could not read device features.');
      const { deviceId, onekey_version, label } = featRes.payload;
      setDevice({
        connectId,
        deviceId,
        firmware: onekey_version ?? 'unknown',
        label: label ?? 'OneKey',
      });
    } catch (e) {
      const msg = String(e);
      if (msg.includes('NotFoundError')) {
        setError(
          'USB device selection was cancelled. Click Connect OneKey and approve the browser prompt.',
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy('');
    }
  }

  async function deriveAddresses() {
    if (!device) return;
    setBusy('addresses');
    setError('');
    try {
      const sdk = sdkRef.current ?? (await loadSdk());
      attachSdkUiListeners(sdk as OneKeySdkResult);
      sdkRef.current = sdk;
      // OneKey transport is sensitive to concurrent calls. Derive sequentially.
      const eSpaceSigner = await withDeviceRetry(() =>
        signerFromOneKey({
          sdk,
          connectId: device.connectId,
          deviceId: device.deviceId,
          path: EVM_PATH,
          chainId: ESPACE_CHAIN_ID,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 120));
      const coreSigner = await withDeviceRetry(() =>
        signerFromOneKeyCore({
          sdk,
          connectId: device.connectId,
          deviceId: device.deviceId,
          path: CORE_PATH,
          networkId: CORE_NETWORK_ID,
        }),
      );
      if (!coreSigner.account.coreAddress) throw new Error('Core address derivation failed.');
      const balances = await readBalances(
        eSpaceSigner.account.address,
        coreSigner.account.coreAddress,
      );
      setWallet({
        sdk,
        eSpaceSigner,
        coreSigner,
        eSpace: eSpaceSigner.account.address,
        core: coreSigner.account.coreAddress,
        balances,
      });
      registerSession({
        id: `onekey:${device.deviceId}`,
        label: `${device.label} (OneKey)`,
        kind: 'hardware',
        addresses: {
          eSpace: eSpaceSigner.account.address,
          core: coreSigner.account.coreAddress,
        },
        source: 'onekey',
      });
      setSigs({ eSpaceMsg: '', eSpaceTyped: '', coreMsg: '', coreTyped: '' });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy('');
    }
  }

  async function sign(op: keyof typeof sigs) {
    if (!wallet) return;
    setBusy(op);
    setError('');
    try {
      let sig = '';
      if (op === 'eSpaceMsg') sig = (await wallet.eSpaceSigner.signMessage(message)) as string;
      else if (op === 'eSpaceTyped')
        sig = (await wallet.eSpaceSigner.signTypedData(EIP712_PAYLOAD as never)) as string;
      else if (op === 'coreMsg') sig = (await wallet.coreSigner.signMessage(message)) as string;
      else if (op === 'coreTyped')
        sig = (await wallet.coreSigner.signTypedData(CIP23_PAYLOAD as never)) as string;
      setSigs((s) => ({ ...s, [op]: sig }));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy('');
    }
  }

  return (
    <section style={PANEL_STYLE}>
      <OneKeyConnectionStatus
        webUsbSupported={webUsbSupported}
        walletReady={Boolean(wallet)}
        device={device ? { label: device.label, firmware: device.firmware } : null}
        busy={busy}
        onConnect={() => void connectDevice()}
        onDeriveAddresses={() => void deriveAddresses()}
        evmPath={EVM_PATH}
        corePath={CORE_PATH}
      />

      {pinPrompt && (
        <OneKeyPinPrompt
          pinPrompt={pinPrompt}
          activePinKey={activePinKey}
          appendPinDigit={appendPinDigit}
          clearLastPinDigit={clearLastPinDigit}
          submitPinPrompt={submitPinPrompt}
          cancelPinPrompt={cancelPinPrompt}
        />
      )}

      {wallet && (
        <WalletSummary
          wallet={{
            eSpace: wallet.eSpace,
            core: wallet.core,
            signature: '',
            balances: wallet.balances,
          }}
        />
      )}

      {wallet && (
        <OneKeySigningDemo
          eSpaceSigner={wallet.eSpaceSigner}
          coreSigner={wallet.coreSigner}
          message={message}
          onMessage={setMessage}
          sigs={sigs}
          onSign={(op) => void sign(op)}
          busy={busy}
        />
      )}

      {error && <StatusBadge status="error" label={error} />}
    </section>
  );
}
