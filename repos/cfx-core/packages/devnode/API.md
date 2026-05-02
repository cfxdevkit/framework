# framework/devnode — Public API

> Local Conflux dev node. One process per `Node`. Lifecycle is explicit and managed via `createNode` and `stop`.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/devnode` | `createNode`, lifecycle |
| `@cfxdevkit/devnode/funded` | pre-funded test accounts |
| `@cfxdevkit/devnode/snapshot` | snapshot / restore |
| `@cfxdevkit/devnode/errors` | `NodeError` |

---

## `devnode`

```
type NodeOptions = {
  binary?: string                  // path or download
  dataDir?: string                 // default: tmpdir, removed on stop
  rpcPort?: number                 // default: random
  wsPort?: number                  // default: random
  chainId?: ChainId
  blockTimeMs?: number             // default 1000
  preFundedAccounts?: number       // default 10
  log?: (line: string) => void     // injectable
}

type Node = {
  readonly chain: ChainConfig
  readonly rpcUrl: string
  readonly wsUrl: string
  readonly accounts: readonly { address: Address; privateKey: Hex }[]
  isRunning(): boolean
  stop(opts?: { signal?: AbortSignal }): Promise<void>
}

function createNode(opts?: NodeOptions): Promise<Node>
```

### Errors
`NodeError` codes: `devnode/{start-failed,port-in-use,crashed,binary-not-found}`.

---

## `devnode/funded`

```
function fundAccount(input: { node: Node; to: Address; amount: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function fundAccounts(input: { node: Node; accounts: readonly { to: Address; amount: Wei }[]; signal?: AbortSignal }): Promise<{ hash: Hash }>
```

---

## `devnode/snapshot`

```
function snapshot(node: Node, opts?: { signal?: AbortSignal }): Promise<{ id: string }>
function revert(node: Node, snapshotId: string, opts?: { signal?: AbortSignal }): Promise<void>
function mineBlocks(node: Node, n: number, opts?: { signal?: AbortSignal }): Promise<void>
function setBlockTime(node: Node, ms: DurationMs): Promise<void>
```

Mirrors anvil/hardhat semantics for compatibility with existing test fixtures.
