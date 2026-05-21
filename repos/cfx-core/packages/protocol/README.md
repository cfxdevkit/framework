# @cfxdevkit/protocol

**Scope:** Pure Conflux protocol helpers, precompile ABIs, and reusable DevKit contract metadata.

This package is intentionally non-UI and has no RPC side effects. It gives backend services, MCP tools, CLIs, and tests a stable place to import:

- Receipt and chain helpers built around `@cfxdevkit/cdk` clients,
- Conflux internal contract addresses and ABIs (`AdminControl`, `SponsorWhitelist`, `Staking`, `CrossSpaceCall`, `PoSRegister`),
- WCFX ABI/address constants for app-level wrap, unwrap, and approval flows,
- DevKit reusable contract ABIs, bytecode, and generated address maps (`AutomationManager`, `PermitHandler`, `SwappiPriceAdapter`).

`ParamsControl` is included in `CONFLUX_PRECOMPILE_ADDRESSES`; the legacy DevKit source did not ship a verified ABI for it.

## Install

```bash
npm install @cfxdevkit/protocol
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 47 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/protocol";

// DevKit contract metadata
export { AUTOMATION_MANAGER_ABI }
export { automationManagerAbi }
export { automationManagerAddress }
export { automationManagerBytecode }
export { automationManagerConfig }

export { PERMIT_HANDLER_ABI }
export { permitHandlerAbi }
export { permitHandlerAddress }
export { permitHandlerBytecode }
export { permitHandlerConfig }

export { SWAPPI_PRICE_ADAPTER_ABI }
export { swappiPriceAdapterAbi }
export { swappiPriceAdapterAddress }
export { swappiPriceAdapterBytecode }
export { swappiPriceAdapterConfig }

// Conflux precompile contracts
export { ADMIN_CONTROL_ABI }
export { adminControlAbi }
export { adminControlAddress }

export { CROSS_SPACE_CALL_ABI }
export { crossSpaceCallAbi }
export { crossSpaceCallAddress }

export { POS_REGISTER_ABI }
export { posRegisterAbi }
export { posRegisterAddress }

export { SPONSOR_WHITELIST_ABI }
export { sponsorWhitelistAbi }
export { sponsorWhitelistAddress }

export { STAKING_ABI }
export { stakingAbi }
export { stakingAddress }

// WCFX (wrapped CFX)
export { WCFX_ABI }
export { WCFX_ADDRESSES }
export { wcfxAbi }
export { wcfxAddresses }

// Precompile addresses
export { CFX_NATIVE_ADDRESS }
export { CONFLUX_PRECOMPILE_ADDRESSES }
export { PRECOMPILE_ADDRESSES }

// Chain & receipt helpers
export interface WaitForReceiptOptions {
  timeout?: number;
  retryInterval?: number;
}

export interface ChainProgress {
  epochNumber: number;
  epochIndex: number;
  blockNumber: number;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  storageLimit: bigint;
}

export declare function isSuccessfulReceipt(receipt: TxReceipt): boolean;
export declare function assertSuccessfulReceipt(receipt: TxReceipt, hash?: Hash): TxReceipt;
export declare function waitForTransactionReceipt(client: Client, hash: Hash, options?: WaitForReceiptOptions): Promise<TxReceipt>;
export declare function getChainProgress(client: Client): Promise<ChainProgress>;
export declare function estimateTransaction(client: Client, request: TxRequest): Promise<GasEstimate>;
export declare function collectLogs(client: Client, filter: CoreLogFilter): Promise<CoreLog[]>;
```

<!-- readme-hash: 7454a57844eeb7916ea7e01afbac53e97e52c1bbe3a450c88d8db7bc877b6181 -->
