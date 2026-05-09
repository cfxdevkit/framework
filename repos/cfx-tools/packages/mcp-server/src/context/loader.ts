import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DeployedContracts, McpConfig, ProjectContext } from './types.js';

function tryReadJson<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function tryReadFile(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Detect project context from the current working directory.
 * Reads .mcp.json, package.json, pnpm-workspace.yaml, deployments/contracts.json,
 * and wagmi.config.ts/js to build a {@link ProjectContext} snapshot.
 */
export function detectProjectContext(cwd: string): ProjectContext {
  const packageJsonPath = join(cwd, 'package.json');
  const mcpConfigPath = join(cwd, '.mcp.json');
  const pnpmWorkspacePath = join(cwd, 'pnpm-workspace.yaml');
  const contractsJsonPath = join(cwd, 'deployments', 'contracts.json');

  const packageJson = tryReadJson<{ name?: string; version?: string }>(packageJsonPath);
  const mcpConfig = tryReadJson<McpConfig>(mcpConfigPath);
  const deployedContracts = tryReadJson<DeployedContracts>(contractsJsonPath);

  const isMonorepo = tryReadFile(pnpmWorkspacePath);
  const hasFrontend =
    tryReadFile(join(cwd, 'wagmi.config.ts')) || tryReadFile(join(cwd, 'wagmi.config.js'));
  const isProject = packageJson !== null || mcpConfig !== null;

  return {
    cwd,
    isProject,
    projectName: packageJson?.name ?? null,
    projectVersion: packageJson?.version ?? null,
    isMonorepo,
    deployedContracts,
    hasFrontend,
    mcpConfig,
  };
}
