import type { signerFromOneKey } from '@cfxdevkit/wallet/hardware/onekey';

export const ESPACE_CHAIN_ID = 71;
export const CORE_NETWORK_ID = 1;
export const EVM_PATH = "m/44'/60'/0'/0/0";
export const CORE_PATH = "m/44'/503'/0'/0/0";

export const UI_EVENT = 'UI_EVENT';
export const UI_REQUEST_PIN = 'ui-request_pin';
export const UI_INVALID_PIN = 'ui-invalid_pin';
export const UI_CLOSE_PIN_WINDOW = 'ui-close_pin_window';
export const UI_RECEIVE_PIN = 'ui-receive_pin';

export const EIP712_PAYLOAD = {
  domain: { name: 'Conflux Showcase', version: '1', chainId: ESPACE_CHAIN_ID },
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
    ],
    SignIn: [
      { name: 'message', type: 'string' },
      { name: 'nonce', type: 'string' },
    ],
  },
  primaryType: 'SignIn' as const,
  message: { message: 'Sign in to Conflux Showcase', nonce: 'demo-nonce' },
};

export const CIP23_PAYLOAD = {
  domain: { name: 'Conflux Core Showcase', version: '1', chainId: CORE_NETWORK_ID },
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
    ],
    SignIn: [
      { name: 'message', type: 'string' },
      { name: 'nonce', type: 'string' },
    ],
  },
  primaryType: 'SignIn' as const,
  message: { message: 'Sign in to Conflux Core Showcase', nonce: 'demo-nonce' },
};

export type SdkInstance = Parameters<typeof signerFromOneKey>[0]['sdk'];
export type OneKeySdkResult = SdkInstance & {
  searchDevices(): Promise<{ success: boolean; payload: { connectId: string }[] }>;
  getFeatures(connectId: string): Promise<{
    success: boolean;
    payload: { deviceId: string; onekey_version?: string; label?: string };
  }>;
  on(event: string, listener: (message: { type?: string; payload?: unknown }) => void): void;
  uiResponse(response: { type: string; payload: string }): void;
  cancel(connectId?: string): void;
};

// OneKey can expose different product IDs across firmware/bootloader modes.
const ONEKEY_USB_FILTERS = [{ vendorId: 0x1209 }];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDeviceRetry<T>(op: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      if (!String(err).toLowerCase().includes('device interrupted')) throw err;
      await sleep(250);
    }
  }
  throw lastErr;
}

export async function ensureWebUsbPermission(): Promise<number> {
  if (typeof navigator === 'undefined' || !('usb' in navigator)) return 0;
  const nav = navigator as Navigator & {
    usb: {
      getDevices(): Promise<unknown[]>;
      requestDevice(opts: {
        filters: Array<{ vendorId: number; productId?: number }>;
      }): Promise<unknown>;
    };
  };

  const granted = await nav.usb.getDevices();
  if (granted.length > 0) return granted.length;

  // searchDevices() does not always trigger the browser chooser; request WebUSB access first.
  await nav.usb.requestDevice({ filters: ONEKEY_USB_FILTERS });
  const refreshed = await nav.usb.getDevices();
  return refreshed.length;
}

/**
 * Initialise the OneKey SDK for direct WebUSB access.
 *
 * Uses @onekeyfe/hd-common-connect-sdk with env:'webusb' — no iframe, no Bridge.
 * WebUSB works on localhost without HTTPS (spec exemption) and on HTTPS origins.
 */
export async function loadSdk(): Promise<OneKeySdkResult> {
  const mod = await import('@onekeyfe/hd-common-connect-sdk');
  const HardwareSDK = (mod.default ?? mod) as unknown as OneKeySdkResult & {
    init(opts: { env: string; debug: boolean }): Promise<void>;
  };
  await HardwareSDK.init({ env: 'webusb', debug: false });
  return HardwareSDK;
}
