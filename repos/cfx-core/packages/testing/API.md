# `@cfxdevkit/testing` — Public API

> Shared test fixtures and matchers.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 8 symbols |

---

## `.`

```ts
// The package name constant for `@cfxdevkit/testing`.
export declare const __packageName: "@cfxdevkit/testing";

// Represents a deferred value that can be resolved or rejected later.
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

// Configuration options for creating a mock client.
export interface MockClientOptions {
  // Optional: custom endpoint URL for the mock client.
  endpoint?: string;
  // Optional: initial state or behavior overrides for the mock.
  overrides?: Record<string, any>;
}

// Configuration options for creating a development node fixture.
export interface DevNodeFixtureOptions {
  // Optional: path to a custom configuration file.
  configPath?: string;
  // Optional: whether to start the node in dev mode.
  devMode?: boolean;
  // Optional: additional environment variables to set.
  env?: Record<string, string>;
}

// Creates and returns a new `Deferred<T>` instance for managing async test flow.
export declare function createDeferred<T>(): Deferred<T>;

// Waits for an assertion to become true (synchronously or asynchronously), with optional timeout and polling interval.
export declare function waitFor(assertion: () => boolean | Promise<boolean>, options?: {
  // Maximum time to wait in milliseconds (default: 5000).
  timeout?: number;
  // Polling interval in milliseconds (default: 50).
  interval?: number;
}): Promise<void>;

// Creates and returns a mock `Client` instance for testing purposes, optionally configured via `MockClientOptions`.
export declare function createMockClient(options?: MockClientOptions): Client;

// Creates and returns a `DevNode` fixture (a local development node instance), initialized and ready for testing.
export declare function createDevNodeFixture(options?: DevNodeFixtureOptions): Promise<DevNode>;
```

### Usage

```ts
import { createDeferred, waitFor, createMockClient } from '@cfxdevkit/testing';

// Example: Using a deferred to control async test flow
const deferred = createDeferred<string>();
setTimeout(() => deferred.resolve('done'), 100);
await deferred.promise; // resolves after 100ms

// Example: Waiting for a condition
await waitFor(() => document.querySelector('#loaded') !== null);

// Example: Creating a mock client
const client = createMockClient({ endpoint: 'http://localhost:8080' });
```

<!-- api-hash: b41cce8eec14b4ea7a2e98986506d1c60652d7d5a9bc9bba47410e46741178f6 -->
