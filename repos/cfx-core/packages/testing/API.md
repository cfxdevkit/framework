# `@cfxdevkit/testing` — Public API

> Shared test fixtures and matchers.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 8 symbols |

---

## `.`

### Usage

```ts
import { createMockClient, waitFor } from '@cfxdevkit/testing';

const client = createMockClient();
await waitFor(() => client.isConnected);
```

```ts
// The name of the package.
export declare const __packageName: "@cfxdevkit/testing";

// A container for a value that will be resolved in the future.
export interface Deferred<T> {
  // A promise that resolves with the deferred value.
  promise: Promise<T>;
  // Resolves the deferred promise with the given value.
  resolve(value: T): void;
  // Rejects the deferred promise with the given error.
  reject(reason?: any): void;
}

// Configuration options for the mock client.
export interface MockClientOptions {
  // Whether the mock client should start in a connected state.
  connected?: boolean;
  // Optional initial state for the client's connection status.
  initialState?: Partial<Client>;
}

// Configuration options for the DevNode fixture.
export interface DevNodeFixtureOptions {
  // Path to the DevNode binary to use.
  binaryPath?: string;
  // Additional arguments to pass to the DevNode process.
  args?: string[];
  // Timeout (in ms) for DevNode startup.
  startupTimeout?: number;
}

// Creates a new deferred object.
export declare function createDeferred<T>(): Deferred<T>;

// Polls an assertion until it returns true or the timeout is reached.
export declare function waitFor(
  assertion: () => boolean | Promise<boolean>,
  options?: {
    // Maximum time (in ms) to wait for the assertion to pass.
    timeout?: number;
    // Interval (in ms) between assertion checks.
    interval?: number;
  }
): Promise<void>;

// Creates a mock client for testing purposes.
export declare function createMockClient(
  options?: MockClientOptions
): Client;

// Creates a DevNode fixture for integration testing.
export declare function createDevNodeFixture(
  options?: DevNodeFixtureOptions
): Promise<DevNode>;
```

<!-- api-hash: 7c75dc1a5049ce3ce02313f28a94957c8fec2099d6daafdec297db0cb634beee -->
