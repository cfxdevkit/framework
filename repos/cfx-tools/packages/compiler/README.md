# @cfxdevkit/compiler

**Scope:** Runtime Solidity compilation + contract template registry.

**Responsibilities**
- Wrap `solc-js` with a stable, typed API
- Resolve standard imports (OpenZeppelin, etc.) via pluggable resolvers
- Curated template catalog (ERC-20, ERC-721, NFT collection, etc.)

Depends on: nothing in framework. Pure utility.

## Install

```bash
npm install @cfxdevkit/compiler
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 24 symbols |
| `./solc` | 4 symbols |
| `./resolver` | 3 symbols |
| `./templates` | 8 symbols |
| `./artifacts` | 3 symbols |
| `./errors` | 2 symbols |

---

## `.`

### Core Compilation

```ts
export declare function compile(
  input: CompileInput,
  solc: SolcInstance
): CompileOutput;

export declare function ensureSolc(version: string): Promise<SolcInstance>;

export declare function listInstalledSolc(): readonly string[];
```

### Artifact Handling

```ts
export interface Artifact {
  sourceName: string;
  contractName: string;
  abi: any[];
  bytecode: string;
  deployedBytecode?: string;
  metadata?: string;
}

export declare function readArtifact(path: string): Artifact;
export declare function writeArtifact(path: string, artifact: Artifact): void;
```

### Error & Diagnostic Types

```ts
export declare class CompileError extends Error {
  code: CompileErrorCode;
  diagnostics: CompileDiagnostic[];
}

export declare enum CompileErrorCode {
  COMPILATION_FAILED = "COMPILATION_FAILED",
  RESOLUTION_FAILED = "RESOLUTION_FAILED",
  SOLC_NOT_FOUND = "SOLC_NOT_FOUND",
}

export interface CompileDiagnostic {
  sourceLocation?: { file: string; start: number; end: number };
  severity: "error" | "warning" | "info";
  message: string;
}
```

### Import Resolution

```ts
export interface ImportResolver {
  resolve(importPath: string, sourceName: string): Promise<Source | null>;
}

export interface Source {
  content: string;
  sourceName: string;
}

export declare function npmResolver(opts?: {
  registry?: string;
  cacheDir?: string;
}): ImportResolver;

export declare function remappingResolver(
  remappings: readonly string[]
): ImportResolver;

export declare function compose(
  resolvers: readonly ImportResolver[]
): ImportResolver;
```

### Template System

```ts
export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  source: string;
}

export declare function getTemplate(id: string): TemplateMeta;
export declare function listTemplates(): readonly TemplateMeta[];

export declare const basicErc20: TemplateMeta;
export declare const basicErc721: TemplateMeta;
export declare const exampleCounter: TemplateMeta;
export declare const payableVault: TemplateMeta;
export declare const simpleStorage: TemplateMeta;
```

### Utilities

```ts
export declare function selectorsOf(abi: any[]): string[];
export declare const __packageName: "@cfxdevkit/compiler";
```

---

## `./solc`

```ts
export { compile, ensureSolc, listInstalledSolc, SolcInstance } from ".";
```

---

## `./resolver`

```ts
export { npmResolver, remappingResolver, compose } from ".";
```

---

## `./templates`

```ts
export {
  TemplateMeta,
  getTemplate,
  listTemplates,
  basicErc20,
  basicErc721,
  exampleCounter,
  payableVault,
  simpleStorage,
} from ".";
```

---

## `./artifacts`

```ts
export { Artifact, readArtifact, writeArtifact } from ".";
```

---

## `./errors`

```ts
export { CompileError, CompileErrorCode, CompileDiagnostic } from ".";
```

<!-- readme-hash: fd6cdbf06d6bea5f2c857bfc259c71f8ce7450eaa0eb4c66ee2c7a1c7f3af0d9 -->
