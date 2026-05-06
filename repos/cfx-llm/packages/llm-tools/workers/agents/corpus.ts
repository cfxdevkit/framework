// @ts-nocheck
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import {
  chunkFile,
  collectCorpusFiles,
  docExtensions,
  extractDocIndex,
  generatedDirs,
  languageForPath,
  packageOwner,
  printSummary,
  secretNamePattern,
  sha256,
  tierForPath,
  toRel,
  writeJsonl,
  writeJsonReport,
} from './runtime/index.ts';

export async function runCorpusAgent(opts = {}) {
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

    for (const chunk of chunkFile(rel, content)) {
      chunkRecords.push(chunk);
    }

    if (docExtensions.has(extname(rel))) {
      docRecords.push(...extractDocIndex(rel, content));
    }
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
  if (!opts.silent) printSummary('llm:corpus', [manifest]);
  return { agent: 'corpus', status: 'ok', ...manifest };
}
