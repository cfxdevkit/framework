# @cfxdevkit/wallet-connect — Public API

> Browser wallet connector + UI primitives. Headless logic + opt-in components.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/wallet-connect/connectors` | `Connector` interface + impls |
| `@cfxdevkit/wallet-connect/react` | hooks: `useConnect`, `useDisconnect`, `useConnectors` |
| `@cfxdevkit/wallet-connect/ui` | unstyled headless components (compose with `theme`) |

---

## `wallet-connect/connectors`

```
type Connector = {
  readonly id: string                  // 'fluent', 'metamask', 'walletconnect', 'injected'
  readonly name: string
  readonly icon?: string

  isAvailable(): boolean               // sync check (e.g. window.fluent exists)
  connect(opts?: { chainId?: ChainId; signal?: AbortSignal }): Promise<{ signer: Signer; chain: ChainConfig }>
  disconnect(): Promise<void>
  switchChain(chainId: ChainId, opts?: { signal?: AbortSignal }): Promise<void>
  on(event: 'accountsChanged' | 'chainChanged' | 'disconnect', listener: (payload: unknown) => void): () => void
}

function fluentConnector(opts?: { rdns?: string }): Connector
function metamaskConnector(opts?: { rdns?: string }): Connector
function injectedConnector(opts?: { id: string; name: string; rdns?: string }): Connector
function walletConnectConnector(opts: { projectId: string; metadata: { name: string; url: string; description?: string; icons?: string[] } }): Connector
```

### Errors
`WalletError` codes:
- `core/wallet/sign-rejected`              — user rejected
- `wallet-connect/connector/unavailable`
- `wallet-connect/chain/unsupported`

---

## `wallet-connect/react`

```
function useConnectors(): readonly Connector[]
function useConnect(): { connectAsync: (c: Connector) => Promise<void>; isPending: boolean; error: WalletError | null }
function useDisconnect(): { disconnect: () => Promise<void> }
function useActiveConnector(): Connector | null
```

`connectAsync` updates the parent `<CfxProvider signer=...>` via an internal store
exposed only through these hooks. No direct setter is public.

---

## `wallet-connect/ui`

Unstyled headless. Each component takes `className` and exposes data attributes
for `theme` to target.

```
const ConnectButton: React.FC<{ onSelect?: (c: Connector) => void; children?: React.ReactNode }>
const ConnectorList: React.FC<{ render: (c: Connector) => React.ReactNode }>
const AccountBadge: React.FC<{ render?: (a: { address: Address; ensName?: string }) => React.ReactNode }>
```

No CSS bundled. No assumptions about icons.
