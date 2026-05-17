import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';

export type Severity = 'error' | 'warning' | 'info';

export type Finding = {
  severity?: Severity;
  file?: string;
  line?: number;
  rule?: string;
  issue: string;
  message?: string;
  recommendation?: string;
  text?: string;
};

export type AgentSummary = {
  agent: string;
  status: string;
  findings?: number;
  [key: string]: unknown;
};

export const root = findWorkspaceRoot(process.cwd());
export const artifactsRoot = join(root, 'artifacts', 'llm');

export const generatedDirs = new Set([
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

export const corpusRoots = [
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
  'package.json',
  'pnpm-workspace.yaml',
  '.moon',
  '.github',
];

export const textExtensions = new Set([
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
export const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.sol']);
export const docExtensions = new Set(['.md']);
export const secretNamePattern =
  /(^|[./_-])(\.env|env\.local|secret|secrets|private[-_]?key|mnemonic|passphrase|keystore)([./_-]|$)/i;
export const markdownLinkPattern = /\[[^\]]+\]\(([^)\s]+)\)/g;
export const inlineCodePattern = /`([^`\n]+)`/g;
export const headingPattern = /^(#{1,6})\s+(.+)$/gm;

export function findWorkspaceRoot(start: string): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml')) && existsSync(join(current, 'openspec'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

export async function findFiles(dir: string, name: string): Promise<string[]> {
  const found: string[] = [];
  async function visit(current: string): Promise<void> {
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

export async function writeJsonl(path: string, records: readonly unknown[]): Promise<void> {
  const body = records.map((record) => JSON.stringify(record)).join('\n');
  await writeArtifact(path, body + (records.length ? '\n' : ''));
}

export async function writeJsonReport(path: string, value: unknown): Promise<void> {
  await writeArtifact(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeMarkdownReport(path: string, content: string): Promise<void> {
  await writeArtifact(path, content.endsWith('\n') ? content : `${content}\n`);
}

export async function writeArtifact(path: string, content: string): Promise<void> {
  const abs = join(artifactsRoot, path);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
}

export async function readJsonIfExists<T = unknown>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(join(artifactsRoot, path), 'utf8')) as T;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return null;
    throw error;
  }
}

export function renderFindings(title: string, findings: readonly Finding[]): string {
  const lines = [`# ${title}`, '', `Generated: ${new Date().toISOString()}`, ''];
  if (!findings.length) {
    lines.push('No findings.');
  } else {
    for (const finding of findings) {
      const location = finding.file
        ? `${finding.file}${finding.line ? `:${finding.line}` : ''}: `
        : '';
      lines.push(`- ${finding.severity ?? 'info'}: ${location}${finding.issue}`);
      if (finding.recommendation) lines.push(`  Recommendation: ${finding.recommendation}`);
    }
  }
  return lines.join('\n');
}

export function printSummary(label: string, results: readonly unknown[]): void {
  console.log(`${label} complete`);
  for (const result of results) console.log(JSON.stringify(result));
}

export async function collectCorpusFiles(): Promise<string[]> {
  const files: string[] = [];
  for (const entry of corpusRoots) {
    const abs = join(root, entry);
    try {
      const info = await stat(abs);
      if (info.isDirectory()) await walkCorpus(abs, files);
      if (info.isFile()) await maybeAddCorpusFile(abs, files);
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') throw error;
    }
  }
  return [...new Set(files)].sort((left, right) => toRel(left).localeCompare(toRel(right)));
}

async function walkCorpus(dir: string, files: string[]): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github' && entry.name !== '.moon') continue;
    if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkCorpus(path, files);
    if (entry.isFile()) await maybeAddCorpusFile(path, files);
  }
}

async function maybeAddCorpusFile(path: string, files: string[]): Promise<void> {
  const rel = toRel(path);
  if (isGeneratedPath(rel) || secretNamePattern.test(rel)) return;
  if (!textExtensions.has(extname(rel))) return;
  const info = await stat(path);
  if (info.size > 512 * 1024) return;
  files.push(path);
}

export function chunkFile(path: string, content: string) {
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

export function isGeneratedPath(file: string): boolean {
  return (
    file.startsWith('artifacts/') ||
    file.includes('/dist/') ||
    file.includes('/coverage/') ||
    file.includes('/node_modules/')
  );
}

export function toRel(path: string): string {
  return relative(root, path).split('\\').join('/');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function languageForPath(path: string): string {
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
    }[extname(path)] ?? 'text'
  );
}

export function tierForPath(path: string): string {
  if (path.startsWith('repos/cfx-core')) return 'core';
  if (path.startsWith('repos/cfx-keys')) return 'keys';
  if (path.startsWith('repos/cfx-solidity')) return 'solidity';
  if (path.startsWith('repos/cfx-ui')) return 'ui';
  if (path.startsWith('repos/cfx-domain')) return 'domain';
  if (path.startsWith('repos/cfx-tools')) return 'tools';
  if (path.startsWith('projects/')) return 'project';
  if (path.startsWith('docs/')) return 'docs';
  if (path.startsWith('infrastructure/')) return 'infrastructure';
  return 'root';
}

export function packageOwner(path: string): string {
  const parts = path.split('/');
  const packageIndex = parts.indexOf('packages');
  if (packageIndex >= 1 && parts[packageIndex + 1])
    return parts.slice(0, packageIndex + 2).join('/');
  if (parts[0] === 'projects' && parts[1]) return parts.slice(0, 2).join('/');
  if (parts[0] === 'repos' && parts[1]) return parts.slice(0, 2).join('/');
  return '.';
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
