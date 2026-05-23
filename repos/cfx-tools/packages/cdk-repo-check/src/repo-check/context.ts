import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import type { GitNexusRepositorySummary, GitNexusSnapshot } from './types.js';

const execFileAsync = promisify(execFile);

let gitNexusSnapshotPromise: Promise<GitNexusSnapshot | null> | undefined;

export async function getGitNexusSnapshot(workspaceRoot: string): Promise<GitNexusSnapshot | null> {
  if (!gitNexusSnapshotPromise) {
    gitNexusSnapshotPromise = loadGitNexusSnapshot(workspaceRoot);
  }

  return await gitNexusSnapshotPromise;
}

async function loadGitNexusSnapshot(workspaceRoot: string): Promise<GitNexusSnapshot | null> {
  try {
    const [statusResult, listResult] = await Promise.all([
      execFileAsync('pnpm', ['exec', 'gitnexus', 'status'], {
        cwd: workspaceRoot,
        maxBuffer: 1024 * 1024 * 5,
      }),
      execFileAsync('pnpm', ['exec', 'gitnexus', 'list'], {
        cwd: workspaceRoot,
        maxBuffer: 1024 * 1024 * 5,
      }),
    ]);

    const statusFields = parseKeyValueLines(statusResult.stdout);
    return {
      repository: statusFields.get('Repository') ?? workspaceRoot,
      indexedAt: statusFields.get('Indexed') ?? null,
      indexedCommit: statusFields.get('Indexed commit') ?? null,
      currentCommit: statusFields.get('Current commit') ?? null,
      status: statusFields.get('Status') ?? null,
      repositories: parseGitNexusList(listResult.stdout),
    };
  } catch {
    return null;
  }
}

function parseKeyValueLines(output: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const rawLine of output.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;
    fields.set(line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim());
  }
  return fields;
}

function parseGitNexusList(output: string): GitNexusRepositorySummary[] {
  const repositories: GitNexusRepositorySummary[] = [];
  let current: GitNexusRepositorySummary | null = null;

  for (const rawLine of output.split('\n')) {
    if (rawLine.includes('Indexed Repositories')) {
      continue;
    }

    const repoMatch = rawLine.match(/^\s{2}([^\s].*?)\s+\((.+)\)$/);
    if (repoMatch) {
      current = {
        name: repoMatch[1]?.trim() ?? 'unknown',
        path: repoMatch[2]?.trim() ?? '',
        indexedAt: null,
        commit: null,
        stats: { files: null, symbols: null, edges: null },
        clusters: null,
        processes: null,
      };
      repositories.push(current);
      continue;
    }

    if (!current) continue;
    const line = rawLine.trim();
    if (!line) continue;
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === 'Path') current.path = value;
    else if (key === 'Indexed') current.indexedAt = value;
    else if (key === 'Commit') current.commit = value;
    else if (key === 'Stats') current.stats = parseGitNexusStats(value);
    else if (key === 'Clusters') current.clusters = parseNullableNumber(value);
    else if (key === 'Processes') current.processes = parseNullableNumber(value);
  }

  return repositories;
}

function parseGitNexusStats(value: string): GitNexusRepositorySummary['stats'] {
  const match = value.match(/(\d+) files,\s*(\d+) symbols,\s*(\d+) edges/);
  if (!match) {
    return { files: null, symbols: null, edges: null };
  }

  return {
    files: Number(match[1]),
    symbols: Number(match[2]),
    edges: Number(match[3]),
  };
}

function parseNullableNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized || normalized === 'unknown') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function countLines(value: string): number {
  if (!value) return 0;
  return value.split(/\r?\n/).filter((line) => line.length > 0).length;
}

export function tailLines(value: string, count = 20): string[] {
  return value
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .slice(-count);
}

export async function writeJson(
  workspaceRoot: string,
  relativePath: string,
  value: unknown,
): Promise<void> {
  const absPath = join(workspaceRoot, relativePath);
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function writeDirectoryNodeJson(
  workspaceRoot: string,
  directoryNodeRoot: string,
  directory: string,
  fileName: string,
  value: unknown,
): Promise<void> {
  const normalizedDirectory = normalizeRelativePath(directory);
  const relativePath =
    normalizedDirectory === '.'
      ? join(directoryNodeRoot, '_root', fileName)
      : join(directoryNodeRoot, normalizedDirectory, fileName);
  await writeJson(workspaceRoot, relativePath, value);
}

export function normalizeRelativePath(value: string): string {
  const normalized = value.split('\\').join('/');
  return normalized === '' ? '.' : normalized;
}

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
