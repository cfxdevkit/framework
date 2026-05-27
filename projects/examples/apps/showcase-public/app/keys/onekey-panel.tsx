'use client';

import type { Signer } from '@cfxdevkit/cdk/wallet';
import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { signerFromOneKey, signerFromOneKeyCore } from '@cfxdevkit/wallet/hardware/onekey';
import { useEffect, useState } from 'react';
import { readBalances } from './balance-context';
import { OneKeySigningDemo } from './onekey-widgets';
import { BUTTON_STYLE, MUTED_STYLE, PANEL_STYLE } from './panel-styles';
import { WalletSummary } from './wallet-summary';

const ESPACE_CHAIN_ID = 71;
const CORE_NETWORK_ID = 1;
const EVM_PATH = "m/44'/60'/0'/0/0";
const CORE_PATH = "m/44'/503'/0'/0/0";

const EIP712_PAYLOAD = {
  domain: { name: 'Conflux Showcase', version: '1', chainId: ESPACE_CHAIN_ID },
  types: {
    SignIn: [
      { name: 'message', type: 'string' },
      { name: 'nonce', type: 'string' },
    ],
  },
  primaryType: 'SignIn' as const,
  message: { message: 'Sign in to Conflux Showcase', nonce: 'demo-nonce' },
};
const CIP23_PAYLOAD = {
  domain: { name: 'Conflux Core Showcase', version: '1', chainId: CORE_NETWORK_ID },
  types: {
    SignIn: [
      { name: 'message', type: 'string' },
      { name: 'nonce', type: 'string' },
    ],
  },
  primaryType: 'SignIn' as const,
  message: { message: 'Sign in to Conflux Core Showcase', nonce: 'demo-nonce' },
};

type SdkInstance = Parameters<typeof signerFromOneKey>[0]['sdk'];
type OneKeySdkResult = SdkInstance & {
  searchDevices(): Promise<{ success: boolean; payload: { connectId: string }[] }>;
  getFeatures(connectId: string): Promise<{
    success: boolean;
    payload: { deviceId: string; onekey_version?: string; label?: string };
  }>;
};

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

/**
 * Initialise the OneKey SDK for direct WebUSB access.
 *
 * Uses @onekeyfe/hd-common-connect-sdk with env:'webusb' — no iframe, no Bridge.
 * WebUSB works on localhost without HTTPS (spec exemption) and on HTTPS origins.
 *
 * For local dev: `next dev --webpack` (webpack handles CJS fallbacks).
 * For production: deploy to dev.cfxdevkit.org (real HTTPS, WebUSB fully available).
 */
async function loadSdk(): Promise<OneKeySdkResult> {
  // Dynamic import keeps the heavy CJS SDK out of the initial bundle.
  const mod = await import('@onekeyfe/hd-common-connect-sdk');
  const HardwareSDK = (mod.default ?? mod) as unknown as OneKeySdkResult & {
    init(opts: { env: string; debug: boolean }): Promise<void>;
  };
  await HardwareSDK.init({ env: 'webusb', debug: false });
  return HardwareSDK;
}

export function OneKeyPanel() {
  const [webUsbSupported, setWebUsbSupported] = useState<boolean | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [sigs, setSigs] = useState({ eSpaceMsg: '', eSpaceTyped: '', coreMsg: '', coreTyped: '' });
  const [message, setMessage] = useState('Hello from OneKey on Conflux');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    setWebUsbSupported(typeof navigator !== 'undefined' && 'usb' in navigator);
  }, []);

  async function connectDevice() {
    setBusy('connecting');
    setError('');
    setDevice(null);
    setWallet(null);
    try {
      const sdk = await loadSdk();
      const devicesRes = await sdk.searchDevices();
      if (!devicesRes.success || !devicesRes.payload[0])
        throw new Error('No OneKey device found. Ensure it is connected and unlocked.');
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
      setError(String(e));
    } finally {
      setBusy('');
    }
  }

  async function deriveAddresses() {
    if (!device) return;
    setBusy('addresses');
    setError('');
    try {
      const sdk = await loadSdk();
      const [eSpaceSigner, coreSigner] = await Promise.all([
        signerFromOneKey({
          sdk,
          connectId: device.connectId,
          deviceId: device.deviceId,
          path: EVM_PATH,
          chainId: ESPACE_CHAIN_ID,
        }),
        signerFromOneKeyCore({
          sdk,
          connectId: device.connectId,
          deviceId: device.deviceId,
          path: CORE_PATH,
          networkId: CORE_NETWORK_ID,
        }),
      ]);
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
      <StatusBadge
        status={webUsbSupported === false ? 'error' : wallet ? 'ok' : 'pending'}
        label={
          webUsbSupported === null
            ? 'Checking WebUSB'
            : webUsbSupported === false
              ? 'WebUSB unavailable (use Chrome/Edge)'
              : wallet
                ? 'OneKey ready — both spaces connected'
                : device
                  ? `${device.label} fw ${device.firmware}`
                  : 'WebUSB ready'
        }
      />
      <p style={MUTED_STYLE}>
        eSpace {EVM_PATH} · Core {CORE_PATH} · EIP-712 ✅ · CIP-23 ✅
      </p>

      <button
        type="button"
        onClick={() => void connectDevice()}
        disabled={!webUsbSupported || busy !== ''}
        style={{
          ...BUTTON_STYLE,
          cursor: !webUsbSupported || busy !== '' ? 'not-allowed' : 'pointer',
        }}
      >
        {busy === 'connecting'
          ? 'Searching...'
          : device
            ? `Reconnect (${device.label})`
            : 'Connect OneKey'}
      </button>

      {device && (
        <div
          style={{
            display: 'grid',
            gap: 'var(--cfx-space-2)',
            padding: 'var(--cfx-space-3)',
            background: 'var(--cfx-color-bg-emphasis)',
            borderRadius: 'var(--cfx-radius-md)',
            border: '1px solid var(--cfx-color-border-default)',
          }}
        >
          <p style={{ ...MUTED_STYLE, fontWeight: 600, color: 'var(--cfx-color-fg-default)' }}>
            📱 {device.label} · fw {device.firmware}
          </p>
          <button
            type="button"
            onClick={() => void deriveAddresses()}
            disabled={busy !== ''}
            style={{ ...BUTTON_STYLE, cursor: busy !== '' ? 'not-allowed' : 'pointer' }}
          >
            {busy === 'addresses' ? 'Deriving...' : 'Derive addresses (eSpace + Core)'}
          </button>
        </div>
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
