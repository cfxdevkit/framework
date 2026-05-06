#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const roots = ['repos', 'projects', 'tools', 'scripts'];
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
const ignoredFiles = new Set(['scripts/check-secret-leaks.mjs']);

const rules = [
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

const findings = [];

for (const dir of roots) {
  await walk(join(root, dir));
}

if (findings.length) {
  console.error('Secret leak scan failed:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
    console.error(`  ${finding.text.trim()}`);
  }
  process.exit(1);
}

console.log('Secret leak scan passed.');

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!entry.isFile() || !allowedExtensions.has(extensionOf(entry.name))) continue;
    await scanFile(path);
  }
}

async function scanFile(path) {
  const rel = relative(root, path);
  if (ignoredFiles.has(rel)) return;

  const content = await readFile(path, 'utf8');
  const lines = content.split('\n');
  for (const [index, text] of lines.entries()) {
    const trimmed = text.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    for (const rule of rules) {
      if (!rule.pattern.test(text)) continue;
      findings.push({
        file: rel,
        line: index + 1,
        rule: rule.name,
        message: rule.message,
        text,
      });
    }
  }
}

function extensionOf(name) {
  const index = name.lastIndexOf('.');
  return index === -1 ? '' : name.slice(index);
}
