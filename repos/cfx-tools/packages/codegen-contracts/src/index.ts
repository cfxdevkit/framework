import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export const __packageName = '@cfxdevkit/codegen-contracts' as const;

export interface ContractArtifact {
  contractName: string;
  sourceName?: string;
  abi: unknown[];
  bytecode: `0x${string}`;
  deployedBytecode?: `0x${string}`;
}

export interface ExtractContractsOptions {
  artifactsDir: string;
  includeDebugFiles?: boolean;
}

export interface RenderContractOptions {
  artifact: ContractArtifact;
  exportName?: string;
}

export interface WriteContractModulesOptions extends ExtractContractsOptions {
  outDir: string;
}

export async function extractContracts(
  options: ExtractContractsOptions,
): Promise<ContractArtifact[]> {
  const files = await listJsonFiles(options.artifactsDir);
  const artifacts: ContractArtifact[] = [];
  for (const file of files) {
    if (!options.includeDebugFiles && file.endsWith('.dbg.json')) continue;
    const artifact = await readArtifact(file).catch(() => null);
    if (artifact) artifacts.push(artifact);
  }
  return artifacts.sort((left, right) => left.contractName.localeCompare(right.contractName));
}

export function renderContractModule(options: RenderContractOptions): string {
  const { artifact } = options;
  const exportName = options.exportName ?? toIdentifier(artifact.contractName);
  return [
    `export const ${exportName}Abi = ${JSON.stringify(artifact.abi, null, 2)} as const;`,
    '',
    `export const ${exportName}Bytecode = '${artifact.bytecode}' as const;`,
    '',
    `export const ${exportName}Artifact = {`,
    `  contractName: ${JSON.stringify(artifact.contractName)},`,
    artifact.sourceName ? `  sourceName: ${JSON.stringify(artifact.sourceName)},` : undefined,
    `  abi: ${exportName}Abi,`,
    `  bytecode: ${exportName}Bytecode,`,
    artifact.deployedBytecode
      ? `  deployedBytecode: '${artifact.deployedBytecode}' as const,`
      : undefined,
    `} as const;`,
    '',
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');
}

export async function writeContractModules(
  options: WriteContractModulesOptions,
): Promise<ContractArtifact[]> {
  const artifacts = await extractContracts(options);
  await mkdir(options.outDir, { recursive: true });
  const exports: string[] = [];
  for (const artifact of artifacts) {
    const fileName = `${toKebabCase(artifact.contractName)}.ts`;
    await writeFile(join(options.outDir, fileName), renderContractModule({ artifact }), 'utf8');
    exports.push(`export * from './${fileName.replace(/\.ts$/, '.js')}';`);
  }
  await writeFile(join(options.outDir, 'index.ts'), `${exports.join('\n')}\n`, 'utf8');
  return artifacts;
}

export async function cli(argv = process.argv.slice(2)): Promise<void> {
  const artifactsDir = valueAfter(argv, '--artifacts') ?? valueAfter(argv, '-a') ?? 'artifacts';
  const outDir = valueAfter(argv, '--out') ?? valueAfter(argv, '-o') ?? 'src/generated/contracts';
  const artifacts = await writeContractModules({ artifactsDir, outDir });
  console.log(
    `Extracted ${artifacts.length} contract artifact(s) from ${relative(process.cwd(), artifactsDir)}`,
  );
}

async function readArtifact(file: string): Promise<ContractArtifact | null> {
  const data = JSON.parse(await readFile(file, 'utf8')) as Partial<ContractArtifact>;
  if (!data.contractName || !Array.isArray(data.abi) || !isHex(data.bytecode)) return null;
  return {
    contractName: data.contractName,
    ...(data.sourceName ? { sourceName: data.sourceName } : {}),
    abi: data.abi,
    bytecode: data.bytecode,
    ...(isHex(data.deployedBytecode) ? { deployedBytecode: data.deployedBytecode } : {}),
  };
}

async function listJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listJsonFiles(path)));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(path);
  }
  return files;
}

function toIdentifier(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9_$]/g, '_');
  return /^[A-Za-z_$]/.test(cleaned) ? cleaned : `Contract_${cleaned}`;
}

function toKebabCase(value: string): string {
  return basename(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function isHex(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value);
}

function valueAfter(argv: readonly string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
