import { existsSync } from 'node:fs';
import nextra from 'nextra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Walk up from the package directory to find the pnpm workspace root
// (the directory containing pnpm-workspace.yaml). Turbopack needs this
// as its root so it can resolve 'next' through pnpm's .pnpm symlink store.
function findWorkspaceRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return startDir; // filesystem root fallback
    dir = parent;
  }
}

const withNextra = nextra({
  defaultShowCopyCode: true,
});

// biome-ignore lint: Next.js requires default export for config
export default withNextra({
  reactStrictMode: true,
  turbopack: {
    root: findWorkspaceRoot(__dirname),
  },
});
