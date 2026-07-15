/**
 * OneKey host diagnostics utilities.
 *
 * Extracted from onekey-session.ts to reduce file size.
 */

import { readdir, readFile } from 'node:fs/promises';

export async function collectOneKeyHostDiagnostics(): Promise<{
  devBusUsbVisible: boolean;
  usbBusCount: number;
  usbDeviceNodeCount: number;
  hidrawCount: number;
  hidrawDevices: string[];
  usbFingerprints: Array<{
    sysName: string;
    vendorId: string | null;
    productId: string | null;
    manufacturer: string | null;
    product: string | null;
  }>;
}> {
  const [usbBusEntries, devEntries] = await Promise.all([
    safeReadDir('/dev/bus/usb'),
    safeReadDir('/dev'),
  ]);

  let usbDeviceNodeCount = 0;
  if (usbBusEntries.ok) {
    const perBus = await Promise.all(
      usbBusEntries.entries.map(async (bus) => {
        const devices = await safeReadDir(`/dev/bus/usb/${bus}`);
        return devices.ok ? devices.entries.length : 0;
      }),
    );
    usbDeviceNodeCount = perBus.reduce((sum, value) => sum + value, 0);
  }

  const hidrawDevices = devEntries.ok
    ? devEntries.entries.filter((name) => name.startsWith('hidraw')).sort()
    : [];

  const usbFingerprints = await collectUsbFingerprints();

  return {
    devBusUsbVisible: usbBusEntries.ok,
    usbBusCount: usbBusEntries.ok ? usbBusEntries.entries.length : 0,
    usbDeviceNodeCount,
    hidrawCount: hidrawDevices.length,
    hidrawDevices,
    usbFingerprints,
  };
}

async function safeReadDir(path: string): Promise<{ ok: true; entries: string[] } | { ok: false }> {
  try {
    return { ok: true, entries: await readdir(path) };
  } catch {
    return { ok: false };
  }
}

async function collectUsbFingerprints(): Promise<
  Array<{
    sysName: string;
    vendorId: string | null;
    productId: string | null;
    manufacturer: string | null;
    product: string | null;
  }>
> {
  const sysDevices = await safeReadDir('/sys/bus/usb/devices');
  if (!sysDevices.ok) return [];

  const entries = await Promise.all(
    sysDevices.entries
      .filter((name) => /\d-\d/.test(name))
      .slice(0, 20)
      .map(async (name) => ({
        sysName: name,
        vendorId: await safeReadText(`/sys/bus/usb/devices/${name}/idVendor`),
        productId: await safeReadText(`/sys/bus/usb/devices/${name}/idProduct`),
        manufacturer: await safeReadText(`/sys/bus/usb/devices/${name}/manufacturer`),
        product: await safeReadText(`/sys/bus/usb/devices/${name}/product`),
      })),
  );

  return entries
    .filter((entry) => entry.vendorId || entry.productId || entry.manufacturer || entry.product)
    .sort((a, b) => a.sysName.localeCompare(b.sysName));
}

async function safeReadText(path: string): Promise<string | null> {
  try {
    return (await readFile(path, 'utf8')).trim() || null;
  } catch {
    return null;
  }
}

export function toUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}
