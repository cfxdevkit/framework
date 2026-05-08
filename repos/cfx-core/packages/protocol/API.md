# `@cfxdevkit/protocol` — API Reference

> Protocol-level primitives for Conflux eSpace and Core Space.
> Works with any `Client` from `@cfxdevkit/core`.

## Exports

```ts
const __packageName: '@cfxdevkit/protocol'

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

// Conflux precompiles
const CONFLUX_PRECOMPILE_ADDRESSES: {
  AdminControl: string
  SponsorWhitelist: string
  Staking: string
  PoSRegister: string
  CrossSpaceCall: string
  ParamsControl: string
}
const ADMIN_CONTROL_ABI: readonly unknown[]
const SPONSOR_WHITELIST_ABI: readonly unknown[]
const STAKING_ABI: readonly unknown[]
const CROSS_SPACE_CALL_ABI: readonly unknown[]
const POS_REGISTER_ABI: readonly unknown[]

// Wrapped native CFX helpers
const CFX_NATIVE_ADDRESS: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const WCFX_ADDRESSES: {
  testnet: '0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8'
  mainnet: '0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b'
  local: null
}
const WCFX_ABI: readonly unknown[]

// DevKit reusable contracts
const AUTOMATION_MANAGER_ABI: readonly unknown[]
const PERMIT_HANDLER_ABI: readonly unknown[]
const SWAPPI_PRICE_ADAPTER_ABI: readonly unknown[]
const automationManagerBytecode: `0x${string}`
const permitHandlerBytecode: `0x${string}`
const swappiPriceAdapterBytecode: `0x${string}`
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

// Import precompile metadata
import { CONFLUX_PRECOMPILE_ADDRESSES, SPONSOR_WHITELIST_ABI } from '@cfxdevkit/protocol';

// Import WCFX metadata for CAS wrap/unwrap and approval flows
import { CFX_NATIVE_ADDRESS, WCFX_ABI, WCFX_ADDRESSES } from '@cfxdevkit/protocol';

// Import reusable DevKit contract metadata
import { AUTOMATION_MANAGER_ABI, automationManagerBytecode } from '@cfxdevkit/protocol';
```

## Notes

- `waitForTransactionReceipt` throws if the receipt indicates revert (`status !== '0x0' / 'success'`).
- `collectLogs` throws for eSpace clients — use `client.request` with `eth_getLogs` for eSpace.
- Timeout defaults: `waitForTransactionReceipt` defaults to 60 000 ms; pass `{ timeoutMs: 0 }` to return immediately on missing receipt.
- `ParamsControl` is address-only until a verified ABI is added.
- `WCFX_ADDRESSES.local` is `null`; project-level apps should use their own local WCFX deployment address.
