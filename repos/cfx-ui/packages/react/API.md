# `@cfxdevkit/react` — Public API

> React hooks over @cfxdevkit/cdk.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 77 symbols |
| `./account` | 2 symbols |
| `./balance` | 10 symbols |
| `./context` | 6 symbols |
| `./contract` | 14 symbols |
| `./events` | 3 symbols |
| `./tx` | 7 symbols |
| `./keystore` | 34 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/react";
export interface UseAccountReturn {
export interface UseNativeBalanceInput {
export interface UseNativeBalanceReturn {
export interface UseTokenBalanceInput {
export interface UseTokenBalanceReturn {
export interface TokenMetadata {
export interface UseTokenMetadataInput {
export interface UseTokenMetadataReturn {
export interface Signer {
export interface CfxProviderProps {
export interface ContractError extends Error {
export interface ReadCall {
export interface WriteInput {
export interface UseReadContractInput {
export interface UseReadContractReturn<T> {
export interface UseReadContractsInput {
export interface UseReadContractsReturn {
export interface UseSimulateContractInput {
export interface UseSimulateContractReturn<T> {
export interface UseWriteContractReturn {
export interface WatchEventLog {
export interface UseWatchEventInput {
export interface SendTransactionInput {
export interface SendTransactionResult {
export interface UseSendTransactionReturn {
export interface UseWaitForTransactionInput {
export interface UseWaitForTransactionReturn {
export declare function useAccount(): UseAccountReturn;
export declare function useNativeBalance(input: UseNativeBalanceInput): UseNativeBalanceReturn;
export declare function useTokenBalance(input: UseTokenBalanceInput): UseTokenBalanceReturn;
export declare function useTokenMetadata(input: UseTokenMetadataInput): UseTokenMetadataReturn;
export declare function CfxProvider({ client, signer, queryClient, children }: CfxProviderProps): import("react").JSX.Element;
export declare function useClient(): Client;
export declare function useChain(): ChainConfig;
export declare function useSigner(): Signer | null;
export declare function useReadContract<T = unknown>(input: UseReadContractInput): UseReadContractReturn<T>;
export declare function useReadContracts(input: UseReadContractsInput): UseReadContractsReturn;
export declare function useSimulateContract<T = unknown>(input: UseSimulateContractInput): UseSimulateContractReturn<T>;
export declare function useWriteContract(): UseWriteContractReturn;
export declare function useWatchEvent(input: UseWatchEventInput): void;
export declare function useSendTransaction(): UseSendTransactionReturn;
export declare function useWaitForTransaction(input: UseWaitForTransactionInput): UseWaitForTransactionReturn;
export { KeystoreContextValue }
export { KeystoreProviderProps }
export { KeystoreProvider }
export { AccountType }
export { DualChainIdentity }
export { KeystoreAccount }
export { KeystoreActionResult }
export { KeystoreActiveWallet }
export { KeystoreAddWalletInput }
export { KeystorePhase }
export { KeystoreService }
export { KeystoreStatusResult }
export { KeystoreWallet }
export { KeystoreWalletMutationResult }
export { UseKeystoreAccountsReturn }
export { useKeystoreAccounts }
export { UseKeystoreIdentityReturn }
export { useKeystoreIdentity }
export { UseKeystoreLifecycleReturn }
export { useIsKeystoreActive }
export { useIsKeystoreBlank }
export { useIsKeystoredLocked }
export { useIsKeystoreReady }
export { useKeystoreLifecycle }
export { UseKeystoreWalletsReturn }
export { useKeystoreWallets }
export { KeystoreAccountSwitcherProps }
export { KeystoreIdentityStripProps }
export { KeystoreShellProps }
export { KeystoreWalletSwitcherProps }
export { KeystoreAccountSwitcher }
export { KeystoreIdentityStrip }
export { KeystoreShell }
export { KeystoreWalletSwitcher }
```

---

## `./account`

```ts
export interface UseAccountReturn {
export declare function useAccount(): UseAccountReturn;
```

---

## `./balance`

```ts
export interface UseNativeBalanceInput {
export interface UseNativeBalanceReturn {
export interface UseTokenBalanceInput {
export interface UseTokenBalanceReturn {
export interface TokenMetadata {
export interface UseTokenMetadataInput {
export interface UseTokenMetadataReturn {
export declare function useNativeBalance(input: UseNativeBalanceInput): UseNativeBalanceReturn;
export declare function useTokenBalance(input: UseTokenBalanceInput): UseTokenBalanceReturn;
export declare function useTokenMetadata(input: UseTokenMetadataInput): UseTokenMetadataReturn;
```

---

## `./context`

```ts
export interface Signer {
export interface CfxProviderProps {
export declare function CfxProvider({ client, signer, queryClient, children }: CfxProviderProps): import("react").JSX.Element;
export declare function useClient(): Client;
export declare function useChain(): ChainConfig;
export declare function useSigner(): Signer | null;
```

---

## `./contract`

```ts
export interface ContractError extends Error {
export interface ReadCall {
export interface WriteInput {
export interface UseReadContractInput {
export interface UseReadContractReturn<T> {
export interface UseReadContractsInput {
export interface UseReadContractsReturn {
export interface UseSimulateContractInput {
export interface UseSimulateContractReturn<T> {
export interface UseWriteContractReturn {
export declare function useReadContract<T = unknown>(input: UseReadContractInput): UseReadContractReturn<T>;
export declare function useReadContracts(input: UseReadContractsInput): UseReadContractsReturn;
export declare function useSimulateContract<T = unknown>(input: UseSimulateContractInput): UseSimulateContractReturn<T>;
export declare function useWriteContract(): UseWriteContractReturn;
```

---

## `./events`

```ts
export interface WatchEventLog {
export interface UseWatchEventInput {
export declare function useWatchEvent(input: UseWatchEventInput): void;
```

---

## `./tx`

```ts
export interface SendTransactionInput {
export interface SendTransactionResult {
export interface UseSendTransactionReturn {
export interface UseWaitForTransactionInput {
export interface UseWaitForTransactionReturn {
export declare function useSendTransaction(): UseSendTransactionReturn;
export declare function useWaitForTransaction(input: UseWaitForTransactionInput): UseWaitForTransactionReturn;
```

---

## `./keystore`

```ts
export { KeystoreContextValue }
export { KeystoreProviderProps }
export { KeystoreProvider }
export { AccountType }
export { DualChainIdentity }
export { KeystoreAccount }
export { KeystoreActionResult }
export { KeystoreActiveWallet }
export { KeystoreAddWalletInput }
export { KeystorePhase }
export { KeystoreService }
export { KeystoreStatusResult }
export { KeystoreWallet }
export { KeystoreWalletMutationResult }
export { UseKeystoreAccountsReturn }
export { useKeystoreAccounts }
export { UseKeystoreIdentityReturn }
export { useKeystoreIdentity }
export { UseKeystoreLifecycleReturn }
export { useIsKeystoreActive }
export { useIsKeystoreBlank }
export { useIsKeystoredLocked }
export { useIsKeystoreReady }
export { useKeystoreLifecycle }
export { UseKeystoreWalletsReturn }
export { useKeystoreWallets }
export { KeystoreAccountSwitcherProps }
export { KeystoreIdentityStripProps }
export { KeystoreShellProps }
export { KeystoreWalletSwitcherProps }
export { KeystoreAccountSwitcher }
export { KeystoreIdentityStrip }
export { KeystoreShell }
export { KeystoreWalletSwitcher }
```

<!-- api-hash: 7765cc787c30e4ee50320cf1185a47404e828be9c367f33bd013d418e84e5b1e -->
