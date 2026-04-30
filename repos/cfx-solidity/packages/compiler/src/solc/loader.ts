/**
 * solc binary management — download `soljson-vX.Y.Z+commit.<hash>.js` from
 * `binaries.soliditylang.org/wasm/` to a local cache, then load it via
 * `solc/wrapper`.
 *
 * Design choices:
 *
 * - **No globals.** Each `ensureSolc(version)` call resolves a cache path and
 *   returns a wrapped solc instance; concurrent calls for the same version
 *   share an in-flight download promise.
 * - **XDG-friendly cache.** Defaults to `$XDG_CACHE_HOME/cfxdevkit/solc/` (or
 *   `~/.cache/cfxdevkit/solc/`); override via the `cacheDir` option or the
 *   `CFXDEVKIT_SOLC_CACHE` env var.
 * - **Pinned versions only.** Callers pass a clean semver like `"0.8.26"`;
 *   the loader looks up the exact `soljson-vX.Y.Z+commit.<hash>.js` URL via
 *   `list.json` and verifies the SHA-256 advertised there.
 *
 * The wrapped solc exposes `compile(stdJsonInput)` returning the raw
 * standard-json string. Higher-level `compile.ts` wraps that in typed I/O.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CompileError } from '../errors.js';

interface SolcListEntry {
  path: string;
  version: string;
  longVersion: string;
  keccak256?: string;
  sha256?: string;
}
interface SolcList {
  releases: Record<string, string>;
  builds: SolcListEntry[];
}

/** A loaded solc instance — exposes the standard-json `compile` entry point. */
export interface SolcInstance {
  version: string;
  longVersion: string;
  binaryPath: string;
  /** Pass a stringified standard-json input; returns the stringified output. */
  compile(
    input: string,
    opts?: { import?: (path: string) => { contents: string } | { error: string } },
  ): string;
}

const BINARIES_BASE = 'https://binaries.soliditylang.org/wasm';

function defaultCacheDir(): string {
  const env = process.env.CFXDEVKIT_SOLC_CACHE;
  if (env) return env;
  const xdg = process.env.XDG_CACHE_HOME;
  if (xdg) return join(xdg, 'cfxdevkit', 'solc');
  return join(homedir(), '.cache', 'cfxdevkit', 'solc');
}

const inflight = new Map<string, Promise<SolcInstance>>();
let cachedList: SolcList | null = null;
let cachedListAt = 0;
const LIST_TTL_MS = 6 * 60 * 60 * 1000;

async function fetchList(signal?: AbortSignal): Promise<SolcList> {
  const now = Date.now();
  if (cachedList && now - cachedListAt < LIST_TTL_MS) return cachedList;
  const init: RequestInit = signal ? { signal } : {};
  const r = await fetch(`${BINARIES_BASE}/list.json`, init);
  if (!r.ok) {
    throw new CompileError({
      code: 'compiler/solc/binary-unavailable',
      message: `failed to fetch solc list.json: ${r.status} ${r.statusText}`,
    });
  }
  cachedList = (await r.json()) as SolcList;
  cachedListAt = now;
  return cachedList;
}

function pickBuild(list: SolcList, version: string): SolcListEntry {
  // `releases` maps clean version → soljson filename. Use it if present.
  const releaseFile = list.releases[version];
  if (releaseFile) {
    const found = list.builds.find((b) => b.path === releaseFile);
    if (found) return found;
  }
  // Fallback: scan builds for exact `version` match.
  const m = list.builds.find((b) => b.version === version);
  if (m) return m;
  throw new CompileError({
    code: 'compiler/solc/binary-unavailable',
    message: `solc version "${version}" not found in upstream list.json`,
    meta: { version },
  });
}

async function downloadBinary(
  build: SolcListEntry,
  cacheDir: string,
  signal?: AbortSignal,
): Promise<string> {
  await mkdir(cacheDir, { recursive: true });
  const target = join(cacheDir, build.path);
  if (existsSync(target)) return target;
  const init: RequestInit = signal ? { signal } : {};
  const r = await fetch(`${BINARIES_BASE}/${build.path}`, init);
  if (!r.ok) {
    throw new CompileError({
      code: 'compiler/solc/binary-unavailable',
      message: `failed to download ${build.path}: ${r.status} ${r.statusText}`,
    });
  }
  const buf = Buffer.from(await r.arrayBuffer());
  // Verify advertised sha256 if present (the file lists "sha256: 0x..." hex).
  if (build.sha256) {
    const expected = build.sha256.replace(/^0x/, '');
    const actual = createHash('sha256').update(buf).digest('hex');
    if (expected.toLowerCase() !== actual.toLowerCase()) {
      throw new CompileError({
        code: 'compiler/solc/binary-unavailable',
        message: `sha256 mismatch for ${build.path}`,
        meta: { expected, actual },
      });
    }
  }
  // Write atomically: tmp → rename.
  const tmp = `${target}.tmp-${process.pid}`;
  await writeFile(tmp, buf);
  const { rename } = await import('node:fs/promises');
  await rename(tmp, target);
  return target;
}

interface SoljsonModule {
  cwrap?: unknown;
  Module?: unknown;
}

/**
 * Load the cached soljson file as a CommonJS module. soljson references
 * `__dirname`/`__filename`/`process`, so we go through Node's CJS loader
 * (via `createRequire`) rather than evaluating the source in a sandbox.
 */
function loadSoljson(binaryPath: string): SoljsonModule {
  const require_ = createRequire(pathToFileURL(binaryPath).href);
  // biome-ignore lint/suspicious/noExplicitAny: soljson is dynamically typed
  const mod = require_(binaryPath) as any;
  return mod as SoljsonModule;
}

/**
 * Resolve, download (if needed), and load a pinned solc version. Concurrent
 * calls for the same version share the same in-flight promise.
 */
export async function ensureSolc(
  version: string,
  opts: { cacheDir?: string; signal?: AbortSignal } = {},
): Promise<SolcInstance> {
  const key = `${opts.cacheDir ?? ''}:${version}`;
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = (async (): Promise<SolcInstance> => {
    const list = await fetchList(opts.signal);
    const build = pickBuild(list, version);
    const cacheDir = opts.cacheDir ?? defaultCacheDir();
    const binaryPath = await downloadBinary(build, cacheDir, opts.signal);
    const soljson = loadSoljson(binaryPath);
    // `solc/wrapper` exposes a tiny adapter that turns the raw soljson module
    // into a friendly object with `compile(stdJsonInput, { import })`.
    const wrapperMod = (await import('solc/wrapper.js')) as unknown as {
      default?: (m: SoljsonModule) => unknown;
    };
    const wrap = wrapperMod.default ?? (wrapperMod as unknown as (m: SoljsonModule) => unknown);
    const wrapped = wrap(soljson) as {
      version: () => string;
      semver: () => string;
      compile: SolcInstance['compile'];
    };
    return {
      version: wrapped.semver(),
      longVersion: wrapped.version(),
      binaryPath,
      compile: wrapped.compile.bind(wrapped),
    };
  })();
  inflight.set(key, p);
  try {
    return await p;
  } catch (e) {
    inflight.delete(key);
    throw e;
  }
}

/** List solc versions already cached on disk. Returns clean versions, sorted. */
export async function listInstalledSolc(opts: { cacheDir?: string } = {}): Promise<string[]> {
  const dir = opts.cacheDir ?? defaultCacheDir();
  if (!existsSync(dir)) return [];
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(dir);
  const re = /^soljson-v(\d+\.\d+\.\d+)\+commit\.[0-9a-f]+\.js$/;
  const versions: string[] = [];
  for (const f of files) {
    const m = f.match(re);
    if (m) {
      const v = m[1];
      if (v) versions.push(v);
    }
  }
  return versions.sort();
}
