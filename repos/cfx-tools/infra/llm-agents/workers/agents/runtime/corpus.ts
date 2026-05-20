import { readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  corpusRoots,
  generatedDirs,
  headingPattern,
  root,
  secretNamePattern,
  sourceExtensions,
  textExtensions,
} from './constants.ts';
import {
  isGeneratedPath,
  languageForPath,
  packageOwner,
  sha256,
  tierForPath,
  toRel,
} from './paths.ts';

export async function collectCorpusFiles() {
  const files = [];
  for (const entry of corpusRoots) {
    const abs = join(root, entry);
    try {
      const info = await stat(abs);
      if (info.isDirectory()) await walk(abs, files);
      if (info.isFile()) await maybeAddFile(abs, files);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return [...new Set(files)].sort((left, right) => toRel(left).localeCompare(toRel(right)));
}

export async function walk(dir, files) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github' && entry.name !== '.moon') continue;
    if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, files);
    if (entry.isFile()) await maybeAddFile(path, files);
  }
}

export async function maybeAddFile(path, files) {
  const rel = toRel(path);
  if (isGeneratedPath(rel) || secretNamePattern.test(rel)) return;
  if (!textExtensions.has(extname(rel))) return;
  const info = await stat(path);
  if (info.size > 512 * 1024) return;
  files.push(path);
}

export function chunkFile(path, content) {
  const lines = content.split('\n');
  const chunks = [];
  const chunkSize = sourceExtensions.has(extname(path)) ? 80 : 60;
  for (let start = 0; start < lines.length; start += chunkSize) {
    const chunkLines = lines.slice(start, start + chunkSize);
    chunks.push({
      path,
      chunkId: `${path}:${start + 1}`,
      startLine: start + 1,
      endLine: start + chunkLines.length,
      language: languageForPath(path),
      sha256: sha256(chunkLines.join('\n')),
      text: chunkLines.join('\n'),
    });
  }
  return chunks;
}

export function extractDocIndex(path, content) {
  const records = [];
  for (const match of content.matchAll(headingPattern)) {
    records.push({
      path,
      depth: match[1].length,
      heading: match[2].trim(),
      package: packageOwner(path),
      tier: tierForPath(path),
    });
  }
  return records;
}
