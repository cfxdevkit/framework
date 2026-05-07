# `@cfxdevkit/codegen-contracts` — API Reference

> Extracts ABI + bytecode from Hardhat-style artifact JSON files and renders
> TypeScript modules consumed by `@cfxdevkit/contracts`.

## Exports

```ts
// Extract artifacts from a directory of Hardhat JSON files
async function extractContracts(
  options: ExtractContractsOptions,
): Promise<ContractArtifact[]>
interface ExtractContractsOptions {
  artifactsDir: string
  includeDebugFiles?: boolean   // skip *.dbg.json by default
}

// Render a single TypeScript module string from one artifact
function renderContractModule(options: RenderContractOptions): string
interface RenderContractOptions {
  artifact: ContractArtifact
  exportName?: string           // derived from contractName when omitted
}

// Extract + render + write all modules and generate a barrel index.ts
async function writeContractModules(
  options: WriteContractModulesOptions,
): Promise<ContractArtifact[]>
interface WriteContractModulesOptions extends ExtractContractsOptions {
  outDir: string
}

// Programmatic CLI entry (same as calling the bin directly)
async function cli(argv?: string[]): Promise<void>

// Artifact shape
interface ContractArtifact {
  contractName: string
  sourceName?: string
  abi: unknown[]
  bytecode: `0x${string}`
  deployedBytecode?: `0x${string}`
}
```

## CLI

The package ships `cfxdevkit-extract-contracts` as its binary, but it is also
wired into the main `cfx` CLI:

```sh
# via cfxdevkit-extract-contracts directly
cfxdevkit-extract-contracts --artifacts ./artifacts --out ./src/generated/contracts

# via cfx CLI
cfx contracts extract --artifacts ./artifacts --out ./src/generated/contracts
```

Defaults: `--artifacts artifacts`, `--out src/generated/contracts`.

## Generated output

For each artifact `Counter.json` the tool writes `counter.ts` containing:

```ts
export const CounterAbi = [...] as const;
export const CounterBytecode = '0x...' as const;
export const CounterArtifact = { contractName, abi, bytecode } as const;
```

Plus a barrel `index.ts` re-exporting every generated module.

## Notes

- Files with non-hex bytecode (`bytecode` not matching `/^0x[0-9a-fA-F]*$/`) are silently skipped.
- `*.dbg.json` files are skipped unless `includeDebugFiles: true`.
- Export names are sanitised to valid JS identifiers (`123 Token` → `Contract_123_TokenArtifact`).