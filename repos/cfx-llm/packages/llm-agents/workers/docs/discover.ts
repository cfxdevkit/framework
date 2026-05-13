import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readContextFile } from '../completion/index.ts';
import { root } from '../shared/index.ts';
import { unique } from '../shared/logging.ts';

export function parseDocsUpkeepFlags(args) {
  const promptParts = [];
  const scopes = [];
  let model = null;
  let quick = false;
  let docsOnly = false;
  let write = false;
  let yes = false;
  let agent = 'direct';
  let maxFolders = Number.POSITIVE_INFINITY;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') model = args[++index];
    else if (arg === '--agent') agent = args[++index];
    else if (arg === '--quick') quick = true;
    else if (arg === '--docs-only') docsOnly = true;
    else if (arg === '--write') write = true;
    else if (arg === '--yes' || arg === '-y') yes = true;
    else if (arg === '--scope') scopes.push(args[++index]);
    else if (arg === '--max-folders') maxFolders = Number(args[++index]);
    else promptParts.push(arg);
  }
  if (agent !== 'direct') {
    throw new Error('Docs upkeep --agent must be: direct');
  }
  return {
    prompt: promptParts.join(' ').trim(),
    model,
    agent,
    quick,
    docsOnly,
    write,
    yes,
    scopes: scopes.filter(Boolean),
    maxFolders:
      Number.isFinite(maxFolders) && maxFolders > 0 ? maxFolders : Number.POSITIVE_INFINITY,
  };
}

export async function discoverDocsUpkeepScopes(flags) {
  const files = (await collectDocsUpkeepFiles(flags.docsOnly)) as string[];
  const scopeFilters: string[] = (flags.scopes as string[]).map(normalizeScopeFilter);
  const groups = new Map();
  for (const file of files) {
    if (scopeFilters.length && !scopeFilters.some((scope) => file.startsWith(scope))) continue;
    const dir = dirname(file) === '.' ? 'root' : dirname(file);
    if (!groups.has(dir)) {
      groups.set(dir, {
        label: dir,
        dir,
        files: [],
        branch: docsUpkeepBranch(dir, scopeFilters),
        depth: docsUpkeepDepth(dir),
      });
    }
    groups.get(dir).files.push(file);
  }
  return [...groups.values()]
    .map((scope) => ({ ...scope, files: scope.files.sort() }))
    .sort(compareDocsUpkeepScopes)
    .slice(0, flags.maxFolders);
}

export function groupDocsUpkeepScopesByBranch(scopes) {
  const groups = new Map();
  for (const scope of scopes) {
    const branch = scope.branch ?? docsUpkeepBranch(scope.dir, []);
    if (!groups.has(branch)) groups.set(branch, []);
    groups.get(branch).push(scope);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => compareDocsUpkeepBranches(left, right))
    .map(([branch, branchScopes]) => ({
      branch,
      scopes: branchScopes.sort(compareDocsUpkeepScopes),
    }));
}

export function compareDocsUpkeepScopes(left, right) {
  const branchOrder = compareDocsUpkeepBranches(left.branch, right.branch);
  if (branchOrder !== 0) return branchOrder;
  if (right.depth !== left.depth) return right.depth - left.depth;
  return left.label.localeCompare(right.label);
}

export function compareDocsUpkeepBranches(left, right) {
  if (left === 'root' && right !== 'root') return 1;
  if (right === 'root' && left !== 'root') return -1;
  return left.localeCompare(right);
}

export function docsUpkeepBranch(dir, scopeFilters) {
  if (dir === 'root') return 'root';
  const matchingScope = scopeFilters
    .filter((scope) => dir === scope || dir.startsWith(`${scope}/`))
    .sort((left, right) => docsUpkeepDepth(right) - docsUpkeepDepth(left))[0];
  if (matchingScope) return matchingScope;
  return dir.split('/')[0];
}

export function docsUpkeepDepth(dir) {
  return dir === 'root' ? 0 : dir.split('/').length;
}

export async function collectDocsUpkeepFiles(docsOnly) {
  const files = [];
  const isDocFile = (file) => file.endsWith('.md') || file.endsWith('.mdx');
  if (docsOnly) {
    await walkDocsFiles(join(root, 'docs'), files, isDocFile);
  } else {
    await walkDocsFiles(root, files, isDocFile);
  }
  return unique(files.map((file) => file.replace(`${root}/`, ''))).filter(
    (file) => !isIgnoredDocsPath(file),
  );
}

export async function walkDocsFiles(dir, files, predicate) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    if (
      entry.name.startsWith('.') &&
      !['.changeset', '.devcontainer', '.github'].includes(entry.name)
    )
      continue;
    if (['artifacts', 'dist', 'node_modules', 'coverage', '.moon'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkDocsFiles(path, files, predicate);
    if (entry.isFile() && predicate(path)) files.push(path);
  }
}

export function isIgnoredDocsPath(file) {
  return (
    file.startsWith('artifacts/') ||
    file.startsWith('node_modules/') ||
    file.includes('/node_modules/') ||
    file.includes('/dist/') ||
    file.includes('/coverage/') ||
    file.startsWith('.moon/') ||
    // GitNexus-generated wiki content — do not edit with docs-upkeep
    file.startsWith('repos/cfx-tools/packages/docs-site/content/wiki/')
  );
}

export function normalizeScopeFilter(scope) {
  return scope.replace(/^\.\//, '').replace(/\/$/, '');
}

export async function buildDocsUpkeepBaseContext(docsScan, flags) {
  const files = await Promise.all([
    readContextFile('README.md'),
    readContextFile('ARCHITECTURE.md'),
    readContextFile('docs/README.md'),
    readContextFile('docs/STRUCTURE.md'),
    readContextFile('artifacts/llm/reports/docs-alignment.md'),
  ]);
  return [docsScan, ...files]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, flags.quick ? 8000 : 20000);
}
