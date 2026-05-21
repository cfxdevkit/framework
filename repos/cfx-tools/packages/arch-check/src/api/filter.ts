/**
 * Determines which packages should have generated API.md files.
 *
 * Public packages = non-private packages under repos/*\/packages/ or repos/*\/infra/
 * that have a `dist/` directory (i.e., they produce compiled output).
 *
 * Excluded:
 *  - Private packages
 *  - Config-only packages (biome-config, tsconfig, moon-config, arch-rules)
 *  - Packages without a `dist/` directory
 *  - Application packages without exports (docs-site, etc.)
 */
import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { findFiles, root, toRel } from '../runtime.js';

const CONFIG_PACKAGE_NAMES = new Set([
  '@cfxdevkit/biome-config',
  '@cfxdevkit/tsconfig',
  '@cfxdevkit/moon-config',
  '@cfxdevkit/arch-rules',
]);

const SKIP_PACKAGE_PATTERNS = [/\/docs-site\//, /\/\.next\//];

export type PublicPackageInfo = {
  /** Workspace-relative path to the package directory */
  rel: string;
  /** Package name */
  name: string;
  /** Description from package.json */
  description: string;
  /** Subpath → dist .d.ts path relative to dist/ (e.g., { '.': 'index.d.ts', './client': 'client/index.d.ts' }) */
  subpaths: Record<string, string>;
  /** Absolute path to dist/ directory */
  distDir: string;
  /** Absolute path to API.md (may not exist yet) */
  apiMdPath: string;
};

export async function discoverPublicPackages(): Promise<PublicPackageInfo[]> {
  const results: PublicPackageInfo[] = [];
  for (const pkgJsonPath of await findFiles(root, 'package.json')) {
    const rel = toRel(dirname(pkgJsonPath));
    // Only packages under repos/*/packages/ or repos/*/infra/
    if (
      !/^repos\/[^/]+\/(packages|infra)\//.test(rel) &&
      !/^projects\/examples\/packages\//.test(rel)
    ) {
      continue;
    }
    if (SKIP_PACKAGE_PATTERNS.some((p) => p.test(rel))) continue;

    let pkg: {
      name?: string;
      private?: boolean;
      description?: string;
      exports?: Record<string, unknown>;
    };
    try {
      pkg = JSON.parse(await readFile(pkgJsonPath, 'utf8'));
    } catch {
      continue;
    }
    if (!pkg.name) continue;
    if (pkg.private === true) continue;
    if (CONFIG_PACKAGE_NAMES.has(pkg.name)) continue;

    const distDir = join(root, rel, 'dist');
    try {
      await stat(distDir);
    } catch {
      continue; // no dist/, skip
    }

    // Resolve subpath → d.ts path
    const subpaths: Record<string, string> = {};
    const exportsMap = pkg.exports ?? {
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    };
    for (const [key, value] of Object.entries(exportsMap)) {
      if (key === './package.json') continue;
      const typesPath =
        typeof value === 'string'
          ? value
          : typeof value === 'object' && value
            ? ((value as Record<string, unknown>).types as string | undefined)
            : undefined;
      if (!typesPath || typeof typesPath !== 'string') continue;
      // Convert "./dist/foo/index.d.ts" → "foo/index.d.ts"
      const dtsRelative = typesPath.replace(/^\.\/dist\//, '');
      subpaths[key] = dtsRelative;
    }

    results.push({
      rel,
      name: pkg.name,
      description: pkg.description ?? '',
      subpaths,
      distDir,
      apiMdPath: join(root, rel, 'API.md'),
    });
  }
  return results;
}
