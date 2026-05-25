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
| `matchers` | 2 matchers |

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
   * Optional: custom endpoint URL for the mock client.
   */
  endpoint?: string;
  /**
   * Optional: initial state or behavior overrides for the mock.
   */
  overrides?: Record<string, any>;
}

export interface DevNodeFixtureOptions {
  /**
   * Optional: path to a custom configuration file.
   */
  configPath?: string;
  /**
   * Optional: whether to start the node in dev mode.
   * @default false
   */
  devMode?: boolean;
  /**
   * Optional: additional environment variables to set.
   */
  env?: Record<string, string>;
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
     * @default 50
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

## `matchers`

```ts
export declare function toBeHexHash(received: unknown): {
  pass: boolean;
  message: () => string;
};

export declare function toBeHexAddress(received: unknown): {
  pass: boolean;
  message: () => string;
};
```

<!-- api-hash: b41cce8eec14b4ea7a2e98986506d1c60652d7d5a9bc9bba47410e46741178f6 -->

## Usage

```ts
import { createDeferred, waitFor, createMockClient } from '@cfxdevkit/testing';
import { toBeHexHash, toBeHexAddress } from '@cfxdevkit/testing/matchers';

expect.extend({ toBeHexHash, toBeHexAddress });

// Async coordination
const deferred = createDeferred<string>();
setTimeout(() => deferred.resolve('done'), 100);
await deferred.promise; // resolves after 100ms

// Mock client
const client = createMockClient({ endpoint: 'http://localhost:8080' });

// DevNode fixture
const fixture = await createDevNodeFixture({
  devMode: true,
  env: { DEBUG: '1' }
});

// Chain assertions
expect('0x1234...').toBeHexHash();
expect('0xabcdef...').toBeHexAddress();
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 1d614ae238e0643964e7713d61228953b5397b9ed0dbc256501c3503f7e67af4 -->
