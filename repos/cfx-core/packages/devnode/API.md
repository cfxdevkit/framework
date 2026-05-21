# `@cfxdevkit/devnode` — Public API

> Local Conflux dev node lifecycle.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 9 symbols |
| `./cli` | 3 symbols |

---

## `.`

```ts
export { DevNodeError }
export { DevNodeErrorCode }
export { createDevNode }
export { DevNode }
export { DevNodeUrls }
export { DevNodeAccount }
export { DevNodeConfig }
export { DevNodeStatus }
export { MiningStatus }
```

---

## `./cli`

```ts
export interface ParsedArgs {
export declare function parseArgs(argv: string[]): ParsedArgs;
export declare function printHelp(): void;
```

<!-- api-hash: b516adbcdbeba06b9a0fc1ba9a782bb29060261d68ff8232d2abd1be6b3bad19 -->
