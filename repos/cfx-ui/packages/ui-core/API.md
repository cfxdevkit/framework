# `@cfxdevkit/ui-core` — Public API

> Headless controllers and token utilities for reusable Conflux UI.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 28 symbols |
| `./network` | 4 symbols |
| `./tokens` | 19 symbols |
| `./wallet` | 4 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/ui-core";
export declare const CFX_NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const WCFX_ADDRESSES: {
export declare const DEFAULT_MAINNET_TOKENS: ({
export declare const DEFAULT_MAINNET_ERC20_TOKENS: ({
export declare const DEFAULT_MAINNET_PAIRS: ({
export declare const DEFAULT_MAINNET_DISPLAY_TOKENS: ({
export declare const DEFAULT_MAINNET_DISPLAY_ERC20_TOKENS: ({
export interface AddEthereumChainParameter {
export interface UseNetworkSwitchControllerOptions {
export interface NetworkSwitchController {
export interface PairLike {
export interface SelectableTokenLike {
export interface TokenMetadata extends SelectableTokenLike {
export interface TokenSelectionOptions {
export interface UseSelectableTokensOptions<TToken extends SelectableTokenLike> {
export interface UseWalletSessionOptions {
export interface WalletSessionController {
export declare function useNetworkSwitchController(options: UseNetworkSwitchControllerOptions): NetworkSwitchController;
export declare function normalizeAddress(address: string): string;
export declare function wcfxAddress(network?: keyof typeof WCFX_ADDRESSES): string;
export declare function resolveTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
export declare function resolveDisplayTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
export declare function getDisplayTokens<TToken extends SelectableTokenLike>(tokens: readonly TToken[], options?: TokenSelectionOptions): TToken[];
export declare function getPairedTokens<TToken extends SelectableTokenLike>(pairs: readonly PairLike[], allTokens: readonly TToken[], tokenInAddress: string, options?: TokenSelectionOptions): TToken[];
export declare function useSelectableTokens<TToken extends SelectableTokenLike>(options: UseSelectableTokensOptions<TToken>): TToken[];
export declare function useWalletSession(options?: UseWalletSessionOptions): WalletSessionController;
export type WalletSessionStatus = 'disconnected' | 'connecting' | 'connected';
```

---

## `./network`

```ts
export interface AddEthereumChainParameter {
export interface UseNetworkSwitchControllerOptions {
export interface NetworkSwitchController {
export declare function useNetworkSwitchController(options: UseNetworkSwitchControllerOptions): NetworkSwitchController;
```

---

## `./tokens`

```ts
export declare const CFX_NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const WCFX_ADDRESSES: {
export declare const DEFAULT_MAINNET_TOKENS: ({
export declare const DEFAULT_MAINNET_ERC20_TOKENS: ({
export declare const DEFAULT_MAINNET_PAIRS: ({
export declare const DEFAULT_MAINNET_DISPLAY_TOKENS: ({
export declare const DEFAULT_MAINNET_DISPLAY_ERC20_TOKENS: ({
export interface PairLike {
export interface SelectableTokenLike {
export interface TokenMetadata extends SelectableTokenLike {
export interface TokenSelectionOptions {
export interface UseSelectableTokensOptions<TToken extends SelectableTokenLike> {
export declare function normalizeAddress(address: string): string;
export declare function wcfxAddress(network?: keyof typeof WCFX_ADDRESSES): string;
export declare function resolveTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
export declare function resolveDisplayTokenAddress(address: string, wrappedNativeAddress?: string, nativeAddress?: string): string;
export declare function getDisplayTokens<TToken extends SelectableTokenLike>(tokens: readonly TToken[], options?: TokenSelectionOptions): TToken[];
export declare function getPairedTokens<TToken extends SelectableTokenLike>(pairs: readonly PairLike[], allTokens: readonly TToken[], tokenInAddress: string, options?: TokenSelectionOptions): TToken[];
export declare function useSelectableTokens<TToken extends SelectableTokenLike>(options: UseSelectableTokensOptions<TToken>): TToken[];
```

---

## `./wallet`

```ts
export type WalletSessionStatus = 'disconnected' | 'connecting' | 'connected';
export interface UseWalletSessionOptions {
export interface WalletSessionController {
export declare function useWalletSession(options?: UseWalletSessionOptions): WalletSessionController;
```

<!-- api-hash: 608fd29c18a53c1e172c28aa6f7aa64f7306646afe5eddb5f8c37caea5c707de -->
