import type { Signer } from '@cfxdevkit/core/wallet';
import type { LedgerTransportLike } from '@cfxdevkit/wallet/hardware/ledger';
import { createLedgerHardwareAdapter } from '@cfxdevkit/wallet/hardware/ledger';

export type LedgerMode = 'espace' | 'core';

export interface LedgerSession {
  mode: LedgerMode;
  path: string;
  signer: Signer;
  transport: LedgerTransportLike;
}

interface TransportWebHIDModule {
  create(): Promise<LedgerTransportLike>;
  openConnected?(): Promise<LedgerTransportLike | null>;
}

let opening: Promise<LedgerTransportLike> | null = null;

export async function createLedgerSession(
  mode: LedgerMode,
  path: string,
  showAddressOnDevice = false,
): Promise<LedgerSession> {
  const { default: TransportWebHID } = await import('@ledgerhq/hw-transport-webhid');
  const transport = await openLedgerTransport(TransportWebHID as unknown as TransportWebHIDModule);
  try {
    const adapter =
      mode === 'core'
        ? createLedgerHardwareAdapter({
            coreTransport: transport,
            family: 'core',
            path,
            chainId: 2029,
            coreNetworkId: 2029,
            showAddressOnDevice,
          })
        : createLedgerHardwareAdapter({
            eth: await createEthApp(transport),
            family: 'espace',
            path,
            chainId: 2030,
            showAddressOnDevice,
          });
    return { mode, path, transport, signer: await adapter.getSigner() };
  } catch (cause) {
    await transport.close?.();
    throw mapLedgerSessionError(cause);
  }
}

export async function closeLedgerSession(session: LedgerSession | null): Promise<void> {
  await session?.transport.close?.();
}

async function createEthApp(transport: LedgerTransportLike) {
  const { default: Eth } = await import('@ledgerhq/hw-app-eth');
  return new Eth(transport as never);
}

async function openLedgerTransport(TransportWebHID: TransportWebHIDModule) {
  if (!opening) {
    opening = (async () => {
      const existing = await TransportWebHID.openConnected?.();
      return existing ?? TransportWebHID.create();
    })();
  }
  try {
    return await opening;
  } catch (cause) {
    throw mapLedgerSessionError(cause);
  } finally {
    opening = null;
  }
}

function mapLedgerSessionError(cause: unknown): Error {
  const message = cause instanceof Error ? cause.message : String(cause);
  if (/already open|access denied|busy/i.test(message)) {
    return new Error(
      'Ledger transport is already open. Disconnect in the app, unplug/replug the device, then connect again.',
    );
  }
  if (/No device selected|denied|permission/i.test(message)) {
    return new Error(
      'Ledger connection was not authorized. Use Connect and select the unlocked Ledger device.',
    );
  }
  return cause instanceof Error ? cause : new Error(message);
}
