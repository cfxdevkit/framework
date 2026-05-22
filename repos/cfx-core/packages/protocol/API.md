# `@cfxdevkit/protocol` — Public API

> Conflux protocol helpers, precompile ABIs, and reusable DevKit contract ABI/bytecode metadata.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 47 symbols |

---

## `.`

### Usage

```ts
import { automationManagerAddress, waitForTransactionReceipt } from '@cfxdevkit/protocol';
```

```ts
// The package name identifier
export declare const __packageName: "@cfxdevkit/protocol";

// The ABI for the Automation Manager contract
export { AUTOMATION_MANAGER_ABI }

// The ABI for the Automation Manager contract (alias)
export { automationManagerAbi }

// The deployed address of the Automation Manager contract
export { automationManagerAddress }

// The compiled bytecode of the Automation Manager contract
export { automationManagerBytecode }

// The configuration object for the Automation Manager contract
export { automationManagerConfig }

// The ABI for the Permit Handler contract
export { PERMIT_HANDLER_ABI }

// The ABI for the Permit Handler contract (alias)
export { permitHandlerAbi }

// The deployed address of the Permit Handler contract
export { permitHandlerAddress }

// The compiled bytecode of the Permit Handler contract
export { permitHandlerBytecode }

// The configuration object for the Permit Handler contract
export { permitHandlerConfig }

// The ABI for the Swappi Price Adapter contract
export { SWAPPI_PRICE_ADAPTER_ABI }

// The ABI for the Swappi Price Adapter contract (alias)
export { swappiPriceAdapterAbi }

// The deployed address of the Swappi Price Adapter contract
export { swappiPriceAdapterAddress }

// The compiled bytecode of the Swappi Price Adapter contract
export { swappiPriceAdapterBytecode }

// The configuration object for the Swappi Price Adapter contract
export { swappiPriceAdapterConfig }

// The ABI for the Admin Control contract
export { ADMIN_CONTROL_ABI }

// The ABI for the Admin Control contract (alias)
export { adminControlAbi }

// The deployed address of the Admin Control contract
export { adminControlAddress }

// The native CFX token address (0x0000000000000000000000000000000000000000)
export { CFX_NATIVE_ADDRESS }

// Map of Conflux protocol precompile addresses by name
export { CONFLUX_PRECOMPILE_ADDRESSES }

// Map of system precompile addresses (alias for CONFLUX_PRECOMPILE_ADDRESSES)
export { PRECOMPILE_ADDRESSES }

// The ABI for the Cross Space Call contract
export { CROSS_SPACE_CALL_ABI }

// The ABI for the Cross Space Call contract (alias)
export { crossSpaceCallAbi }

// The deployed address of the Cross Space Call contract
export { crossSpaceCallAddress }

// The ABI for the PoS Register contract
export { POS_REGISTER_ABI }

// The ABI for the PoS Register contract (alias)
export { posRegisterAbi }

// The deployed address of the PoS Register contract
export { posRegisterAddress }

// The ABI for the Sponsor Whitelist contract
export { SPONSOR_WHITELIST_ABI }

// The ABI for the Sponsor Whitelist contract (alias)
export { sponsorWhitelistAbi }

// The deployed address of the Sponsor Whitelist contract
export { sponsorWhitelistAddress }

// The ABI for the Staking contract
export { STAKING_ABI }

// The ABI for the Staking contract (alias)
export { stakingAbi }

// The deployed address of the Staking contract
export { stakingAddress }

// The ABI for the Wrapped CFX (wCFX) contract
export { WCFX_ABI }

// Map of Wrapped CFX addresses across networks
export { WCFX_ADDRESSES }

// The ABI for the Wrapped CFX contract (alias)
export { wcfxAbi }

// Map of Wrapped CFX addresses across networks (alias)
export { wcfxAddresses }

// Options for configuring transaction receipt polling
export interface WaitForReceiptOptions {
  // Maximum number of blocks to wait for confirmation
  timeoutBlocks?: number;
  // Polling interval in milliseconds
  intervalMs?: number;
}

// Information about the current chain progress
export interface ChainProgress {
  // Current epoch number
  epoch: number;
  // Block height
  height: number;
  // Estimated time to next epoch (in seconds)
  estimatedEpochTime?: number;
}

// The estimated gas for a transaction
export interface GasEstimate {
  // Estimated gas limit for the transaction
  gas: bigint;
  // Estimated storage collateral (in CFX)
  storageCollateral?: bigint;
}

// Checks if a transaction receipt indicates success (status === '0x1')
export declare function isSuccessfulReceipt(receipt: TxReceipt): boolean;

// Asserts that a transaction receipt is successful; throws if not
export declare function assertSuccessfulReceipt(receipt: TxReceipt, hash?: Hash): TxReceipt;

// Waits for a transaction receipt to be mined, polling until confirmed or timeout
export declare function waitForTransactionReceipt(client: Client, hash: Hash, options?: WaitForReceiptOptions): Promise<TxReceipt>;

// Retrieves the current chain progress (epoch, block height, etc.)
export declare function getChainProgress(client: Client): Promise<ChainProgress>;

// Estimates the gas required for a transaction (including storage collateral)
export declare function estimateTransaction(client: Client, request: TxRequest): Promise<GasEstimate>;

// Collects logs matching a specific filter from the chain
export declare function collectLogs(client: Client, filter: CoreLogFilter): Promise<CoreLog[]>;
```

<!-- api-hash: edba132d43c4c6f3b139210530bbd1b2689eceb8d10d1b4d78c6984fcb7485e5 -->
