# `@cfxdevkit/compiler` — Public API

> Solidity compilation pipeline.

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

```ts
export { readArtifact }
export { selectorsOf }
export { writeArtifact }
export { CompileError }
export { CompileErrorCode }
export { compose }
export { npmResolver }
export { remappingResolver }
export { compile }
export { ensureSolc }
export { listInstalledSolc }
export { SolcInstance }
export { basicErc20 }
export { basicErc721 }
export { getTemplate }
export { listTemplates }
export { TemplateMeta }
export { Artifact }
export { CompileDiagnostic }
export { CompileInput }
export { CompileOutput }
export { ImportResolver }
export { Source }
export declare const __packageName: "@cfxdevkit/compiler";
```

---

## `./solc`

```ts
export { compile }
export { ensureSolc }
export { listInstalledSolc }
export { SolcInstance }
```

---

## `./resolver`

```ts
export declare function npmResolver(opts?: {
export declare function remappingResolver(remappings: readonly string[]): ImportResolver;
export declare function compose(resolvers: readonly ImportResolver[]): ImportResolver;
```

---

## `./templates`

```ts
export interface TemplateMeta {
export declare function getTemplate(id: string): TemplateMeta;
export declare function listTemplates(): readonly TemplateMeta[];
export { basicErc20 }
export { basicErc721 }
export { exampleCounter }
export { payableVault }
export { simpleStorage }
```

---

## `./artifacts`

```ts
export declare function selectorsOf(abi: Abi): readonly Hex[];
export declare function readArtifact(path: string): Promise<Artifact>;
export declare function writeArtifact(path: string, artifact: Artifact): Promise<void>;
```

---

## `./errors`

```ts
export type CompileErrorCode = 'compiler/solc/syntax' | 'compiler/resolver/not-found' | 'compiler/version-mismatch' | 'compiler/solc/binary-unavailable' | 'compiler/invalid-argument' | 'compiler/io-failure';
export declare class CompileError extends CfxError {
```

<!-- api-hash: 5973fa8c4c15735c9795d78cf2f56e6ac02d2d21a45e30db9b5097abb6a8d755 -->
