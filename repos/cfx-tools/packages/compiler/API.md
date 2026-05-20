# @cfxdevkit/compiler — Public API

> Solidity compilation. Pure, deterministic, no caching of artifacts (caller's job).

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/compiler` | high-level `compile` |
| `@cfxdevkit/compiler/solc` | solc binary management |
| `@cfxdevkit/compiler/resolver` | import resolution (npm + remappings) |
| `@cfxdevkit/compiler/artifacts` | artifact shape + helpers |
| `@cfxdevkit/compiler/errors` | `CompileError` |

---

## `compiler`

```
type Source = { path: string; content: string }

type CompileInput = {
  sources: readonly Source[]
  solcVersion: string                          // exact, e.g. "0.8.26"
  optimizer?: { enabled: boolean; runs: number }
  evmVersion?: string
  remappings?: readonly string[]
  resolver?: ImportResolver                    // default = npm node_modules
  signal?: AbortSignal
}

type Artifact = {
  path: string
  contractName: string
  abi: Abi
  bytecode: Hex
  deployedBytecode: Hex
  metadata: string                             // JSON string
  sourceMap?: string
}

type CompileOutput = {
  artifacts: readonly Artifact[]
  warnings: readonly { message: string; severity: 'warning' | 'info' }[]
  inputHash: string                            // sha256 of normalised input
}

function compile(input: CompileInput): Promise<CompileOutput>
```

### Errors
`CompileError` codes:
- `compiler/solc/syntax`           — solc returned errors; `meta.errors[]` has them
- `compiler/resolver/not-found`    — import unresolved
- `compiler/version-mismatch`      — pragma vs `solcVersion` conflict
- `compiler/solc/binary-unavailable` — could not download/locate solc

---

## `compiler/solc`

```
function ensureSolc(version: string, opts?: { cacheDir?: string; signal?: AbortSignal }): Promise<{ binaryPath: string; version: string }>
function listInstalledSolc(opts?: { cacheDir?: string }): Promise<string[]>
```

Downloads to a cache (XDG by default). No global state.

---

## `compiler/resolver`

```
type ImportResolver = {
  resolve(input: { from: string; importPath: string }): Promise<{ path: string; content: string } | null>
}

function npmResolver(opts?: { rootDir?: string }): ImportResolver
function remappingResolver(remappings: readonly string[]): ImportResolver
function compose(resolvers: readonly ImportResolver[]): ImportResolver
```

---

## `compiler/artifacts`

```
function readArtifact(path: string): Promise<Artifact>
function writeArtifact(path: string, artifact: Artifact): Promise<void>
function selectorsOf(abi: Abi): readonly Hex[]
```
