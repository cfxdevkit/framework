# `@cfxdevkit/testing` — API Reference

> Shared test utilities. **Test-only.** Import only from `*.test.ts` files.
> Never imported in production/runtime code.

## Exports

```ts
// Deferred promise (resolve/reject from outside)
function createDeferred<T>(): Deferred<T>
interface Deferred<T> {
  promise: Promise<T>
  resolve(value: T | PromiseLike<T>): void
  reject(error: unknown): void
}

// Poll until assertion returns true
async function waitFor(
  assertion: () => boolean | Promise<boolean>,
  options?: { timeoutMs?: number; intervalMs?: number },  // defaults: 1000 ms / 25 ms
): Promise<void>

// In-memory mock client (eSpace or Core Space)
function createMockClient(options?: MockClientOptions): Client
interface MockClientOptions {
  family?: 'core' | 'espace'    // default 'espace'
  chainId?: number
  receipts?: Map<string, TxReceipt | null>
  logs?: CoreLog[]
  request?: (method: string, params: readonly unknown[]) => unknown | Promise<unknown>
}

// Disposable devnode (does NOT auto-start by default)
async function createDevNodeFixture(options?: DevNodeFixtureOptions): Promise<DevNode>
interface DevNodeFixtureOptions {
  mnemonic?: string
  dataDir?: string
  accounts?: number
  logging?: boolean
  autoStart?: boolean   // default false — call node.start() in beforeAll if needed
}
```

## Usage

```ts
import { createDeferred, waitFor, createMockClient, createDevNodeFixture } from '@cfxdevkit/testing';

// Deferred
const deferred = createDeferred<string>();
deferred.resolve('hello');
await expect(deferred.promise).resolves.toBe('hello');

// Poll
let ready = false;
setTimeout(() => { ready = true; }, 50);
await waitFor(() => ready, { intervalMs: 5 });

// Mock client
const client = createMockClient({
  receipts: new Map([['0xabc', { status: 'success' }]]),
});
const r = await client.getTransactionReceipt('0xabc');

// Devnode fixture with auto-start
const node = await createDevNodeFixture({ autoStart: true });
// ... tests ...
await node.stop();
```

## Notes

- `createMockClient` creates a fully typed `Client` that satisfies both eSpace and Core Space interfaces.
- `waitFor` throws `Error('condition was not met within Nms')` after the timeout.
- `createDevNodeFixture` wraps `createDevNode` from `@cfxdevkit/devnode`. Use `autoStart: true` for
  integration tests that need a real node, or leave it off and call `node.start()` in `beforeAll`.

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
