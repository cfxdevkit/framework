// @ts-nocheck
import { createHash } from 'node:crypto';
import { extname, relative } from 'node:path';
import { root } from './agent-constants.ts';

export function isSecuritySensitive(file) {
  return /keystore|wallet|secret|security|release|workflow|mcp-server|vscode-extension|audit/i.test(
    file,
  );
}

export function isGeneratedPath(file) {
  return (
    file.startsWith('artifacts/') ||
    file.includes('/dist/') ||
    file.includes('/coverage/') ||
    file.includes('/node_modules/')
  );
}

export function tierForPath(path) {
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

export function packageOwner(path) {
  const parts = path.split('/');
  const packageIndex = parts.indexOf('packages');
  if (packageIndex >= 1 && parts[packageIndex + 1])
    return parts.slice(0, packageIndex + 2).join('/');
  if (parts[0] === 'tools' && parts[1]) return parts.slice(0, 2).join('/');
  if (parts[0] === 'projects' && parts[1]) return parts.slice(0, 2).join('/');
  if (parts[0] === 'repos' && parts[1]) return parts.slice(0, 2).join('/');
  return '.';
}

export function languageForPath(path) {
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

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function toRel(path) {
  return relative(root, path).split('\\').join('/');
}
