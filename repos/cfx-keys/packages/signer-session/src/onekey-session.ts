/**
 * OneKey session creation.
 *
 * Extracted from index.ts to reduce file size and improve maintainability.
 * Diagnostics utilities are in onekey-diagnostics.ts.
 */

import { createOneKeySignerSession } from './backends/onekey.js';
import { collectOneKeyHostDiagnostics, toUnknownErrorMessage } from './onekey-diagnostics.js';
import type { SignerSession } from './types.js';

export interface OneKeySessionOptions {
  readonly oneKeyIncludeCore?: boolean;
}

export async function createOneKeySignerSessionFromConfig(
  cwd: string,
  entry: {
    readonly kind: 'onekey';
    readonly espacePath?: string;
    readonly corePath?: string;
    readonly espaceChainId?: number;
    readonly coreNetworkId?: number;
  },
  options?: OneKeySessionOptions,
): Promise<SignerSession> {
  const diagnosticsBase = {
    backend: 'onekey',
    cwd,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      CFX_ONEKEY_ENV: process.env.CFX_ONEKEY_ENV ?? null,
      CFX_ONEKEY_FETCH_CONFIG: process.env.CFX_ONEKEY_FETCH_CONFIG ?? null,
      CFX_ONEKEY_DEBUG: process.env.CFX_ONEKEY_DEBUG ?? null,
      CFX_ONEKEY_PIN: process.env.CFX_ONEKEY_PIN ? '[set]' : null,
    },
  };

  let importedModule: unknown;
  try {
    importedModule = await import('@onekeyfe/hd-common-connect-sdk');
  } catch {
    const usbDiagnostics = await collectOneKeyHostDiagnostics();
    throw new Error(
      [
        'Cannot load @onekeyfe/hd-common-connect-sdk. Ensure it is installed: pnpm add @onekeyfe/hd-common-connect-sdk',
        `OneKey diagnostics: ${JSON.stringify({ ...diagnosticsBase, usbDiagnostics }, null, 2)}`,
      ].join('\n'),
    );
  }

  const sdk = resolveOneKeySdk(importedModule);
  if (!sdk) {
    const moduleExports = describeModuleExports(importedModule);
    throw new Error(
      [
        'Loaded @onekeyfe/hd-common-connect-sdk but could not find expected SDK functions (init, searchDevices, getFeatures).',
        `Export keys: ${moduleExports}`,
        `OneKey diagnostics: ${JSON.stringify(diagnosticsBase, null, 2)}`,
      ].join('\n'),
    );
  }

  const runtimeSdk = sdk as {
    init(opts: Record<string, unknown>): Promise<void>;
    searchDevices(): Promise<{ success: boolean; payload: unknown }>;
    getFeatures(connectId: string): Promise<{
      success: boolean;
      payload: { deviceId: string; onekey_version?: string; label?: string };
    }>;
    on(event: string, listener: (payload: unknown) => void): void;
    off?(event: string, listener: (payload: unknown) => void): void;
    uiResponse?(response: { type: string; payload: unknown }): void;
    cancel?(connectId?: string): void;
  } & Parameters<typeof createOneKeySignerSession>[0]['sdk'];

  const detachUiHandlers = attachOneKeyUiHandlers(runtimeSdk);

  const resolvedOneKeyEnv = process.env.CFX_ONEKEY_ENV ?? 'node-usb';
  const initOptions = {
    debug: parseBooleanEnv('CFX_ONEKEY_DEBUG', false),
    fetchConfig: parseBooleanEnv('CFX_ONEKEY_FETCH_CONFIG', true),
    ...(resolvedOneKeyEnv ? { env: resolvedOneKeyEnv } : {}),
  };

  try {
    await runtimeSdk.init(initOptions);
  } catch (error) {
    const usbDiagnostics = await collectOneKeyHostDiagnostics();
    throw new Error(
      [
        `OneKey SDK init failed: ${toUnknownErrorMessage(error)}`,
        `OneKey diagnostics: ${JSON.stringify({ ...diagnosticsBase, initOptions, usbDiagnostics }, null, 2)}`,
      ].join('\n'),
    );
  }

  let devicesRes: { success: boolean; payload: unknown };
  try {
    devicesRes = await runtimeSdk.searchDevices();
  } catch (error) {
    const usbDiagnostics = await collectOneKeyHostDiagnostics();
    const message = toUnknownErrorMessage(error);
    throw new Error(
      [
        `OneKey device discovery failed: ${message}`,
        ...(message.includes('LIBUSB_ERROR_BUSY')
          ? [
              'OneKey USB interface is busy. Close any other wallet app/session that may hold the device, then retry.',
            ]
          : []),
        ...(message.toLowerCase().includes('interrupted')
          ? [
              'Device interaction was interrupted. Keep the device unlocked and confirm prompts on-device, then retry.',
            ]
          : []),
        `OneKey diagnostics: ${JSON.stringify({ ...diagnosticsBase, initOptions, usbDiagnostics }, null, 2)}`,
      ].join('\n'),
    );
  }

  const discoveredDevices = Array.isArray(devicesRes.payload) ? devicesRes.payload : [];
  if (!devicesRes.success || discoveredDevices.length === 0) {
    const usbDiagnostics = await collectOneKeyHostDiagnostics();
    throw new Error(
      [
        'No OneKey device found. Ensure the device is connected, unlocked, and reachable by OneKey SDK.',
        `Try setting CFX_ONEKEY_ENV and keep container USB/hidraw access enabled.`,
        `OneKey diagnostics: ${JSON.stringify({ ...diagnosticsBase, initOptions, usbDiagnostics }, null, 2)}`,
      ].join('\n'),
    );
  }

  const { connectId } = discoveredDevices[0] as { connectId: string };
  let featRes: { success: boolean; payload: { deviceId: string } };
  try {
    featRes = await runtimeSdk.getFeatures(connectId);
  } catch (error) {
    throw new Error(
      [
        `Could not read OneKey device features: ${toUnknownErrorMessage(error)}`,
        'Keep the device unlocked and approve pending prompts, then retry.',
      ].join('\n'),
    );
  }
  if (!featRes.success) {
    throw new Error('Could not read OneKey device features. Try reconnecting the device.');
  }

  const { deviceId } = featRes.payload;

  try {
    const session = await createOneKeySignerSession({
      kind: 'onekey',
      sdk: runtimeSdk,
      connectId,
      deviceId,
      ...(options?.oneKeyIncludeCore !== undefined
        ? { includeCore: options.oneKeyIncludeCore }
        : {}),
      ...(entry.espacePath ? { espacePath: entry.espacePath } : {}),
      ...(entry.corePath ? { corePath: entry.corePath } : {}),
      ...(entry.espaceChainId ? { espaceChainId: entry.espaceChainId } : {}),
      ...(entry.coreNetworkId ? { coreNetworkId: entry.coreNetworkId } : {}),
    });
    return {
      ...session,
      dispose: async () => {
        detachUiHandlers();
        await session.dispose();
      },
    };
  } catch (error) {
    detachUiHandlers();
    throw error;
  }
}

// ─── OneKey helpers ──────────────────────────────────────────────────────────

function resolveOneKeySdk(moduleValue: unknown): unknown {
  const candidates = [
    moduleValue,
    getProp(moduleValue, 'default'),
    getProp(getProp(moduleValue, 'default'), 'default'),
    getProp(moduleValue, 'HardwareSDK'),
    getProp(getProp(moduleValue, 'default'), 'HardwareSDK'),
  ];
  return candidates.find((candidate) => hasOneKeyRuntimeShape(candidate));
}

function hasOneKeyRuntimeShape(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.init === 'function' &&
    typeof candidate.searchDevices === 'function' &&
    typeof candidate.getFeatures === 'function'
  );
}

function describeModuleExports(moduleValue: unknown): string {
  if (!moduleValue || typeof moduleValue !== 'object') return '(non-object export)';
  const top = Object.keys(moduleValue as Record<string, unknown>);
  const nestedDefault = getProp(moduleValue, 'default');
  const nested =
    nestedDefault && typeof nestedDefault === 'object'
      ? Object.keys(nestedDefault as Record<string, unknown>)
      : [];
  return `top=[${top.join(', ')}], default=[${nested.join(', ')}]`;
}

function getProp(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') return undefined;
  return (value as Record<string, unknown>)[key];
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no') return false;
  return fallback;
}

function attachOneKeyUiHandlers(sdk: {
  on(event: string, listener: (payload: unknown) => void): void;
  off?(event: string, listener: (payload: unknown) => void): void;
  uiResponse?(response: { type: string; payload: unknown }): void;
  cancel?(connectId?: string): void;
}): () => void {
  if (typeof sdk.on !== 'function') return () => {};

  const pin = process.env.CFX_ONEKEY_PIN;
  const onPinRequest = (payload: unknown) => {
    const connectId =
      payload && typeof payload === 'object'
        ? (getProp(getProp(payload, 'device'), 'connectId') as string | undefined)
        : undefined;

    if (pin && typeof sdk.uiResponse === 'function') {
      sdk.uiResponse({ type: 'ui-receive_pin', payload: pin });
      return;
    }

    process.stderr.write(
      '[onekey] PIN requested by device but CFX_ONEKEY_PIN is not set. Set it in env to allow software PIN entry, or enter PIN on device if prompted.\n',
    );
    if (typeof sdk.cancel === 'function') sdk.cancel(connectId);
  };

  const onInvalidPin = () => {
    process.stderr.write(
      '[onekey] Invalid PIN reported by device. Update CFX_ONEKEY_PIN and retry.\n',
    );
  };

  sdk.on('ui-request_pin', onPinRequest);
  sdk.on('ui-invalid_pin', onInvalidPin);

  return () => {
    if (typeof sdk.off === 'function') {
      sdk.off('ui-request_pin', onPinRequest);
      sdk.off('ui-invalid_pin', onInvalidPin);
    }
  };
}
