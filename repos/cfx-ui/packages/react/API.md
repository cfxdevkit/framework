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
// The package name constant.
export declare const __packageName: "@cfxdevkit/react";

// Represents the current account state returned by `useAccount`.
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

// Hook to get the current account state (address, status, etc.).
export declare function useAccount(): UseAccountReturn;

// Hook to fetch native (CFX) balance for a given address.
export declare function useNativeBalance(input: UseNativeBalanceInput): UseNativeBalanceReturn;

// Hook to fetch ERC-20 token balance for a given address and token contract.
export declare function useTokenBalance(input: UseTokenBalanceInput): UseTokenBalanceReturn;

// Hook to fetch metadata (name, symbol, decimals) for an ERC-20 token.
export declare function useTokenMetadata(input: UseTokenMetadataInput): UseTokenMetadataReturn;

// Context provider for CFX-related services (client, signer, query client).
export declare function CfxProvider({ client, signer, queryClient, children }: CfxProviderProps): import("react").JSX.Element;

// Hook to access the configured CFX client instance.
export declare function useClient(): Client;

// Hook to access the current chain configuration.
export declare function useChain(): ChainConfig;

// Hook to get the active signer (wallet connection).
export declare function useSigner(): Signer | null;

// Hook to perform a read-only call on a smart contract.
export declare function useReadContract<T = unknown>(input: UseReadContractInput): UseReadContractReturn<T>;

// Hook to perform multiple read-only calls in a single request.
export declare function useReadContracts(input: UseReadContractsInput): UseReadContractsReturn;

// Hook to simulate a contract write operation (estimate gas, validate inputs).
export declare function useSimulateContract<T = unknown>(input: UseSimulateContractInput): UseSimulateContractReturn<T>;

// Hook to initiate a write (state-changing) transaction on a contract.
export declare function useWriteContract(): UseWriteContractReturn;

// Hook to watch for events/logs emitted by a contract.
export declare function useWatchEvent(input: UseWatchEventInput): void;

// Hook to send a transaction (e.g., transfer, contract call).
export declare function useSendTransaction(): UseSendTransactionReturn;

// Hook to wait for a transaction to be confirmed on-chain.
export declare function useWaitForTransaction(input: UseWaitForTransactionInput): UseWaitForTransactionReturn;

// Types and utilities for keystore management (wallets, identities, lifecycle).
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

### Usage

```tsx
import { CfxProvider, useAccount, useNativeBalance } from '@cfxdevkit/react';

function App() {
  return (
    <CfxProvider client={client} signer={signer}>
      <AccountDisplay />
    </CfxProvider>
  );
}

function AccountDisplay() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useNativeBalance({ address });
  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance?.toString()}</p>
    </div>
  );
}
```

---

## `./account`

```ts
// Represents the current account state (address, status, etc.).
export interface UseAccountReturn {

// Hook to get the current account state (connected wallet info).
export declare function useAccount(): UseAccountReturn;
```

### Usage

```tsx
const { address, isConnected, status } = useAccount();
```

---

## `./balance`

```ts
// Input for fetching native (CFX) balance.
export interface UseNativeBalanceInput {

// Result of fetching native balance.
export interface UseNativeBalanceReturn {

// Input for fetching token balance.
export interface UseTokenBalanceInput {

// Result of fetching token balance.
export interface UseTokenBalanceReturn {

// Metadata for an ERC-20 token (name, symbol, decimals).
export interface TokenMetadata {

// Input for fetching token metadata.
export interface UseTokenMetadataInput {

// Result of fetching token metadata.
export interface UseTokenMetadataReturn {

// Hook to fetch native (CFX) balance for a given address.
export declare function useNativeBalance(input: UseNativeBalanceInput): UseNativeBalanceReturn;

// Hook to fetch ERC-20 token balance for a given address and token contract.
export declare function useTokenBalance(input: UseTokenBalanceInput): UseTokenBalanceReturn;

// Hook to fetch ERC-20 token metadata (name, symbol, decimals).
export declare function useTokenMetadata(input: UseTokenMetadataInput): UseTokenMetadataReturn;
```

### Usage

```tsx
const { data: balance } = useNativeBalance({ address: '0x...' });
const { data: tokenBalance } = useTokenBalance({ address: '0x...', token: '0x...' });
const { data: metadata } = useTokenMetadata({ token: '0x...' });
```

---

## `./context`

```ts
// Interface representing a wallet signer (e.g., MetaMask, Cobo Vault).
export interface Signer {

// Props for the `CfxProvider` component.
export interface CfxProviderProps {

// Provider component to inject CFX client, signer, and query client into React context.
export declare function CfxProvider({ client, signer, queryClient, children }: CfxProviderProps): import("react").JSX.Element;

// Hook to access the configured CFX client instance.
export declare function useClient(): Client;

// Hook to access the current chain configuration.
export declare function useChain(): ChainConfig;

// Hook to get the active signer (wallet connection).
export declare function useSigner(): Signer | null;
```

### Usage

```tsx
const client = useClient();
const chain = useChain();
const signer = useSigner();
```

---

## `./contract`

```ts
// Error type for contract-related failures.
export interface ContractError extends Error {

// Represents a read-only contract call (function name, args, etc.).
export interface ReadCall {

// Input for a write (state-changing) contract call.
export interface WriteInput {

// Input for `useReadContract`.
export interface UseReadContractInput {

// Return type for `useReadContract`.
export interface UseReadContractReturn<T> {

// Input for `useReadContracts`.
export interface UseReadContractsInput {

// Return type for `useReadContracts`.
export interface UseReadContractsReturn {

// Input for `useSimulateContract`.
export interface UseSimulateContractInput {

// Return type for `useSimulateContract`.
export interface UseSimulateContractReturn<T> {

// Return type for `useWriteContract`.
export interface UseWriteContractReturn {

// Hook to perform a read-only call on a contract.
export declare function useReadContract<T = unknown>(input: UseReadContractInput): UseReadContractReturn<T>;

// Hook to perform multiple read-only calls in one request.
export declare function useReadContracts(input: UseReadContractsInput): UseReadContractsReturn;

// Hook to simulate a contract write (gas estimation, validation).
export declare function useSimulateContract<T = unknown>(input: UseSimulateContractInput): UseSimulateContractReturn<T>;

// Hook to send a write transaction to a contract.
export declare function useWriteContract(): UseWriteContractReturn;
```

### Usage

```tsx
const { data: result } = useReadContract({
  address: '0x...',
  abi: [...],
  functionName: 'balanceOf',
  args: ['0x...'],
});
```

---

## `./events`

```ts
// Represents a log event emitted by a contract.
export interface WatchEventLog {

// Input for `useWatchEvent`.
export interface UseWatchEventInput {

// Hook to subscribe to contract events/logs in real time.
export declare function useWatchEvent(input: UseWatchEventInput): void;
```

### Usage

```tsx
useWatchEvent({
  address: '0x...',
  abi: [...],
  eventName: 'Transfer',
  onLogs: (logs) => console.log(logs),
});
```

---

## `./tx`

```ts
// Input for sending a transaction.
export interface SendTransactionInput {

// Result of sending a transaction (hash, etc.).
export interface SendTransactionResult {

// Return type for `useSendTransaction`.
export interface UseSendTransactionReturn {

// Input for `useWaitForTransaction`.
export interface UseWaitForTransactionInput {

// Return type for `useWaitForTransaction`.
export interface UseWaitForTransactionReturn {

// Hook to send a transaction (e.g., transfer, contract call).
export declare function useSendTransaction(): UseSendTransactionReturn;

// Hook to wait for a transaction to be confirmed on-chain.
export declare function useWaitForTransaction(input: UseWaitForTransactionInput): UseWaitForTransactionReturn;
```

### Usage

```tsx
const { sendTransaction } = useSendTransaction();
const { data: txHash } = await sendTransaction({ to: '0x...', value: 1e18 });

const { data: receipt } = useWaitForTransaction({ hash: txHash });
```

---

## `./keystore`

```ts
// Context value for keystore provider.
export { KeystoreContextValue }

// Props for `KeystoreProvider`.
export { KeystoreProviderProps }

// Provider component for keystore state.
export { KeystoreProvider }

// Enum for account types (e.g., hardware, mnemonic).
export { AccountType }

// Identity representation for dual-chain (Conflux eSpace & mainnet).
export { DualChainIdentity }

// Keystore account model.
export { KeystoreAccount }

// Result of keystore action (e.g., import, sign).
export { KeystoreActionResult }

// Active wallet model.
export { KeystoreActiveWallet }

// Input for adding a new wallet.
export { KeystoreAddWalletInput }

// Phase of keystore lifecycle (e.g., locked, unlocked).
export { KeystorePhase }

// Service interface for keystore operations.
export { KeystoreService }

// Status result for keystore operations.
export { KeystoreStatusResult }

// Wallet model in keystore.
export { KeystoreWallet }

// Mutation result for wallet operations.
export { KeystoreWalletMutationResult }

// Return type for `useKeystoreAccounts`.
export { UseKeystoreAccountsReturn }

// Hook to get list of accounts in keystore.
export { useKeystoreAccounts }

// Return type for `useKeystoreIdentity`.
export { UseKeystoreIdentityReturn }

// Hook to get identity (dual-chain address mapping).
export { useKeystoreIdentity }

// Return type for `useKeystoreLifecycle`.
export { UseKeystoreLifecycleReturn }

// Hook to check if keystore is active.
export { useIsKeystoreActive }

// Hook to check if keystore is blank (no wallets).
export { useIsKeystoreBlank }

// Hook to check if keystore is locked.
export { useIsKeystoredLocked }

// Hook to check if keystore is ready (unlocked & has wallets).
export { useIsKeystoreReady }

// Hook to manage keystore lifecycle (lock/unlock/import).
export { useKeystoreLifecycle }

// Return type for `useKeystoreWallets`.
export { UseKeystoreWalletsReturn }

// Hook to get list of wallets in keystore.
export { useKeystoreWallets }

// Props for account switcher UI component.
export { KeystoreAccountSwitcherProps }

// Props for identity display component.
export { KeystoreIdentityStripProps }

// Props for keystore shell (wrapper) component.
export { KeystoreShellProps }

// Props for wallet switcher UI component.
export { KeystoreWalletSwitcherProps }

// UI component to switch between accounts.
export { KeystoreAccountSwitcher }

// UI component to display identity (dual-chain addresses).
export { KeystoreIdentityStrip }

// UI component to wrap keystore UI.
export { KeystoreShell }

// UI component to switch between wallets.
export { KeystoreWalletSwitcher }
```

### Usage

```tsx
const { accounts } = useKeystoreAccounts();
const { activeWallet } = useKeystoreIdentity();
const { lock, unlock } = useKeystoreLifecycle();
```

<!-- api-hash: 7765cc787c30e4ee50320cf1185a47404e828be9c367f33bd013d418e84e5b1e -->
