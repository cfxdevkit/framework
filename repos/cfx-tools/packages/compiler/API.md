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

### Usage

```typescript
import { compile } from '@cfxdevkit/compiler';

const artifacts = await compile({
  sources: {
    'Example.sol': { content: 'contract Example { function foo() public {} }' }
  },
  settings: {
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
  }
});
```

```ts
// Reads a compiled artifact from a file path.
export { readArtifact }
// Returns function selectors for a given ABI.
export { selectorsOf }
// Writes a compiled artifact to a file path.
export { writeArtifact }
// Error thrown during the compilation process.
export { CompileError }
// Error codes for compilation failures.
export { CompileErrorCode }
// Combines multiple import resolvers into a single resolver.
export { compose }
// Creates a resolver that fetches imports from npm.
export { npmResolver }
// Creates a resolver based on path remappings.
export { remappingResolver }
// Compiles Solidity source files into artifacts.
export { compile }
// Ensures a specific solc version is installed and available.
export { ensureSolc }
// Lists all installed solc versions.
export { listInstalledSolc }
// Represents an instance of the solc compiler.
export { SolcInstance }
// A template for a basic ERC20 token.
export { basicErc20 }
// A template for a basic ERC721 token.
export { basicErc721 }
// Retrieves a contract template by its identifier.
export { getTemplate }
// Lists all available contract templates.
export { listTemplates }
// Metadata describing a contract template.
export { TemplateMeta }
// The structure of a compiled contract artifact.
export { Artifact }
// A diagnostic message produced by the compiler.
export { CompileDiagnostic }
// Configuration for the compilation process.
export { CompileInput }
// The result of a compilation process.
export { CompileOutput }
// A function that resolves import paths to content.
export { ImportResolver }
// Represents a source file input.
export { Source }
export declare const __packageName: "@cfxdevkit/compiler";
```

---

## `./solc`

### Usage

```typescript
import { ensureSolc, listInstalledSolc } from '@cfxdevkit/compiler/solc';

await ensureSolc('0.8.20');
const versions = listInstalledSolc();
```

```ts
// Compiles sources using a specific solc instance.
export { compile }
// Ensures a solc version is available.
export { ensureSolc }
// Lists all installed solc versions.
export { listInstalledSolc }
// Interface for interacting with solc.
export { SolcInstance }
```

---

## `./resolver`

### Usage

```typescript
import { remappingResolver, compose } from '@cfxdevkit/compiler/resolver';

const resolver = compose([
  remappingResolver(['@openzeppelin/=node_modules/@openzeppelin/']),
  npmResolver()
]);
```

```ts
// Creates a resolver that looks up imports in npm.
export declare function npmResolver(opts?: {
// Creates a resolver that uses path remappings.
export declare function remappingResolver(remappings: readonly string[]): ImportResolver;
// Merges multiple resolvers into one.
export declare function compose(resolvers: readonly ImportResolver[]): ImportResolver;
```

---

## `./templates`

### Usage

```typescript
import { getTemplate, listTemplates } from '@cfxdevkit/compiler/templates';

const templates = listTemplates();
const erc20 = getTemplate('basicErc20');
```

```ts
// Metadata for a contract template.
export interface TemplateMeta {
// Retrieves a contract template by ID.
export declare function getTemplate(id: string): TemplateMeta;
// Lists all available contract templates.
export declare function listTemplates(): readonly TemplateMeta[];
// A template for a standard ERC20 token.
export { basicErc20 }
// A template for a standard ERC721 token.
export { basicErc721 }
// A template for a counter contract.
export { exampleCounter }
// A template for a payable vault contract.
export { payableVault }
// A template for a simple storage contract.
export { simpleStorage }
```

---

## `./artifacts`

### Usage

```typescript
import { readArtifact, selectorsOf } from '@cfxdevkit/compiler/artifacts';

const artifact = await readArtifact('./out/Token.json');
const selectors = selectorsOf(artifact.abi);
```

```ts
// Returns function selectors for a given ABI.
export declare function selectorsOf(abi: Abi): readonly Hex[];
// Reads a compiled artifact from a file path.
export declare function readArtifact(path: string): Promise<Artifact>;
// Writes a compiled artifact to a file path.
export declare function writeArtifact(path: string, artifact: Artifact): Promise<void>;
```

---

## `./errors`

### Usage

```typescript
import { CompileError } from '@cfxdevkit/compiler/errors';

try {
  // compilation logic
} catch (e) {
  if (e instanceof CompileError) {
    console.error(`Error [${e.code}]: ${e.message}`);
  }
}
```

```ts
// Set of error codes for compilation issues.
export type CompileErrorCode = 'compiler/solc/syntax' | 'compiler/resolver/not-found' | 'compiler/version-mismatch' | 'compiler/solc/binary-unavailable' | 'compiler/invalid-argument' | 'compiler/io-failure';
// Error thrown during the compilation process.
export declare class CompileError extends CfxError {
```

<!-- api-hash: 5973fa8c4c15735c9795d78cf2f56e6ac02d2d21a45e30db9b5097abb6a8d755 -->
