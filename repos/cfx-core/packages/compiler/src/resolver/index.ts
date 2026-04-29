/**
 * Import resolver implementations.
 *
 * - `npmResolver` — resolves `import "@scope/pkg/path/file.sol"` against
 *   `node_modules/` (Node-style; no fancy package-exports support, just
 *   straight file lookup, which is what solc consumers expect).
 * - `remappingResolver` — Foundry-style `prefix=path` rewrites that delegate
 *   to a filesystem read.
 * - `compose` — short-circuits across a list of resolvers.
 */
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve as resolvePath } from 'node:path';
import type { ImportResolver, Source } from '../types.js';

/**
 * Walk up from `start` looking for `node_modules/<importPath>`. Returns the
 * first match. Mirrors Node's resolution algorithm enough for solc's needs.
 */
async function findInNodeModules(start: string, importPath: string): Promise<string | null> {
  let dir = resolvePath(start);
  while (dir.length > 0) {
    const candidate = join(dir, 'node_modules', importPath);
    if (existsSync(candidate)) {
      const st = await stat(candidate);
      if (st.isFile()) return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/**
 * Resolves npm-style imports (`@openzeppelin/contracts/...`) against
 * `node_modules`. `rootDir` defaults to `process.cwd()`.
 */
export function npmResolver(opts: { rootDir?: string } = {}): ImportResolver {
  const root = opts.rootDir ?? process.cwd();
  return {
    async resolve({ importPath }): Promise<Source | null> {
      // Skip relative / absolute paths — those are not npm imports.
      if (importPath.startsWith('.') || isAbsolute(importPath)) return null;
      const found = await findInNodeModules(root, importPath);
      if (!found) return null;
      const content = await readFile(found, 'utf8');
      return { path: importPath, content };
    },
  };
}

/**
 * Foundry-style remappings: `["@oz/=node_modules/@openzeppelin/"]`. The
 * longest matching prefix wins. Resolved paths are read from the filesystem.
 */
export function remappingResolver(remappings: readonly string[]): ImportResolver {
  const parsed = remappings
    .map((r) => {
      const idx = r.indexOf('=');
      if (idx <= 0) return null;
      return { prefix: r.slice(0, idx), target: r.slice(idx + 1) } as const;
    })
    .filter((x): x is { prefix: string; target: string } => x !== null)
    // Longest prefix first so `@oz/contracts/=...` beats `@oz/=...`.
    .sort((a, b) => b.prefix.length - a.prefix.length);
  return {
    async resolve({ importPath }): Promise<Source | null> {
      for (const { prefix, target } of parsed) {
        if (!importPath.startsWith(prefix)) continue;
        const remainder = importPath.slice(prefix.length);
        const path = isAbsolute(target) ? join(target, remainder) : resolvePath(target, remainder);
        if (!existsSync(path)) continue;
        const st = await stat(path);
        if (!st.isFile()) continue;
        const content = await readFile(path, 'utf8');
        return { path: importPath, content };
      }
      return null;
    },
  };
}

/** Try each resolver in order; return the first non-null hit. */
export function compose(resolvers: readonly ImportResolver[]): ImportResolver {
  return {
    async resolve(input): Promise<Source | null> {
      for (const r of resolvers) {
        const out = await r.resolve(input);
        if (out) return out;
      }
      return null;
    },
  };
}
