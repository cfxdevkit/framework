# framework/react — Public API

> Thin React adapters over `framework/core`. **Hooks only**, no providers that
> hide state. State lives in TanStack Query + a tiny client context.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/react` | `<CfxProvider>` + `useClient` / `useChain` |
| `@cfxdevkit/react/account` | account hooks |
| `@cfxdevkit/react/contract` | contract read / write hooks |
| `@cfxdevkit/react/balance` | balance + token hooks |
| `@cfxdevkit/react/tx` | tx submission + wait hooks |
| `@cfxdevkit/react/events` | event subscription hooks |

---

## `react`

```
type CfxProviderProps = {
  client: Client                              // built by app, passed in
  signer?: Signer                             // optional; null = readonly
  queryClient?: QueryClient                   // injectable
  children: React.ReactNode
}

const CfxProvider: React.FC<CfxProviderProps>

function useClient(): Client
function useChain(): ChainConfig
function useSigner(): Signer | null           // null when readonly
```

Provider does **not** create the client. The app owns construction; the provider
distributes it. This makes SSR + tests trivial.

---

## `react/account`

```
function useAccount(): { address: Address | null; isConnected: boolean }
```

That's it. No "wallet" abstractions here — `wallet-connect` provides a connector
that calls `<CfxProvider signer=...>` with a fresh signer.

---

## `react/contract`

```
function useReadContract<T>(input: {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  blockTag?: BlockTag
  enabled?: boolean
  staleTimeMs?: DurationMs
}): { data: T | undefined; error: ContractError | null; isLoading: boolean; refetch: () => void }

function useReadContracts(input: { calls: readonly ReadCall[]; enabled?: boolean; staleTimeMs?: DurationMs }): { data: Array<{ status; result }> | undefined; error: ContractError | null; isLoading: boolean }

function useSimulateContract<T>(input: { address: Address; abi: Abi; functionName: string; args?: readonly unknown[]; value?: Wei; enabled?: boolean }): { data: { result: T; request: WriteInput<Abi, string> } | undefined; error: ContractError | null; isLoading: boolean }

function useWriteContract(): {
  writeAsync: (input: WriteInput<Abi, string>) => Promise<{ hash: Hash }>
  isPending: boolean
  error: ContractError | null
  reset: () => void
}
```

Each hook is a thin wrapper over the matching `core/contract` function.

---

## `react/balance`

```
function useNativeBalance(input?: { address?: Address; enabled?: boolean }): { data: Wei | undefined; isLoading: boolean; error: RpcError | null }
function useTokenBalance(input: { token: Address; address?: Address; enabled?: boolean }): { data: Wei | undefined; isLoading: boolean; error: ContractError | null }
function useTokenMetadata(input: { token: Address }): { data: { symbol: string; name: string; decimals: number } | undefined; isLoading: boolean }
```

---

## `react/tx`

```
function useWaitForTransaction(input: { hash: Hash | undefined; confirmations?: number; timeoutMs?: DurationMs }): { data: TxReceipt | undefined; isLoading: boolean; error: RpcError | null }
function useSendTransaction(): { sendAsync: (tx: SignableTx) => Promise<{ hash: Hash }>; isPending: boolean; error: RpcError | null }
```

---

## `react/events`

```
function useWatchEvent(input: { address?: Address | Address[]; abi: Abi; eventName: string; enabled?: boolean }): { events: DecodedEvent[]; clear: () => void }
```

Internally subscribes via `core/contract.watchEvent`; cancelled on unmount.

---

## Anti-goals

- ❌ Wallet connection UI / modal (lives in `framework/wallet-connect`).
- ❌ Theming (lives in `framework/theme`).
- ❌ Pre-built DeFi widgets (lives in `framework/defi-react`).
