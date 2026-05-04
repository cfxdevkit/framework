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
  readJsonlIfExists,
  secretNamePattern,
  sha256,
  sourceExtensions,
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

export async function runDatasetAgent(opts = {}) {
  const files = await readJsonlIfExists('corpus/files.jsonl');
  const docs = await readJsonlIfExists('corpus/docs-index.jsonl');
  const sourceExamples = files
    .filter((file) => sourceExtensions.has(extname(file.path)))
    .slice(0, 50)
    .map((file) => ({
      task: 'classify-package-boundary',
      input: { path: file.path, language: file.language },
      expected: { tier: file.tier, package: file.package },
      source: 'deterministic-corpus',
    }));
  const docExamples = docs.slice(0, 50).map((doc) => ({
    task: 'answer-doc-heading-location',
    input: { heading: doc.heading },
    expected: { path: doc.path, depth: doc.depth },
    source: 'deterministic-doc-index',
  }));
  const reviewExamples = [
    {
      task: 'review-security-sensitive-change',
      input: { touchedPath: 'repos/cfx-keys/packages/services/src/keystore/file/index.ts' },
      expected: { requiredValidation: ['pnpm run security:check', 'pnpm run typecheck'] },
      source: 'policy-seed',
    },
    {
      task: 'review-doc-only-change',
      input: { touchedPath: 'docs/llm-fine-tuning-plan.md' },
      expected: { requiredValidation: ['pnpm run llm:docs'] },
      source: 'policy-seed',
    },
  ];

  const examples = [...sourceExamples, ...docExamples, ...reviewExamples];
  await writeJsonl('datasets/agent-eval.jsonl', examples);
  const manifest = {
    generatedAt: new Date().toISOString(),
    examples: examples.length,
    fineTuning: false,
    note: 'Evaluation seed data only. No training dataset is promoted by this agent.',
  };
  await writeJsonReport('datasets/manifest.json', manifest);
  if (!opts.silent) printSummary('llm:datasets', [manifest]);
  return { agent: 'datasets', status: 'ok', ...manifest };
}
