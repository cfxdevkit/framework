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

### Usage

```ts
const { address } = useAccount();
const balance = useNativeBalance({ chainId: 1 });
```

```ts
// Package name identifier for internal tooling and telemetry.
export declare const __packageName: "@cfxdevkit/react";
// Return type for the `useAccount` hook, containing the connected wallet address.
export interface UseAccountReturn {
  address: string | null;
}
// Input type for `useNativeBalance`, specifying chain and optional account.
export interface UseNativeBalanceInput {
  chainId: number;
  account?: string;
}
// Return type for `useNativeBalance`, containing balance and loading/error state.
export interface UseNativeBalanceReturn {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
}
// Input type for `useTokenBalance`, specifying chain, token address, and optional account.
export interface UseTokenBalanceInput {
  chainId: number;
  tokenAddress: string;
  account?: string;
}
// Return type for `useTokenBalance`, containing token balance and loading/error state.
export interface UseTokenBalanceReturn {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
}
// Metadata for an ERC20-like token, including name, symbol, and decimals.
export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}
// Input type for `useTokenMetadata`, specifying chain and token address.
export interface UseTokenMetadataInput {
  chainId: number;
  tokenAddress: string;
}
// Return type for `useTokenMetadata`, containing token metadata and loading/error state.
export interface UseTokenMetadataReturn {
  data: TokenMetadata | null;
  isLoading: boolean;
  error: Error | null;
}
// Hook to fetch native (e.g., CFX) token balance for a given account and chain.
export declare function useNativeBalance(input: UseNativeBalanceInput): UseNativeBalanceReturn;
// Hook to fetch ERC20-like token balance for a given account, token, and chain.
export declare function useTokenBalance(input: UseTokenBalanceInput): UseTokenBalanceReturn;
// Hook to fetch metadata (name, symbol, decimals) for a given token.
export declare function useTokenMetadata(input: UseTokenMetadataInput): UseTokenMetadataReturn;
```

---

## `./account`

### Usage

```ts
const { address } = useAccount();
```

```ts
// Return type for the `useAccount` hook, containing the connected wallet address.
export interface UseAccountReturn {
  address: string | null;
}
```

---

## `./balance`

### Usage

```ts
const balance = useNativeBalance({ chainId: 1 });
const tokenBalance = useTokenBalance({ chainId: 1, tokenAddress: '0x...' });
```

```ts
// Input type for `useNativeBalance`, specifying chain and optional account.
export interface UseNativeBalanceInput {
  chainId: number;
  account?: string;
}
// Return type for `useNativeBalance`, containing balance and loading/error state.
export interface UseNativeBalanceReturn {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
}
// Input type for `useTokenBalance`, specifying chain, token address, and optional account.
export interface UseTokenBalanceInput {
  chainId: number;
  tokenAddress: string;
  account?: string;
}
// Return type for `useTokenBalance`, containing token balance and loading/error state.
export interface UseTokenBalanceReturn {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
}
// Metadata for an ERC20-like token, including name, symbol, and decimals.
export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}
// Input type for `useTokenMetadata`, specifying chain and token address.
export interface UseTokenMetadataInput {
  chainId: number;
  tokenAddress: string;
}
// Return type for `useTokenMetadata`, containing token metadata and loading/error state.
export interface UseTokenMetadataReturn {
  data: TokenMetadata | null;
  isLoading: boolean;
  error: Error | null;
}
// Hook to fetch native (e.g., CFX) token balance for a given account and chain.
export declare function useNativeBalance(input: UseNativeBalanceInput): UseNativeBalanceReturn;
// Hook to fetch ERC20-like token balance for a given account, token, and chain.
export declare function useTokenBalance(input: UseTokenBalanceInput): UseTokenBalanceReturn;
// Hook to fetch metadata (name, symbol, decimals) for a given token.
export declare function useTokenMetadata(input: UseTokenMetadataInput): UseTokenMetadataReturn;
```

---

## `./context`

### Usage

```ts
<CfxProvider client={client} signer={signer}>
  <App />
</CfxProvider>
```

```ts
// Interface representing a wallet signer capable of signing transactions and messages.
export interface Signer {
  address: string;
  signMessage(message: string): Promise<string>;
  signTransaction(transaction: any): Promise<string>;
}
// Props for the `CfxProvider` component, enabling dependency injection of client, signer, and query client.
export interface CfxProviderProps {
  client: Client;
  signer?: Signer;
  queryClient?: QueryClient;
  children: React.ReactNode;
}
// React context provider that injects CFX client, signer, and query client into the component tree.
export declare function CfxProvider({ client, signer, queryClient, children }: CfxProviderProps): import("react/jsx-runtime").JSX.Element;
// Hook to access the injected CFX client instance from context.
export declare function useClient(): Client;
// Hook to access the current chain configuration from context.
export declare function useChain(): ChainConfig;
// Hook to access the current signer (wallet) instance from context, or `null` if not connected.
export declare function useSigner(): Signer | null;
```

---

## `./contract`

### Usage

```ts
const { data } = useReadContract({ chainId: 1, contractAddress: '0x...', functionName: 'getBalance' });
const { write } = useWriteContract();
```

```ts
// Custom error type for contract-related failures, including revert reason and transaction hash.
export interface ContractError extends Error {
  reason?: string;
  hash?: string;
}
// Internal representation of a read call (e.g., static call) to a contract function.
export interface ReadCall {
  to: string;
  data: string;
}
// Input type for a write contract operation (e.g., transaction).
export interface WriteInput {
  to: string;
  data: string;
  value?: string;
}
// Input type for `useReadContract`, specifying chain, contract address, function name, and args.
export interface UseReadContractInput {
  chainId: number;
  contractAddress: string;
  functionName: string;
  args?: any[];
}
// Return type for `useReadContract`, containing result data and loading/error state.
export interface UseReadContractReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: ContractError | null;
}
// Input type for `useReadContracts`, supporting batched read calls.
export interface UseReadContractsInput {
  chainId: number;
  calls: ReadCall[];
}
// Return type for `useReadContracts`, containing array of results and loading/error state.
export interface UseReadContractsReturn {
  data: any[] | null;
  isLoading: boolean;
  error: ContractError | null;
}
// Input type for `useSimulateContract`, used to preview a write operation without sending.
export interface UseSimulateContractInput {
  chainId: number;
  contractAddress: string;
  functionName: string;
  args?: any[];
  value?: string;
}
// Return type for `useSimulateContract`, containing simulation result and loading/error state.
export interface UseSimulateContractReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: ContractError | null;
}
// Return type for `useWriteContract`, exposing `write` function and loading/error state.
export interface UseWriteContractReturn {
  write: (input: WriteInput) => Promise<string>;
  isLoading: boolean;
  error: ContractError | null;
}
// Hook to perform a read-only call to a smart contract function.
export declare function useReadContract<T = unknown>(input: UseReadContractInput): UseReadContractReturn<T>;
// Hook to perform multiple read-only calls in a single request.
export declare function useReadContracts(input: UseReadContractsInput): UseReadContractsReturn;
// Hook to simulate a contract write operation before sending.
export declare function useSimulateContract<T = unknown>(input: UseSimulateContractInput): UseSimulateContractReturn<T>;
// Hook to prepare and send a write (transaction) to a smart contract.
export declare function useWriteContract(): UseWriteContractReturn;
```

---

## `./events`

### Usage

```ts
useWatchEvent({ chainId: 1, contractAddress: '0x...', eventName: 'Transfer' });
```

```ts
// Log entry returned by `useWatchEvent`, containing event data and metadata.
export interface WatchEventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
}
// Input type for `useWatchEvent`, specifying chain, contract address, and event name.
export interface UseWatchEventInput {
  chainId: number;
  contractAddress: string;
  eventName: string;
}
// Hook to subscribe to and receive real-time event logs for a given contract and event name.
export declare function useWatchEvent(input: UseWatchEventInput): void;
```

---

## `./tx`

### Usage

```ts
const { send } = useSendTransaction();
const { isWaiting } = useWaitForTransaction({ hash: '0x...' });
```

```ts
// Input type for `useSendTransaction`, specifying transaction parameters.
export interface SendTransactionInput {
  to: string;
  data?: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
}
// Result returned after sending a transaction, including hash and status.
export interface SendTransactionResult {
  hash: string;
  status: 'sent' | 'confirmed' | 'failed';
}
// Return type for `useSendTransaction`, exposing `send` function and loading/error state.
export interface UseSendTransactionReturn {
  send: (input: SendTransactionInput) => Promise<SendTransactionResult>;
  isLoading: boolean;
  error: Error | null;
}
// Input type for `useWaitForTransaction`, specifying transaction hash and optional timeout.
export interface UseWaitForTransactionInput {
  hash: string;
  timeout?: number;
}
// Return type for `useWaitForTransaction`, indicating confirmation status and loading/error state.
export interface UseWaitForTransactionReturn {
  isWaiting: boolean;
  isSuccess: boolean;
  error: Error | null;
}
// Hook to send a transaction and await its confirmation.
export declare function useSendTransaction(): UseSendTransactionReturn;
// Hook to wait for a transaction to be confirmed on-chain.
export declare function useWaitForTransaction(input: UseWaitForTransactionInput): UseWaitForTransactionReturn;
```

---

## `./keystore`

### Usage

```ts
<KeystoreShell />
```

```ts
// Context value type for keystore state and operations.
export { KeystoreContextValue }
// Props for the `KeystoreProvider` component.
export { KeystoreProviderProps }
// React context provider for keystore state and services.
export { KeystoreProvider }
// Enum representing types of accounts (e.g., hardware, mnemonic, imported).
export { AccountType }
// Type representing a dual-chain identity (Conflux eSpace and mainnet).
export { DualChainIdentity }
// Type representing a keystore-managed account.
export { KeystoreAccount }
// Result type for keystore actions (e.g., import, unlock).
export { KeystoreActionResult }
// Type representing the currently active wallet in keystore.
export { KeystoreActiveWallet }
// Input type for adding a new wallet to keystore.
export { KeystoreAddWalletInput }
// Enum representing keystore lifecycle phases (e.g., locked, unlocked, ready).
export { KeystorePhase }
// Service interface for keystore operations (e.g., unlock, import, sign).
export { KeystoreService }
// Result type for keystore status queries.
export { KeystoreStatusResult }
// Type representing a keystore wallet (metadata + accounts).
export { KeystoreWallet }
// Result type for wallet mutations (e.g., rename, delete).
export { KeystoreWalletMutationResult }
// Return type for `useKeystoreAccounts`.
export { UseKeystoreAccountsReturn }
// Hook to retrieve all accounts managed by keystore.
export { useKeystoreAccounts }
// Return type for `useKeystoreIdentity`.
export { UseKeystoreIdentityReturn }
// Hook to retrieve the current dual-chain identity.
export { useKeystoreIdentity }
// Return type for `useKeystoreLifecycle`.
export { UseKeystoreLifecycleReturn }
// Hook to check if keystore is active (i.e., initialized).
export { useIsKeystoreActive }
// Hook to check if keystore is blank (i.e., no wallets).
export { useIsKeystoreBlank }
// Hook to check if keystore is locked.
export { useIsKeystoredLocked }
// Hook to check if keystore is ready (unlocked and initialized).
export { useIsKeystoreReady }
// Hook to subscribe to keystore lifecycle events.
export { useKeystoreLifecycle }
// Return type for `useKeystoreWallets`.
export { UseKeystoreWalletsReturn }
// Hook to retrieve all wallets managed by keystore.
export { useKeystoreWallets }
// Props for the `KeystoreAccountSwitcher` component.
export { KeystoreAccountSwitcherProps }
// Props for the `KeystoreIdentityStrip` component.
export { KeystoreIdentityStripProps }
// Props for the `KeystoreShell` component.
export { KeystoreShellProps }
// Props for the `KeystoreWalletSwitcher` component.
export { KeystoreWalletSwitcherProps }
// UI component to switch between accounts.
export { KeystoreAccountSwitcher }
// UI component to display and switch dual-chain identities.
export { KeystoreIdentityStrip }
// Main UI shell for keystore integration (includes wallet management, unlock, etc.).
export { KeystoreShell }
// UI component to switch between wallets.
export { KeystoreWalletSwitcher }
```

<!-- api-hash: cb84b9888b942908683ef2f0682b1a62916507fa17141e5dd786ce71b686b296 -->
