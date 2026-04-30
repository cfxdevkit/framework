/**
 * High-level `compile(input)` — turns typed inputs into a typed
 * {@link CompileOutput} of `Artifact[]`. Wraps {@link ensureSolc} and the
 * solc standard-json protocol.
 *
 * Behaviour:
 *
 * - **Standard-json input** is built deterministically (sorted source paths,
 *   sorted remappings, default optimizer off) so `inputHash` is reproducible.
 * - **Resolver callback** is wired into solc's `import` hook; unresolved
 *   imports throw a `compiler/resolver/not-found` error, *not* a generic
 *   solc syntax error, so callers can branch.
 * - **Errors vs warnings** are split by `severity`. Any `error` produces
 *   `compiler/solc/syntax`; warnings/infos surface in `output.warnings`.
 * - `inputHash` is sha-256 of the canonicalised standard-json string.
 */
import { createHash } from 'node:crypto';
import type { Hex } from '@cfxdevkit/core';
import type { Abi } from 'viem';
import { CompileError } from '../errors.js';
import type {
  Artifact,
  CompileDiagnostic,
  CompileInput,
  CompileOutput,
  ImportResolver,
  Source,
} from '../types.js';
import { ensureSolc } from './loader.js';

interface SolcStdInput {
  language: 'Solidity';
  sources: Record<string, { content: string }>;
  settings: {
    optimizer?: { enabled: boolean; runs: number };
    evmVersion?: string;
    remappings?: string[];
    outputSelection: Record<string, Record<string, string[]>>;
  };
}

interface SolcStdError {
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

interface SolcStdOutput {
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

function buildStandardJson(input: CompileInput): SolcStdInput {
  if (input.sources.length === 0) {
    throw new CompileError({
      code: 'compiler/invalid-argument',
      message: 'compile() requires at least one source',
    });
  }
  const sortedSources: Record<string, { content: string }> = {};
  const seen = new Set<string>();
  for (const s of [...input.sources].sort((a, b) => a.path.localeCompare(b.path))) {
    if (seen.has(s.path)) {
      throw new CompileError({
        code: 'compiler/invalid-argument',
        message: `duplicate source path: ${s.path}`,
        meta: { path: s.path },
      });
    }
    seen.add(s.path);
    sortedSources[s.path] = { content: s.content };
  }
  const settings: SolcStdInput['settings'] = {
    outputSelection:
      (input.outputSelection as Record<string, Record<string, string[]>> | undefined) ??
      (DEFAULT_OUTPUT_SELECTION as unknown as Record<string, Record<string, string[]>>),
  };
  if (input.optimizer) settings.optimizer = input.optimizer;
  if (input.evmVersion) settings.evmVersion = input.evmVersion;
  if (input.remappings && input.remappings.length > 0) {
    settings.remappings = [...input.remappings].sort();
  }
  return { language: 'Solidity', sources: sortedSources, settings };
}

function ensureHex(value: string | undefined): Hex {
  if (!value) return '0x' as Hex;
  return (value.startsWith('0x') ? value : `0x${value}`) as Hex;
}

function makeImportCallback(
  resolver: ImportResolver | undefined,
  preloaded: Map<string, Source>,
  unresolved: Set<string>,
): (path: string) => { contents: string } | { error: string } {
  return (path: string) => {
    if (preloaded.has(path)) {
      const found = preloaded.get(path);
      if (found) return { contents: found.content };
    }
    if (!resolver) {
      unresolved.add(path);
      return { error: `no resolver registered for "${path}"` };
    }
    // solc's import callback is synchronous; we resolve concurrently
    // beforehand and reuse the cache. Unresolved-on-first-pass paths get a
    // typed error after the second pass below.
    unresolved.add(path);
    return { error: `import "${path}" pending async resolution` };
  };
}

async function preResolve(
  resolver: ImportResolver,
  pendingPaths: Iterable<string>,
  cache: Map<string, Source>,
  signal?: AbortSignal,
): Promise<{ resolved: number; missing: string[] }> {
  let resolved = 0;
  const missing: string[] = [];
  for (const importPath of pendingPaths) {
    if (signal?.aborted) {
      throw new CompileError({
        code: 'compiler/invalid-argument',
        message: 'compile aborted',
      });
    }
    if (cache.has(importPath)) continue;
    const r = await resolver.resolve({ from: '', importPath });
    if (r) {
      cache.set(importPath, r);
      resolved++;
    } else {
      missing.push(importPath);
    }
  }
  return { resolved, missing };
}

export async function compile(input: CompileInput): Promise<CompileOutput> {
  const ensureOpts: { signal?: AbortSignal } = {};
  if (input.signal) ensureOpts.signal = input.signal;
  const solc = await ensureSolc(input.solcVersion, ensureOpts);
  const stdJson = buildStandardJson(input);
  const inputString = JSON.stringify(stdJson);
  const inputHash = createHash('sha256').update(inputString).digest('hex');

  const preloaded = new Map<string, Source>();
  for (const s of input.sources) preloaded.set(s.path, s);

  // Iterative resolution: solc's import callback can't be async. We let it
  // emit "pending" errors for unknown paths, then resolve them externally
  // and recompile until convergence (or no progress).
  let lastUnresolved: Set<string> = new Set();
  let attempt = 0;
  let raw: SolcStdOutput | null = null;
  while (attempt < 8) {
    const unresolved = new Set<string>();
    const importCallback = makeImportCallback(input.resolver, preloaded, unresolved);
    const rawString = solc.compile(inputString, { import: importCallback });
    raw = JSON.parse(rawString) as SolcStdOutput;
    // Did solc actually need any imports we don't have yet?
    if (unresolved.size === 0) break;
    if (!input.resolver) {
      throw new CompileError({
        code: 'compiler/resolver/not-found',
        message: `unresolved imports: ${[...unresolved].join(', ')}`,
        meta: { paths: [...unresolved] },
      });
    }
    if (
      unresolved.size === lastUnresolved.size &&
      [...unresolved].every((p) => lastUnresolved.has(p))
    ) {
      // No progress — give up.
      throw new CompileError({
        code: 'compiler/resolver/not-found',
        message: `resolver could not satisfy: ${[...unresolved].join(', ')}`,
        meta: { paths: [...unresolved] },
      });
    }
    const { missing } = await preResolve(input.resolver, unresolved, preloaded, input.signal);
    if (missing.length > 0 && missing.length === unresolved.size) {
      throw new CompileError({
        code: 'compiler/resolver/not-found',
        message: `resolver returned null for: ${missing.join(', ')}`,
        meta: { paths: missing },
      });
    }
    // Re-build standard-json with the newly resolved sources merged in.
    for (const [k, v] of preloaded) stdJson.sources[k] = { content: v.content };
    lastUnresolved = unresolved;
    attempt++;
  }
  if (!raw) {
    throw new CompileError({
      code: 'compiler/solc/syntax',
      message: 'solc produced no output',
    });
  }

  const errors: SolcStdError[] = [];
  const warnings: CompileDiagnostic[] = [];
  for (const e of raw.errors ?? []) {
    if (e.severity === 'error') {
      errors.push(e);
      continue;
    }
    const w: CompileDiagnostic = {
      severity: e.severity,
      message: e.formattedMessage ?? e.message,
    };
    if (e.type) w.type = e.type;
    if (e.sourceLocation) w.sourceLocation = e.sourceLocation;
    warnings.push(w);
  }
  if (errors.length > 0) {
    throw new CompileError({
      code: 'compiler/solc/syntax',
      message: errors.map((e) => e.formattedMessage ?? e.message).join('\n'),
      meta: { errors },
    });
  }

  const artifacts: Artifact[] = [];
  for (const [path, contracts] of Object.entries(raw.contracts ?? {})) {
    for (const [name, c] of Object.entries(contracts)) {
      artifacts.push({
        path,
        contractName: name,
        abi: c.abi,
        bytecode: ensureHex(c.evm?.bytecode?.object),
        deployedBytecode: ensureHex(c.evm?.deployedBytecode?.object),
        metadata: c.metadata ?? '',
        ...(c.evm?.bytecode?.sourceMap ? { sourceMap: c.evm.bytecode.sourceMap } : {}),
      });
    }
  }

  return {
    artifacts,
    warnings,
    inputHash,
    solcVersion: solc.version,
  };
}
