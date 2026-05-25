# @cfxdevkit/react

**Scope:** Headless React hooks and components built on top of `@cfxdevkit/cdk`.

**Responsibilities**
- High-level React hooks for account, balance, contract interaction, transactions, and events
- Built on React Query for caching, background updates, and state management
- Fully headless — no styling assumptions or UI dependencies

**Dependencies**
- `@cfxdevkit/cdk` (required)
- `@tanstack/react-query` (required peer)
- `@cfxdevkit/wallet-connect` (optional peer — enables wallet-aware hooks)

---

## Installation

```bash
npm install @cfxdevkit/react @tanstack/react-query
# Optional: for wallet integration
npm install @cfxdevkit/wallet-connect
```

---

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

## Core Hooks

### `useAccount()`
Returns the currently connected account.

```ts
const { address, chainId, status } = useAccount();
```

### `useNativeBalance(input)`
Reads the native token balance of an account.

```ts
const { data: balance, isLoading, error } = useNativeBalance({ chainId, account });
```

### `useTokenBalance(input)`
Reads the ERC-20 token balance of an account.

```ts
const { data: balance, isLoading, error } = useTokenBalance({
  chainId,
  tokenAddress,
  account,
});
```

### `useTokenMetadata(input)`
Fetches metadata (name, symbol, decimals) for a token.

```ts
const { data: metadata, isLoading, error } = useTokenMetadata({
  chainId,
  tokenAddress,
});
```

### `useReadContract<T>(input)`
Performs a read-only call to a contract.

```ts
const { data, isLoading, error } = useReadContract({
  abi,
  address,
  functionName,
  args,
});
```

### `useReadContracts(input)`
Batch read calls to multiple contracts/functions.

```ts
const { data, isLoading, error } = useReadContracts({
  contracts: [
    { abi, address, functionName, args },
    // ...
  ],
});
```

### `useSimulateContract<T>(input)`
Simulates a contract call without submitting a transaction.

```ts
const { data: result, isLoading, error } = useSimulateContract({
  abi,
  address,
  functionName,
  args,
  value,
});
```

### `useWriteContract()`
Returns helpers to prepare and send write transactions.

```ts
const { writeContract, isPending, error, data } = useWriteContract();

writeContract({
  abi,
  address,
  functionName,
  args,
  value,
});
```

### `useSendTransaction()`
Sends a raw transaction.

```ts
const { sendTransaction, isPending, error, data } = useSendTransaction();

sendTransaction({
  to,
  value,
  data,
});
```

### `useWaitForTransaction(input)`
Waits for a transaction to be confirmed.

```ts
const { data, isLoading, error } = useWaitForTransaction({
  hash,
});
```

### `useWatchEvent(input)`
Watches for contract events in real time.

```ts
useWatchEvent({
  abi,
  address,
  eventName,
  onLogs: (logs) => console.log(logs),
});
```

---

## Context & Providers

### `CfxProvider`
Wraps your app to provide client, signer, and React Query context.

```tsx
import { CfxProvider } from '@cfxdevkit/react';
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();

<CfxProvider
  client={client}
  signer={signer}
  queryClient={queryClient}
>
  <App />
</CfxProvider>
```

### `useClient()`, `useChain()`, `useSigner()`
Access the configured client, chain config, and signer.

```ts
const client = useClient();
const chain = useChain();
const signer = useSigner();
```

---

## Keystore Hooks (Optional)

> Requires `@cfxdevkit/wallet-connect` or local keystore support.

### `useKeystoreLifecycle()`
Manages keystore wallet lifecycle (add, unlock, sign, etc.).

```ts
const { wallets, addWallet, unlockWallet, signMessage } = useKeystoreLifecycle();
```

See `./keystore` exports for full list of types and utilities.

--- 

## Notes
- All hooks integrate with React Query for automatic caching and refetching.
- Hooks are typed end-to-end — full TypeScript support.
- No UI assumptions — designed for composability with any UI library.

## Usage

```typescript
import { useAccount, useNativeBalance } from '@cfxdevkit/react';

function AccountBalance() {
  const { address } = useAccount();
  const { data: balance, isLoading, error } = useNativeBalance({ chainId: 1, account: address });

  if (isLoading) return <span>Loading…</span>;
  if (error) return <span>Error: {error.message}</span>;
  return <span>Balance: {balance?.toString()}</span>;
}
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 177b3bfd56a7408f17c82d2e33688f71c4b09afd4126916280d6fb25dd616378 -->
