import type { CoreLogFilter, CoreSpaceClient } from '@cfxdevkit/core';
import type { LookupKind } from './core-panel-advanced.js';

export async function executeLookup({
  client,
  lookupKind,
  lookupHash,
  lookupAddr,
}: {
  client: CoreSpaceClient;
  lookupKind: LookupKind;
  lookupHash: string;
  lookupAddr: string;
}) {
  switch (lookupKind) {
    case 'tx':
      return client.getTransaction(lookupHash as `0x${string}`);
    case 'receipt':
      return client.getTransactionReceipt(lookupHash as `0x${string}`);
    case 'admin':
      return client.getAdmin(lookupAddr);
    case 'sponsor':
      return client.getSponsorInfo(lookupAddr);
    case 'logs': {
      const epoch = await client.getEpochNumber();
      const filter: CoreLogFilter = { fromEpoch: epoch - 100n, toEpoch: epoch };
      if (lookupAddr) filter.address = lookupAddr;
      return client.getLogs(filter);
    }
  }
}
