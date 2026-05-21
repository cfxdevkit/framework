# `@cfxdevkit/protocol` — Public API

> Conflux protocol helpers, precompile ABIs, and reusable DevKit contract ABI/bytecode metadata.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 47 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/protocol";
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
export { ADMIN_CONTROL_ABI }
export { adminControlAbi }
export { adminControlAddress }
export { CFX_NATIVE_ADDRESS }
export { CONFLUX_PRECOMPILE_ADDRESSES }
export { PRECOMPILE_ADDRESSES }
export { CROSS_SPACE_CALL_ABI }
export { crossSpaceCallAbi }
export { crossSpaceCallAddress }
export { POS_REGISTER_ABI }
export { posRegisterAbi }
export { posRegisterAddress }
export { SPONSOR_WHITELIST_ABI }
export { STAKING_ABI }
export { sponsorWhitelistAbi }
export { sponsorWhitelistAddress }
export { stakingAbi }
export { stakingAddress }
export { WCFX_ABI }
export { WCFX_ADDRESSES }
export { wcfxAbi }
export { wcfxAddresses }
export interface WaitForReceiptOptions {
export interface ChainProgress {
export interface GasEstimate {
export declare function isSuccessfulReceipt(receipt: TxReceipt): boolean;
export declare function assertSuccessfulReceipt(receipt: TxReceipt, hash?: Hash): TxReceipt;
export declare function waitForTransactionReceipt(client: Client, hash: Hash, options?: WaitForReceiptOptions): Promise<TxReceipt>;
export declare function getChainProgress(client: Client): Promise<ChainProgress>;
export declare function estimateTransaction(client: Client, request: TxRequest): Promise<GasEstimate>;
export declare function collectLogs(client: Client, filter: CoreLogFilter): Promise<CoreLog[]>;
```

<!-- api-hash: edba132d43c4c6f3b139210530bbd1b2689eceb8d10d1b4d78c6984fcb7485e5 -->
