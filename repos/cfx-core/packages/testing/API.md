# @cfxdevkit/testing — Public API

> Shared fixtures + helpers. **Test-only.** Imported only from `*.test.ts` and
> `test/integration/`. Production builds tree-shake away.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/testing/fixtures` | reusable fixtures (devnode, accounts, deployed contracts) |
| `@cfxdevkit/testing/matchers` | vitest custom matchers |
| `@cfxdevkit/testing/random` | deterministic random helpers |
| `@cfxdevkit/testing/clock` | controllable clock |
| `@cfxdevkit/testing/snapshots` | chain snapshot helpers |

---

## `testing/fixtures`

```
type DevWorld = {
  node: Node
  client: Client
  funded: readonly { signer: Signer; address: Address }[]
  stop(): Promise<void>
}

function createDevWorld(opts?: { fundedAccounts?: number; chainId?: ChainId; seed?: string }): Promise<DevWorld>

type Erc20Fixture = { token: Address; mint: (to: Address, amount: Wei) => Promise<Hash> }
function deployErc20(input: { client: Client; signer: Signer; name?: string; symbol?: string; decimals?: number }): Promise<Erc20Fixture>
```

`createDevWorld` is the single entry for an integration test. Returns a working
node + client + accounts. `await world.stop()` in `afterEach`.

---

## `testing/matchers`

```
expect(receipt).toBeMined()
expect(receipt).toEmitEvent({ abi, name, args? })
expect(call).toRevertWithCode('core/contract/revert')
expect(addr).toBeAddress()
expect(amount).toEqualWei('1.234', 18)
```

Auto-registered when imported once: `import '@cfxdevkit/testing/matchers'`.

---

## `testing/random`

```
function seedRandom(seed: string): { next(): number; address(): Address; hex(n: number): Hex }
```

Pure deterministic generator. Same `seed` → same outputs across runs.

---

## `testing/clock`

```
type FakeClock = (() => Timestamp) & {
  set(at: Timestamp): void
  advance(ms: DurationMs): void
}

function createFakeClock(start: Timestamp): FakeClock
```

Pass to any framework function that accepts `clock`.

---

## `testing/snapshots`

Re-exports `devnode/snapshot` helpers + provides Vitest hooks:

```
function withSnapshot(node: Node): { beforeEach: () => Promise<void>; afterEach: () => Promise<void> }
```

Resets the chain to a snapshot between tests automatically.
