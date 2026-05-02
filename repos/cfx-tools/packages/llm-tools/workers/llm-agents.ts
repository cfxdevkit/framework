#!/usr/bin/env node
// @ts-nocheck
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const root = process.cwd();
const artifactsRoot = join(root, 'artifacts', 'llm');
const generatedDirs = new Set([
  '.git',
  '.gitnexus',
  '.moon',
  '.pnpm-store',
  '.tmp',
  '.vite',
  '.vitest',
  '.cfxdevkit',
  'artifacts',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);
const corpusRoots = [
  'README.md',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
  'MIGRATION.md',
  'SECURITY.md',
  'docs',
  'infrastructure',
  'projects',
  'repos',
  'scripts',
  'tools',
  'package.json',
  'pnpm-workspace.yaml',
  '.moon',
  '.github',
];
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.md',
  '.sol',
  '.sh',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.sol']);
const docExtensions = new Set(['.md']);
const secretNamePattern =
  /(^|[./_-])(\.env|env\.local|secret|secrets|private[-_]?key|mnemonic|passphrase|keystore)([./_-]|$)/i;
const markdownLinkPattern = /\[[^\]]+\]\(([^)\s]+)\)/g;
const inlineCodePattern = /`([^`\n]+)`/g;
const headingPattern = /^(#{1,6})\s+(.+)$/gm;

const command = process.argv[2] ?? 'help';
const commands = new Map([
  ['all', runAll],
  ['corpus', runCorpusAgent],
  ['datasets', runDatasetAgent],
  ['docs', runDocsAgent],
  ['eval', runEvalAgent],
  ['review', runReviewAgent],
  ['serve-check', runServeCheckAgent],
  ['help', runHelp],
]);

if (!commands.has(command)) {
  console.error(`Unknown llm agent command: ${command}`);
  runHelp();
  process.exit(1);
}

await commands.get(command)();

async function runAll() {
  const results = [];
  results.push(await runCorpusAgent({ silent: true }));
  results.push(await runDocsAgent({ silent: true }));
  results.push(await runReviewAgent({ silent: true }));
  results.push(await runDatasetAgent({ silent: true }));
  results.push(await runEvalAgent({ silent: true }));
  results.push(await runServeCheckAgent({ silent: true }));

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'deterministic-agents',
    fineTuning: false,
    results,
  };
  await writeJsonReport('reports/agent-run.json', report);
  await writeMarkdownReport('reports/agent-run.md', renderAgentRun(report));
  printSummary('llm:all', results);
  return report;
}

async function runCorpusAgent(opts = {}) {
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

async function runDatasetAgent(opts = {}) {
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

async function runDocsAgent(opts = {}) {
  const markdownFiles = (await collectCorpusFiles()).filter((file) =>
    docExtensions.has(extname(file)),
  );
  const findings = [];
  for (const filePath of markdownFiles) {
    const rel = toRel(filePath);
    const content = await readFile(filePath, 'utf8');
    findings.push(...(await findBrokenPathRefs(rel, content)));
    findings.push(...findCurrentPlannedDrift(rel, content));
  }

  findings.push(...(await checkMoonRegistration()));
  findings.push(...(await checkPackageExports()));

  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    findings,
  };
  await writeJsonReport('reports/docs-alignment.json', report);
  await writeMarkdownReport(
    'reports/docs-alignment.md',
    renderFindings('Documentation Alignment', findings),
  );
  if (!opts.silent) printSummary('llm:docs', [report]);
  return { agent: 'docs', status: report.status, findings: findings.length };
}

async function runReviewAgent(opts = {}) {
  const changed = await gitChangedFiles();
  const findings = [];
  for (const file of changed) {
    if (isGeneratedPath(file)) {
      findings.push({
        severity: 'warning',
        file,
        issue: 'Generated or artifact path changed',
        recommendation: 'Confirm this file should be committed rather than regenerated locally.',
      });
    }
    if (isSecuritySensitive(file)) {
      findings.push({
        severity: 'warning',
        file,
        issue: 'Security-sensitive surface changed',
        recommendation: 'Run pnpm run security:check plus targeted tests before review.',
      });
    }
  }

  const commands = suggestValidationCommands(changed);
  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    changedFiles: changed,
    findings,
    suggestedValidation: commands,
  };
  await writeJsonReport('reports/review.json', report);
  await writeMarkdownReport('reports/review.md', renderReview(report));
  if (!opts.silent) printSummary('llm:review', [report]);
  return {
    agent: 'review',
    status: report.status,
    changedFiles: changed.length,
    findings: findings.length,
  };
}

async function runEvalAgent(opts = {}) {
  const docsReport = await readJsonIfExists('reports/docs-alignment.json');
  const datasetManifest = await readJsonIfExists('datasets/manifest.json');
  const findings = [];
  if (!docsReport) {
    findings.push({
      severity: 'warning',
      issue: 'docs agent has not run',
      recommendation: 'Run pnpm run llm:docs.',
    });
  } else if (docsReport.status !== 'ok') {
    findings.push({
      severity: 'error',
      issue: 'documentation alignment failed',
      recommendation: 'Review artifacts/llm/reports/docs-alignment.md.',
    });
  }
  if (!datasetManifest) {
    findings.push({
      severity: 'warning',
      issue: 'dataset seed has not been generated',
      recommendation: 'Run pnpm run llm:datasets.',
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    checks: {
      docsAlignment: docsReport?.status ?? 'missing',
      datasetExamples: datasetManifest?.examples ?? 0,
      fineTuning: false,
    },
    findings,
  };
  await writeJsonReport('reports/eval.json', report);
  await writeMarkdownReport('reports/eval.md', renderEval(report));
  if (!opts.silent) printSummary('llm:eval', [report]);
  return { agent: 'eval', status: report.status, findings: findings.length };
}

async function runServeCheckAgent(opts = {}) {
  const configuredBaseUrl = process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL;
  const baseUrls = configuredBaseUrl
    ? [configuredBaseUrl]
    : [
        'http://localhost:13305/',
        'http://127.0.0.1:13305/',
        'http://host.docker.internal:13305/',
        'http://host.containers.internal:13305/',
        'http://127.0.0.1:8000/',
      ];
  const started = performance.now();
  const attempts = [];
  let discoveredBaseUrl = null;
  let models = [];
  for (const baseUrl of baseUrls) {
    for (const path of ['/api/v1/models', '/v1/models', '/models']) {
      const url = new URL(path, baseUrl).toString();
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const text = await response.text();
        const discoveredModels = response.ok ? extractModelInventory(text) : [];
        attempts.push({
          url,
          ok: response.ok,
          status: response.status,
          modelCount: discoveredModels.length,
          bodyPreview: text.slice(0, 500),
        });
        if (response.ok) {
          discoveredBaseUrl = baseUrl;
          models = discoveredModels;
          break;
        }
      } catch (error) {
        attempts.push({ url, ok: false, error: String(error) });
      }
    }
    if (discoveredBaseUrl) break;
  }
  const report = {
    generatedAt: new Date().toISOString(),
    status: discoveredBaseUrl ? 'ok' : 'unavailable',
    baseUrl: discoveredBaseUrl ?? baseUrls[0],
    latencyMs: Math.round(performance.now() - started),
    models,
    attempts,
  };
  await writeJsonReport('reports/serve-check.json', report);
  await writeMarkdownReport('reports/serve-check.md', renderServeCheck(report));
  if (!opts.silent) printSummary('llm:serve-check', [report]);
  return { agent: 'serve-check', status: report.status };
}

function extractModelInventory(text) {
  try {
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
    return data
      .map((model) => ({
        id: typeof model?.id === 'string' ? model.id : undefined,
        checkpoint: typeof model?.checkpoint === 'string' ? model.checkpoint : undefined,
        labels: Array.isArray(model?.labels)
          ? model.labels.filter((label) => typeof label === 'string')
          : [],
        recipe: typeof model?.recipe === 'string' ? model.recipe : undefined,
        size: typeof model?.size === 'number' ? model.size : undefined,
      }))
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}

function runHelp() {
  console.log(`Usage: node scripts/llm-agents.mjs <command>

Commands:
  all          Run all deterministic repo upkeep agents
  corpus       Build file/chunk/doc metadata under artifacts/llm/corpus
  datasets     Build small deterministic eval seed data, not training data
  docs         Check doc path references, package exports, and Moon registration
  eval         Summarize deterministic agent gates
  review       Review current git changes and suggest validation commands
  serve-check  Check Lemonade Server reachability without starting training
`);
}

async function collectCorpusFiles() {
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

async function walk(dir, files) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github' && entry.name !== '.moon') continue;
    if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, files);
    if (entry.isFile()) await maybeAddFile(path, files);
  }
}

async function maybeAddFile(path, files) {
  const rel = toRel(path);
  if (isGeneratedPath(rel) || secretNamePattern.test(rel)) return;
  if (!textExtensions.has(extname(rel))) return;
  const info = await stat(path);
  if (info.size > 512 * 1024) return;
  files.push(path);
}

function chunkFile(path, content) {
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

function extractDocIndex(path, content) {
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

async function findBrokenPathRefs(path, content) {
  const findings = [];
  for (const { raw, source } of extractPathRefs(content)) {
    const ref = raw.split('#')[0];
    if (!looksLikeLocalPath(ref, source)) continue;
    const candidates = resolveDocRefCandidates(path, ref);
    if (candidates.some((candidate) => !candidate.startsWith(root))) {
      findings.push({
        severity: 'error',
        file: path,
        issue: `Path reference escapes repository: ${raw}`,
      });
      continue;
    }
    let found = false;
    for (const candidate of candidates) {
      try {
        await stat(candidate);
        found = true;
        break;
      } catch {
        // try the next candidate
      }
    }
    if (!found) {
      findings.push({
        severity: 'warning',
        file: path,
        issue: `Referenced path does not exist: ${raw}`,
      });
    }
  }
  return findings;
}

function extractPathRefs(content) {
  const refs = [];
  const withoutFencedBlocks = content.replace(/```[\s\S]*?```/g, '');
  for (const match of withoutFencedBlocks.matchAll(markdownLinkPattern)) {
    refs.push({ raw: match[1].trim(), source: 'link' });
  }
  for (const match of withoutFencedBlocks.matchAll(inlineCodePattern)) {
    refs.push({ raw: match[1].trim(), source: 'code' });
  }
  return refs;
}

function findCurrentPlannedDrift(path, content) {
  const findings = [];
  const hasPlanned = /planned|target state|future/i.test(content);
  const hasCurrent = /current|checked-in|present/i.test(content);
  if (hasPlanned && !hasCurrent && path.endsWith('STRUCTURE.md')) {
    findings.push({
      severity: 'warning',
      file: path,
      issue: 'Planned structure language appears without an explicit current-state marker.',
      recommendation: 'Label planned topology separately from checked-in structure.',
    });
  }
  return findings;
}

async function checkMoonRegistration() {
  const findings = [];
  const workspace = await readFile(join(root, '.moon', 'workspace.yml'), 'utf8');
  const registered = new Set(
    workspace
      .split('\n')
      .map((line) => line.match(/^\s*-\s+'([^']+)'/)?.[1])
      .filter(Boolean),
  );
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (rel === '.' || (rel.startsWith('repos/cfx-') && rel.split('/').length === 2)) continue;
    if (rel.startsWith('tools/codegen')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8'));
    if (!pkg.name || (pkg.private === true && rel.startsWith('repos/'))) continue;
    const moonPath = join(root, rel, 'moon.yml');
    try {
      await stat(moonPath);
    } catch {
      continue;
    }
    if (!registered.has(rel)) {
      findings.push({
        severity: 'warning',
        file: '.moon/workspace.yml',
        issue: `Moon project missing package path: ${rel}`,
      });
    }
  }
  return findings;
}

async function checkPackageExports() {
  const findings = [];
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (!rel.startsWith('repos/') && !rel.startsWith('projects/examples/packages/')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8'));
    if (!pkg.exports || typeof pkg.exports !== 'object') continue;
    const vitePath = join(root, rel, 'vite.config.ts');
    let vite = '';
    try {
      vite = await readFile(vitePath, 'utf8');
    } catch {
      findings.push({
        severity: 'warning',
        file: rel,
        issue: 'Package has exports but no vite.config.ts found.',
      });
      continue;
    }
    for (const [exportPath, target] of Object.entries(pkg.exports)) {
      const importPath = typeof target === 'object' && target ? target.import : undefined;
      if (typeof importPath !== 'string') continue;
      const entryName = exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '');
      if (
        !vite.includes(entryName) &&
        !vite.includes(importPath.replace(/^\.\/dist\//, '').replace(/\.js$/, ''))
      ) {
        findings.push({
          severity: 'warning',
          file: `${rel}/package.json`,
          issue: `Export ${exportPath} may not be represented in vite lib entries.`,
        });
      }
    }
  }
  return findings;
}

async function findFiles(dir, name) {
  const found = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      if (entry.isFile() && entry.name === name) found.push(path);
    }
  }
  await visit(dir);
  return found;
}

async function gitChangedFiles() {
  const changed = new Set();
  for (const args of [
    ['diff', '--name-only'],
    ['diff', '--cached', '--name-only'],
    ['ls-files', '--others', '--exclude-standard'],
  ]) {
    const { stdout } = await execFileAsync('git', args, { cwd: root });
    for (const file of stdout.split('\n').filter(Boolean)) {
      changed.add(file);
    }
  }
  return [...changed].sort();
}

function suggestValidationCommands(changed) {
  const commands = new Set();
  if (!changed.length) return ['pnpm run llm:docs', 'pnpm run llm:eval'];
  if (changed.some((file) => /\.(ts|tsx|js|mjs)$/.test(file))) {
    commands.add('pnpm run lint');
    commands.add('pnpm run typecheck');
    commands.add('pnpm exec moon run :test --concurrency 4');
  }
  if (
    changed.some((file) => file.endsWith('.md') || file.endsWith('.yml') || file.endsWith('.yaml'))
  ) {
    commands.add('pnpm run llm:docs');
  }
  if (changed.some(isSecuritySensitive)) {
    commands.add('pnpm run security:check');
  }
  commands.add('pnpm run llm:review');
  return [...commands];
}

function isSecuritySensitive(file) {
  return /keystore|wallet|secret|security|release|workflow|mcp-server|vscode-extension|audit/i.test(
    file,
  );
}

function isGeneratedPath(file) {
  return (
    file.startsWith('artifacts/') ||
    file.includes('/dist/') ||
    file.includes('/coverage/') ||
    file.includes('/node_modules/')
  );
}

function looksLikeLocalPath(ref, source) {
  if (!ref || ref.startsWith('http:') || ref.startsWith('https:') || ref.startsWith('mailto:'))
    return false;
  if (ref.startsWith('#')) return false;
  if (ref.startsWith('/')) return false;
  if (ref.startsWith('@') || ref.includes('@')) return false;
  if (ref.includes('*')) return false;
  if (ref.includes('<') || ref.includes('>') || ref.includes('{') || ref.includes('}'))
    return false;
  if (ref.includes(' ') || ref.includes('\n')) return false;
  if (source === 'code') {
    return /^(\.\.?\/|\.github\/|\.moon\/|docs\/|infrastructure\/|projects\/|repos\/|scripts\/|tools\/|README\.md|ARCHITECTURE\.md|CONTRIBUTING\.md|MIGRATION\.md|SECURITY\.md|package\.json|pnpm-workspace\.yaml|biome\.json)/.test(
      ref,
    );
  }
  return /[/.]/.test(ref);
}

function resolveDocRefCandidates(docPath, ref) {
  const local = resolve(dirname(join(root, docPath)), ref);
  if (ref.startsWith('./') || ref.startsWith('../')) return [local];
  return [local, resolve(root, ref)];
}

function tierForPath(path) {
  if (path.startsWith('repos/cfx-core')) return 'core';
  if (path.startsWith('repos/cfx-keys')) return 'keys';
  if (path.startsWith('repos/cfx-solidity')) return 'solidity';
  if (path.startsWith('repos/cfx-ui')) return 'ui';
  if (path.startsWith('repos/cfx-domain')) return 'domain';
  if (path.startsWith('repos/cfx-tools')) return 'tools';
  if (path.startsWith('projects/')) return 'project';
  if (path.startsWith('tools/')) return 'workspace-tool';
  if (path.startsWith('docs/')) return 'docs';
  if (path.startsWith('infrastructure/')) return 'infrastructure';
  return 'root';
}

function packageOwner(path) {
  const parts = path.split('/');
  const packageIndex = parts.indexOf('packages');
  if (packageIndex >= 1 && parts[packageIndex + 1])
    return parts.slice(0, packageIndex + 2).join('/');
  if (parts[0] === 'tools' && parts[1]) return parts.slice(0, 2).join('/');
  if (parts[0] === 'projects' && parts[1]) return parts.slice(0, 2).join('/');
  if (parts[0] === 'repos' && parts[1]) return parts.slice(0, 2).join('/');
  return '.';
}

function languageForPath(path) {
  const ext = extname(path);
  return (
    {
      '.css': 'css',
      '.html': 'html',
      '.js': 'javascript',
      '.jsx': 'javascriptreact',
      '.json': 'json',
      '.md': 'markdown',
      '.mjs': 'javascript',
      '.sh': 'shell',
      '.sol': 'solidity',
      '.ts': 'typescript',
      '.tsx': 'typescriptreact',
      '.yaml': 'yaml',
      '.yml': 'yaml',
    }[ext] ?? 'text'
  );
}

async function writeJsonl(path, records) {
  await writeArtifact(
    path,
    records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : ''),
  );
}

async function writeJsonReport(path, value) {
  await writeArtifact(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeMarkdownReport(path, content) {
  await writeArtifact(path, content.endsWith('\n') ? content : `${content}\n`);
}

async function writeArtifact(path, content) {
  const abs = join(artifactsRoot, path);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(join(artifactsRoot, path), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

async function readJsonlIfExists(path) {
  try {
    return (await readFile(join(artifactsRoot, path), 'utf8'))
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function renderFindings(title, findings) {
  const lines = [`# ${title}`, '', `Generated: ${new Date().toISOString()}`, ''];
  if (!findings.length) {
    lines.push('No findings.');
  } else {
    for (const finding of findings) {
      lines.push(
        `- ${finding.severity ?? 'info'}: ${finding.file ? `${finding.file}: ` : ''}${finding.issue}`,
      );
      if (finding.recommendation) lines.push(`  Recommendation: ${finding.recommendation}`);
    }
  }
  return lines.join('\n');
}

function renderReview(report) {
  const lines = [
    '# LLM Review Agent Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Changed Files',
    '',
  ];
  lines.push(
    ...(report.changedFiles.length
      ? report.changedFiles.map((file) => `- ${file}`)
      : ['No uncommitted changes detected.']),
  );
  lines.push('', '## Findings', '');
  lines.push(
    report.findings.length
      ? renderFindings('', report.findings).split('\n').slice(3).join('\n')
      : 'No findings.',
  );
  lines.push('', '## Suggested Validation', '');
  lines.push(...report.suggestedValidation.map((command) => `- ${command}`));
  return lines.join('\n');
}

function renderEval(report) {
  return [
    '# LLM Eval Agent Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `Docs alignment: ${report.checks.docsAlignment}`,
    `Dataset examples: ${report.checks.datasetExamples}`,
    `Fine tuning: ${report.checks.fineTuning}`,
    '',
    renderFindings('Findings', report.findings),
  ].join('\n');
}

function renderServeCheck(report) {
  const lines = [
    '# Lemonade Server Check',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    `Base URL: ${report.baseUrl}`,
    `Latency: ${report.latencyMs} ms`,
    `Models: ${report.models.length}`,
    '',
    '## Models',
    '',
  ];
  if (report.models.length) {
    for (const model of report.models) {
      lines.push(`- ${model.id ?? model.checkpoint}${model.size ? ` (${model.size} GB)` : ''}`);
      if (model.labels?.length) lines.push(`  Labels: ${model.labels.join(', ')}`);
    }
  } else {
    lines.push('No models discovered.');
  }
  lines.push('', '## Attempts', '');
  for (const attempt of report.attempts) {
    lines.push(
      `- ${attempt.ok ? 'ok' : 'failed'} ${attempt.url}${attempt.status ? ` (${attempt.status})` : ''}${attempt.modelCount ? `, ${attempt.modelCount} model(s)` : ''}`,
    );
    if (attempt.error) lines.push(`  Error: ${attempt.error}`);
  }
  return lines.join('\n');
}

function renderAgentRun(report) {
  return [
    '# LLM Agent Run',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...report.results.map((result) => `- ${result.agent}: ${result.status}`),
  ].join('\n');
}

function printSummary(label, results) {
  console.log(`${label} complete`);
  for (const result of results) {
    console.log(JSON.stringify(result));
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function toRel(path) {
  return relative(root, path).split('\\').join('/');
}
