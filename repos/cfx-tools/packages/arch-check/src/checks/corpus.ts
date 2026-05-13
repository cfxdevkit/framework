import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import {
  type AgentSummary,
  chunkFile,
  collectCorpusFiles,
  docExtensions,
  generatedDirs,
  headingPattern,
  languageForPath,
  packageOwner,
  printSummary,
  secretNamePattern,
  sha256,
  tierForPath,
  toRel,
  writeJsonl,
  writeJsonReport,
} from '../runtime.js';

export async function runCorpusCheck(opts: { silent?: boolean } = {}): Promise<AgentSummary> {
  const files = await collectCorpusFiles();
  const fileRecords = [];
  const chunkRecords = [];
  const docRecords = [];

  for (const filePath of files) {
    const rel = toRel(filePath);
    const content = await readFile(filePath, 'utf8');
    const record = {
      path: rel,
      package: packageOwner(rel),
      tier: tierForPath(rel),
      language: languageForPath(rel),
      bytes: Buffer.byteLength(content),
      sha256: sha256(content),
    };
    fileRecords.push(record);
    chunkRecords.push(...chunkFile(rel, content));
    if (docExtensions.has(extname(rel))) docRecords.push(...extractDocIndex(rel, content));
  }

  await writeJsonl('corpus/files.jsonl', fileRecords);
  await writeJsonl('corpus/chunks.jsonl', chunkRecords);
  await writeJsonl('corpus/docs-index.jsonl', docRecords);
  const manifest = {
    generatedAt: new Date().toISOString(),
    files: fileRecords.length,
    chunks: chunkRecords.length,
    docs: docRecords.length,
    exclusions: {
      generatedDirs: [...generatedDirs].sort(),
      secretNamePattern: String(secretNamePattern),
    },
  };
  await writeJsonReport('corpus/manifest.json', manifest);
  if (!opts.silent) printSummary('check:corpus', [manifest]);
  return { agent: 'corpus', status: 'ok', ...manifest };
}

function extractDocIndex(path: string, content: string) {
  const records = [];
  for (const match of content.matchAll(headingPattern)) {
    const marker = match[1] ?? '';
    const heading = match[2] ?? '';
    records.push({
      path,
      depth: marker.length,
      heading: heading.trim(),
      package: packageOwner(path),
      tier: tierForPath(path),
    });
  }
  return records;
}
