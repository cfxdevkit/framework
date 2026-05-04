import { createHash } from 'node:crypto';
import { CompileError } from '../errors.js';
import type { CompileInput, CompileOutput, Source } from '../types.js';
import {
  artifactsFrom,
  buildStandardJson,
  diagnostics,
  makeImportCallback,
  preResolve,
  type SolcStdOutput,
} from './compile-helpers.js';
import { ensureSolc } from './loader.js';

export async function compile(input: CompileInput): Promise<CompileOutput> {
  const ensureOpts: { signal?: AbortSignal } = {};
  if (input.signal) ensureOpts.signal = input.signal;
  const solc = await ensureSolc(input.solcVersion, ensureOpts);
  const stdJson = buildStandardJson(input);
  const inputString = JSON.stringify(stdJson);
  const inputHash = createHash('sha256').update(inputString).digest('hex');
  const preloaded = new Map<string, Source>();
  for (const source of input.sources) preloaded.set(source.path, source);

  const raw = await runSolcWithResolvedImports({ input, inputString, preloaded, solc });
  const { hardErrors, warnings } = diagnostics(raw.errors);
  if (hardErrors.length > 0) {
    throw new CompileError({
      code: 'compiler/solc/syntax',
      message: hardErrors.map((error) => error.formattedMessage ?? error.message).join('\n'),
      meta: { errors: hardErrors },
    });
  }
  return { artifacts: artifactsFrom(raw), warnings, inputHash, solcVersion: solc.version };
}

async function runSolcWithResolvedImports({
  input,
  inputString,
  preloaded,
  solc,
}: {
  input: CompileInput;
  inputString: string;
  preloaded: Map<string, Source>;
  solc: {
    compile: (input: string, options: { import: ReturnType<typeof makeImportCallback> }) => string;
  };
}): Promise<SolcStdOutput> {
  let lastUnresolved: Set<string> = new Set();
  let attempt = 0;
  let raw: SolcStdOutput | null = null;
  while (attempt < 8) {
    const unresolved = new Set<string>();
    raw = JSON.parse(
      solc.compile(inputString, {
        import: makeImportCallback(input.resolver, preloaded, unresolved),
      }),
    ) as SolcStdOutput;
    if (unresolved.size === 0) break;
    await resolvePendingImports({ input, unresolved, lastUnresolved, preloaded });
    lastUnresolved = unresolved;
    attempt++;
  }
  if (!raw)
    throw new CompileError({ code: 'compiler/solc/syntax', message: 'solc produced no output' });
  return raw;
}

async function resolvePendingImports({
  input,
  unresolved,
  lastUnresolved,
  preloaded,
}: {
  input: CompileInput;
  unresolved: Set<string>;
  lastUnresolved: Set<string>;
  preloaded: Map<string, Source>;
}) {
  if (!input.resolver) {
    throw new CompileError({
      code: 'compiler/resolver/not-found',
      message: `unresolved imports: ${[...unresolved].join(', ')}`,
      meta: { paths: [...unresolved] },
    });
  }
  if (
    unresolved.size === lastUnresolved.size &&
    [...unresolved].every((path) => lastUnresolved.has(path))
  ) {
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
}
