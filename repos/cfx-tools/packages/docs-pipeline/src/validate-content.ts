import { compile } from '@mdx-js/mdx';
import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';

import { getDocsSitePaths } from './workspace.js';

export type ValidationError = {
  rel: string;
  message: string;
};

export type ValidationResult = {
  checkedFiles: number;
  errors: ValidationError[];
};

async function collectMdx(dir: string, relBase = ''): Promise<Array<{ rel: string; abs: string }>> {
  const collected: Array<{ rel: string; abs: string }> = [];
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return collected;
  }

  for (const entry of entries) {
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      collected.push(...(await collectMdx(path.join(dir, entry.name), rel)));
    } else if (entry.name.endsWith('.mdx')) {
      collected.push({ rel, abs: path.join(dir, entry.name) });
    }
  }

  return collected;
}

export async function validateGeneratedContent(): Promise<ValidationResult> {
  const { contentDir } = getDocsSitePaths();
  const allFiles = (await collectMdx(contentDir)).sort((left, right) =>
    left.rel.localeCompare(right.rel),
  );
  const errors: ValidationError[] = [];

  for (const { rel, abs } of allFiles) {
    const content = await fs.readFile(abs, 'utf8');
    try {
      await compile(content, {
        remarkPlugins: [remarkGfm, remarkFrontmatter],
        jsx: true,
        outputFormat: 'function-body',
      });
      console.log(`  ✓  ${rel}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message.split('\n').slice(0, 3).join(' | ') : String(error);
      console.error(`  ✗  ${rel}: ${message}`);
      errors.push({ rel, message });
    }
  }

  console.log(`\nSummary: ${allFiles.length} file(s) checked, ${errors.length} error(s).`);
  return { checkedFiles: allFiles.length, errors };
}
