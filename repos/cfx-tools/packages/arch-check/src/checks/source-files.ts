import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { generatedDirs, root, toRel } from '../runtime.js';

export const repoSourceExtensions = new Set(
  '.cjs .css .js .jsx .mjs .mts .sol .ts .tsx'.split(' '),
);

const generatedFileNames = new Set('generated.ts generated.js'.split(' '));

export async function collectRepoSourceFiles(startDir = root): Promise<string[]> {
  const files: string[] = [];
  await walkRepoSourceFiles(startDir, files);
  return files.sort((left, right) => toRel(left).localeCompare(toRel(right)));
}

export function isGeneratedRepoSourcePath(path: string): boolean {
  const parts = path.split('/');
  const basename = parts.at(-1) ?? '';
  return (
    parts.some((part) => generatedDirs.has(part)) ||
    basename.endsWith('.d.ts') ||
    generatedFileNames.has(basename) ||
    basename.endsWith('.generated.d.ts') ||
    basename.endsWith('.generated.ts') ||
    basename.endsWith('.generated.js')
  );
}

export function countFileLines(content: string): number {
  if (!content) return 0;
  return content.split('\n').length - (content.endsWith('\n') ? 1 : 0);
}

async function walkRepoSourceFiles(dir: string, files: string[]): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github' && entry.name !== '.moon') {
      continue;
    }
    if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;

    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkRepoSourceFiles(path, files);
      continue;
    }

    if (
      entry.isFile() &&
      repoSourceExtensions.has(extname(entry.name)) &&
      !isGeneratedRepoSourcePath(toRel(path))
    ) {
      files.push(path);
    }
  }
}
