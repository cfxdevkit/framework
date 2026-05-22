# @cfxdevkit/testing

**Scope:** Shared test utilities used by every package and project. **Test-only.**

**Responsibilities**
- Mock chain client (`createMockClient`)
- Contract test fixtures via `createDevNodeFixture`
- Integration helpers wrapping `framework/devnode`
- Vitest matchers for chain assertions (e.g., `toBeHexHash`, `toBeHexAddress`)
- Utilities for async coordination (`createDeferred`, `waitFor`)

Dev-dependency only.

## Planned Mock Inventory

This package is the home for reusable test doubles shared across backend logic packages. Add these before automation, protocol consumers, and MCP tools grow their own local mocks:

- `MockJobRepository implements JobRepository` for deterministic automation job tests.
- `MockExecutionRepository implements ExecutionRepository` for execution audit tests.
- `MockKeeperClient implements KeeperClient` with configurable success and error responses.
- `MockPriceSource implements PriceSource` keyed by token pair.
- `jobFactory(type, overrides?)` and `strategyFactory(type, overrides?)` for valid automation fixtures.
- Vitest matchers such as `toBeHexHash()` and `toBeHexAddress()`.

When these land, add `@cfxdevkit/automation` as a test-facing dependency or peer so runtime packages can import only the mocks they need.

## Install

```bash
pnpm add -D @cfxdevkit/testing
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 8 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/testing";

export interface Deferred<T> {
  resolve(value: T | PromiseLike<T>): void;
  reject(reason?: any): void;
  promise: Promise<T>;
}

export interface MockClientOptions {
  /**
   * Whether the mock client should start in a connected state.
   * @default true
   */
  connected?: boolean;
  /**
   * Optional initial state for the client's connection status.
   */
  initialState?: Partial<Client>;
}

export interface DevNodeFixtureOptions {
  /**
   * Path to the DevNode binary to use.
   * Falls back to `framework/devnode` if omitted.
   */
  binaryPath?: string;
  /**
   * Additional arguments to pass to the DevNode process.
   */
  args?: string[];
  /**
   * Timeout (in ms) for DevNode startup.
   * @default 10_000
   */
  startupTimeout?: number;
}

export declare function createDeferred<T>(): Deferred<T>;

export declare function waitFor(
  assertion: () => boolean | Promise<boolean>,
  options?: {
    /**
     * Maximum time (in ms) to wait for the assertion to pass.
     * @default 5_000
     */
    timeout?: number;
    /**
     * Interval (in ms) between assertion checks.
     * @default 100
     */
    interval?: number;
  }
): Promise<void>;

export declare function createMockClient(
  options?: MockClientOptions
): Client;

export declare function createDevNodeFixture(
  options?: DevNodeFixtureOptions
): Promise<DevNode>;
```

<!-- api-hash: 29284415d11ad06fa4dd06dc8a94a3c830ded2bed819425d90049a021418a32a -->

## Usage

```ts
import { createMockClient, createDeferred, waitFor } from '@cfxdevkit/testing';

// Async coordination
const deferred = createDeferred<string>();
setTimeout(() => deferred.resolve('done'), 100);
await deferred.promise; // resolves after 100ms

// Mock client
const client = createMockClient({ connected: true });
await waitFor(() => client.isConnected);

// DevNode fixture
const fixture = await createDevNodeFixture({
  binaryPath: '/path/to/devnode',
  args: ['--dev'],
  startupTimeout: 15_000
});
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 5885fdf54b22f2d041c527841abe34dd297c864879cb162c607bb1f622f9aa07 -->
