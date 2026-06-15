# `@cfxdevkit/devnode-server` — Public API

> Shared Hono control plane for the local Conflux dev node.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 8 symbols |
| `./cli` | 8 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/devnode-server";
export interface DevnodeServerAppOptions extends DevnodeServerControllerOptions, AccountsRoutesOptions {
export interface DevnodeServerExtensionContext {
export interface NodeProfileSummary {
export interface NodeProfileState {
export interface NodeProfileServiceOptions {
export declare function createDevnodeServerApp(options?: DevnodeServerAppOptions): Hono;
export declare class NodeProfileService {
```

---

## `./cli`

```ts
export declare const DEFAULT_HOST = "127.0.0.1";
export declare const DEFAULT_PORT = 52000;
export declare const DEFAULT_BASE_URL = "http://127.0.0.1:52000";
export type ParsedArgs = {
export declare function parseArgs(argv: string[]): ParsedArgs;
export declare function printHelp(): string;
export declare function executeCliCommand(parsed: Exclude<ParsedArgs, {
export declare function main(argv?: string[]): Promise<void>;
```

<!-- api-hash: 0e8d096550af9233cc5f0514b12650e741416b98d95c8d0a85948253e9a4e881 -->
