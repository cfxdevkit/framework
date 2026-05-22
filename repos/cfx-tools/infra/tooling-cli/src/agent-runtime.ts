import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

export function relativeConfigPath(): string {
  const repoRoot = findRepoRoot(process.cwd());
  return relative(process.cwd(), join(repoRoot, 'artifacts', 'llm', 'config', 'llm.json')) ||
    'artifacts/llm/config/llm.json';
}

export async function withLlmClient<T>(
  run: (client: typeof import('../../llm-client/src/index.js')) => Promise<T> | T,
): Promise<T> {
  return runInRepoRoot(async () => run(await import('../../llm-client/src/index.js')));
}

export async function withLlmAgents<T>(
  run: (agents: typeof import('../../llm-agents/src/index.js')) => Promise<T> | T,
): Promise<T> {
  return runInRepoRoot(async () => run(await import('../../llm-agents/src/index.js')));
}

export async function runInRepoRoot<T>(work: () => Promise<T> | T): Promise<T> {
  const previousCwd = process.cwd();
  const repoRoot = findRepoRoot(previousCwd);
  if (repoRoot === previousCwd) return await work();

  process.chdir(repoRoot);
  try {
    return await work();
  } finally {
    process.chdir(previousCwd);
  }
}

export function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (current !== relativeParent(current)) {
    if (existsSync(`${current}/pnpm-workspace.yaml`) && existsSync(`${current}/package.json`)) {
      return current;
    }
    current = relativeParent(current);
  }
  return startDir;
}

export function relativeParent(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parent = normalized.slice(0, normalized.lastIndexOf('/')) || normalized;
  return parent === normalized ? normalized : parent;
}

export function isUnknownWorkflowError(
  error: unknown,
  mode: 'deterministic' | 'exploratory',
): boolean {
  return error instanceof Error && error.message.startsWith(`Unknown ${mode} workflow:`);
}

export function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}

export function parseBoolean(value: string | undefined, key: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${key} must be true or false`);
}

export function formatBoolean(value: boolean): string {
  return value ? 'yes' : 'no';
}