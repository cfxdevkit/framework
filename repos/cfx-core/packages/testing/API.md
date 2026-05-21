# `@cfxdevkit/testing` — Public API

> Shared test fixtures and matchers.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 8 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/testing";
export interface Deferred<T> {
export interface MockClientOptions {
export interface DevNodeFixtureOptions {
export declare function createDeferred<T>(): Deferred<T>;
export declare function waitFor(assertion: () => boolean | Promise<boolean>, options?: {
export declare function createMockClient(options?: MockClientOptions): Client;
export declare function createDevNodeFixture(options?: DevNodeFixtureOptions): Promise<DevNode>;
```

<!-- api-hash: 7c75dc1a5049ce3ce02313f28a94957c8fec2099d6daafdec297db0cb634beee -->
