# `@cfxdevkit/protocol` — API Reference

> Protocol-level primitives for Conflux eSpace and Core Space.
> Works with any `Client` from `@cfxdevkit/core`.

## Exports

```ts
// Receipt polling
async function waitForTransactionReceipt(
  client: Client,
  hash: Hash,
  options?: WaitForReceiptOptions,
): Promise<TxReceipt>

// Receipt assertion
function assertSuccessfulReceipt(receipt: TxReceipt, hash?: Hash): TxReceipt
function isSuccessfulReceipt(receipt: TxReceipt): boolean

// Chain head
async function getChainProgress(client: Client): Promise<ChainProgress>

// Gas estimation (eSpace returns { gas }; Core Space also returns { storageCollateral })
async function estimateTransaction(client: Client, request: TxRequest): Promise<GasEstimate>

// Log collection (Core Space only)
async function collectLogs(client: Client, filter: CoreLogFilter): Promise<CoreLog[]>

// Types
type WaitForReceiptOptions = { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal }
type ChainProgress = { family: 'espace' | 'core'; chainId: number; height: bigint }
type GasEstimate = { gas: bigint; storageCollateral?: bigint }
```

## Usage

```ts
import { waitForTransactionReceipt, getChainProgress, estimateTransaction, collectLogs } from '@cfxdevkit/protocol';

// Wait up to 60 s for confirmation
const receipt = await waitForTransactionReceipt(client, hash, { intervalMs: 500 });

// Compare chain heads across clients
const [eSpace, core] = await Promise.all([getChainProgress(eClient), getChainProgress(cClient)]);

// Estimate with storage collateral on Core Space
const { gas, storageCollateral } = await estimateTransaction(coreClient, { to, data });

// Collect contract event logs from Core Space
const logs = await collectLogs(coreClient, { address, topics });
```

## Notes

- `waitForTransactionReceipt` throws if the receipt indicates revert (`status !== '0x0' / 'success'`).
- `collectLogs` throws for eSpace clients — use `client.request` with `eth_getLogs` for eSpace.
- Timeout defaults: `waitForTransactionReceipt` defaults to 60 000 ms; pass `{ timeoutMs: 0 }` to return immediately on missing receipt.
