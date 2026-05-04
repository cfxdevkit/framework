// @ts-nocheck
import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const execFileAsync = promisify(execFile);
export const root = process.cwd();
export const workerDir = dirname(fileURLToPath(import.meta.url));
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
  'tools',
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
