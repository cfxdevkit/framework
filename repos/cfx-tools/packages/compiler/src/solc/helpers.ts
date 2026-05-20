import type { Hex } from '@cfxdevkit/core';
import type { Abi } from 'viem';
import { isHex } from 'viem';
import { CompileError } from '../errors.js';
import type {
  Artifact,
  CompileDiagnostic,
  CompileInput,
  ImportResolver,
  Source,
} from '../types.js';

export interface SolcStdInput {
  language: 'Solidity';
  sources: Record<string, { content: string }>;
  settings: {
    optimizer?: { enabled: boolean; runs: number };
    evmVersion?: string;
    remappings?: string[];
    outputSelection: Record<string, Record<string, string[]>>;
  };
}

export interface SolcStdError {
  severity: 'error' | 'warning' | 'info';
  type?: string;
  formattedMessage?: string;
  message: string;
  sourceLocation?: { file: string; start: number; end: number };
}

interface SolcContractOutput {
  abi: Abi;
  evm?: {
    bytecode?: { object?: string; sourceMap?: string };
    deployedBytecode?: { object?: string };
  };
  metadata?: string;
}

export interface SolcStdOutput {
  errors?: SolcStdError[];
  contracts?: Record<string, Record<string, SolcContractOutput>>;
}

const DEFAULT_OUTPUT_SELECTION = {
  '*': {
    '*': [
      'abi',
      'evm.bytecode.object',
      'evm.bytecode.sourceMap',
      'evm.deployedBytecode.object',
      'metadata',
    ],
  },
} as const;

export function buildStandardJson(input: CompileInput): SolcStdInput {
  if (input.sources.length === 0) {
    throw new CompileError({
      code: 'compiler/invalid-argument',
      message: 'compile() requires at least one source',
    });
  }
  const sortedSources: Record<string, { content: string }> = {};
  const seen = new Set<string>();
  for (const source of [...input.sources].sort((a, b) => a.path.localeCompare(b.path))) {
    if (seen.has(source.path)) {
      throw new CompileError({
        code: 'compiler/invalid-argument',
        message: `duplicate source path: ${source.path}`,
        meta: { path: source.path },
      });
    }
    seen.add(source.path);
    sortedSources[source.path] = { content: source.content };
  }
  const settings: SolcStdInput['settings'] = {
    outputSelection:
      (input.outputSelection as Record<string, Record<string, string[]>> | undefined) ??
      (DEFAULT_OUTPUT_SELECTION as unknown as Record<string, Record<string, string[]>>),
  };
  if (input.optimizer) settings.optimizer = input.optimizer;
  if (input.evmVersion) settings.evmVersion = input.evmVersion;
  if (input.remappings && input.remappings.length > 0)
    settings.remappings = [...input.remappings].sort();
  return { language: 'Solidity', sources: sortedSources, settings };
}

export function ensureHex(value: string | undefined): Hex {
  if (!value) return '0x' as Hex;
  return (isHex(value) ? value : `0x${value}`) as Hex;
}

export function makeImportCallback(
  resolver: ImportResolver | undefined,
  preloaded: Map<string, Source>,
  unresolved: Set<string>,
): (path: string) => { contents: string } | { error: string } {
  return (path: string) => {
    const found = preloaded.get(path);
    if (found) return { contents: found.content };
    if (!resolver) {
      unresolved.add(path);
      return { error: `no resolver registered for "${path}"` };
    }
    unresolved.add(path);
    return { error: `import "${path}" pending async resolution` };
  };
}

export async function preResolve(
  resolver: ImportResolver,
  pendingPaths: Iterable<string>,
  cache: Map<string, Source>,
  signal?: AbortSignal,
): Promise<{ resolved: number; missing: string[] }> {
  let resolved = 0;
  const missing: string[] = [];
  for (const importPath of pendingPaths) {
    if (signal?.aborted)
      throw new CompileError({ code: 'compiler/invalid-argument', message: 'compile aborted' });
    if (cache.has(importPath)) continue;
    const result = await resolver.resolve({ from: '', importPath });
    if (result) {
      cache.set(importPath, result);
      resolved++;
    } else {
      missing.push(importPath);
    }
  }
  return { resolved, missing };
}

export function diagnostics(errors: readonly SolcStdError[] | undefined) {
  const hardErrors: SolcStdError[] = [];
  const warnings: CompileDiagnostic[] = [];
  for (const error of errors ?? []) {
    if (error.severity === 'error') {
      hardErrors.push(error);
      continue;
    }
    const warning: CompileDiagnostic = {
      severity: error.severity,
      message: error.formattedMessage ?? error.message,
    };
    if (error.type) warning.type = error.type;
    if (error.sourceLocation) warning.sourceLocation = error.sourceLocation;
    warnings.push(warning);
  }
  return { hardErrors, warnings };
}

export function artifactsFrom(raw: SolcStdOutput): Artifact[] {
  const artifacts: Artifact[] = [];
  for (const [path, contracts] of Object.entries(raw.contracts ?? {})) {
    for (const [name, contract] of Object.entries(contracts)) {
      artifacts.push({
        path,
        contractName: name,
        abi: contract.abi,
        bytecode: ensureHex(contract.evm?.bytecode?.object),
        deployedBytecode: ensureHex(contract.evm?.deployedBytecode?.object),
        metadata: contract.metadata ?? '',
        ...(contract.evm?.bytecode?.sourceMap
          ? { sourceMap: contract.evm.bytecode.sourceMap }
          : {}),
      });
    }
  }
  return artifacts;
}
