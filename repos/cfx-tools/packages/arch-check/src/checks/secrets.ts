import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { type Finding, isNodeError, root, toRel } from '../runtime.js';

export type SecretScanResult = {
  status: 'ok' | 'error';
  findings: Finding[];
};

type SecretRule = {
  name: string;
  pattern: RegExp;
  message: string;
};

const scanRoots = ['repos', 'projects', 'scripts'];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const ignoredDirs = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.next',
  '.moon',
  '.git',
  '.turbo',
  '.vite',
  '.vitest',
]);

const rules: SecretRule[] = [
  {
    name: 'no-vscode-state-secret-persistence',
    pattern:
      /workspaceState\.update\([^\n]*(STATE_.*(MNEMONIC|PRIVATE_KEY|PASSPHRASE|SECRET)|\b(mnemonic|privateKey|passphrase|secret)\b)/,
    message: 'Do not persist mnemonic/private-key/passphrase material in VS Code workspaceState.',
  },
  {
    name: 'no-secret-output-channel',
    pattern:
      /appendLine\([^\n]*(\$\{[^}]*\b(mnemonic|privateKey|passphrase|secret)\b|\b(mnemonic|privateKey|passphrase|secret)\b\s*[),.])/,
    message: 'Do not write mnemonic/private-key/passphrase material to output channels.',
  },
  {
    name: 'no-secret-console-output',
    pattern:
      /console\.(log|info|warn|error)\([^\n]*(\$\{[^}]*\b(mnemonic|privateKey|passphrase|secret)\b|\b(mnemonic|privateKey|passphrase|secret)\b\s*[),.])/,
    message: 'Do not write mnemonic/private-key/passphrase material to console output.',
  },
  {
    name: 'no-recovery-mnemonic-output-label',
    pattern: /appendLine\([^\n]*Recovery mnemonic/i,
    message: 'Do not expose recovery mnemonic labels in runtime output.',
  },
];

export async function runSecretsCheck(): Promise<SecretScanResult> {
  const findings: Finding[] = [];
  for (const dir of scanRoots) await walk(join(root, dir), findings);
  return { status: findings.length ? 'error' : 'ok', findings };
}

async function walk(dir: string, findings: Finding[]): Promise<void> {
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, findings);
      continue;
    }
    if (!entry.isFile() || !allowedExtensions.has(extname(entry.name))) continue;
    await scanFile(path, findings);
  }
}

async function scanFile(path: string, findings: Finding[]): Promise<void> {
  const rel = toRel(path);
  const content = await readFile(path, 'utf8');
  const lines = content.split('\n');
  for (const [index, text] of lines.entries()) {
    const trimmed = text.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    for (const rule of rules) {
      if (!rule.pattern.test(text)) continue;
      findings.push({
        severity: 'error',
        file: rel,
        line: index + 1,
        rule: rule.name,
        issue: rule.message,
        message: rule.message,
        text,
      });
    }
  }
}
