# framework/contracts — Public API

> Standard Conflux/eSpace contract bindings. Generated, but the public surface is
> hand-curated and stable.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/contracts/erc20` | ERC-20 read/write helpers |
| `@cfxdevkit/contracts/erc721` | ERC-721 helpers |
| `@cfxdevkit/contracts/erc1155` | ERC-1155 helpers |
| `@cfxdevkit/contracts/multicall3` | Multicall3 ABI + address per chain |
| `@cfxdevkit/contracts/internal-contracts` | Conflux Core space precompiles (Sponsor, Staking, …) |
| `@cfxdevkit/contracts/registry` | named-deployment lookup |

Each helper module follows the same shape:

---

## Standard helper shape (illustrated for `erc20`)

```
const erc20Abi: Abi          // re-exported from core/abi for convenience

// Reads
function balanceOf(input: { client: Client; token: Address; owner: Address; blockTag?: BlockTag; signal?: AbortSignal }): Promise<Wei>
function allowance(input: { client: Client; token: Address; owner: Address; spender: Address; signal?: AbortSignal }): Promise<Wei>
function totalSupply(input: { client: Client; token: Address; signal?: AbortSignal }): Promise<Wei>
function metadata(input: { client: Client; token: Address; signal?: AbortSignal }): Promise<{ symbol: string; name: string; decimals: number }>

// Writes
function transfer(input: { client: Client; signer: Signer; token: Address; to: Address; amount: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function approve(input: { client: Client; signer: Signer; token: Address; spender: Address; amount: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>

// Events
function watchTransfers(input: { client: Client; token: Address; from?: Address; to?: Address; signal?: AbortSignal }): AsyncIterable<{ from: Address; to: Address; value: Wei; log: RawLog }>
```

Same layout for ERC-721 / ERC-1155 — one verb per function, `input` object, async,
takes `signal`, throws `ContractError`.

---

## `contracts/multicall3`

```
const multicall3Address: Record<ChainId, Address>      // chain → address
const multicall3Abi: Abi
```

Pure data.

---

## `contracts/internal-contracts`

Conflux Core space precompiles. Each module is feature-scoped:

- `sponsor` — set/clear/view sponsor data
- `staking` — deposit, withdraw, vote-power
- `cross-space` — eSpace ↔ Core asset bridge calls
- `params-control` — DAO-style parameter governance reads

Each module follows the `erc20` shape: small functions, one verb each.

---

## `contracts/registry`

```
type Deployment = { chainId: ChainId; name: string; address: Address; deployedAt: Timestamp; deployer?: Address }

function createRegistry(opts: { source: 'file' | 'memory'; path?: string }): {
  get(input: { chainId: ChainId; name: string }): Deployment | null
  list(chainId?: ChainId): readonly Deployment[]
  upsert(d: Deployment): Promise<void>             // file source only
}
```

Replaces ad-hoc `deployments.json` patterns from the legacy repos.
