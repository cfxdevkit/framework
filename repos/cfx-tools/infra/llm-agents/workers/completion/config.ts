import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  agentConfigPathEnvVar,
  configPath,
  configPathEnvVar,
  legacyCompatConfigPath,
  legacyConfigPath,
} from '../shared/index.ts';
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  defaultConfig,
  mergeConfigLayers,
  normalizeConfig,
} from './config-normalize.ts';
import { isErrnoException } from './guards.ts';
import type { LlmConfig } from './types.ts';
import { findMonorepoUnitByConfigPath } from './units.ts';

export async function readConfig(configFile = resolveConfiguredConfigPath()): Promise<LlmConfig> {
  const { config: baseConfig, path: basePath } = await loadBaseConfig();
  const normalizedBase = normalizeConfig(baseConfig ?? defaultConfig());

  if (normalizePath(configFile) === normalizePath(basePath)) {
    return normalizedBase;
  }

  const scopedConfig = await readConfigFile(configFile);
  if (!scopedConfig) {
    return normalizedBase;
  }

  if (isScopedOverlayPath(configFile)) {
    return mergeConfigLayers(normalizedBase, scopedConfig);
  }

  return normalizeConfig(scopedConfig);
}

export async function writeConfig(
  config: LlmConfig,
  configFile = resolveConfiguredConfigPath(),
): Promise<void> {
  await mkdir(dirname(configFile), { recursive: true });
  await writeFile(configFile, `${JSON.stringify(normalizeConfig(config), null, 2)}\n`, 'utf8');
}

export function resolveRequestTimeoutMs(config: LlmConfig): number {
  const raw =
    config?.requestTimeoutMs ??
    process.env.LLM_REQUEST_TIMEOUT_MS ??
    process.env.LEMONADE_REQUEST_TIMEOUT_MS;
  const value = Number(raw ?? DEFAULT_REQUEST_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_REQUEST_TIMEOUT_MS;
}

async function loadBaseConfig(): Promise<{ config: unknown | null; path: string }> {
  for (const candidate of [configPath, legacyConfigPath, legacyCompatConfigPath]) {
    const config = await readConfigFile(candidate);
    if (config) {
      return { config, path: candidate };
    }
  }
  return { config: null, path: configPath };
}

async function readConfigFile(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function resolveConfiguredConfigPath(): string {
  // Prefer the agent-pinned path so agent commands (check, commit, etc.) always
  // use the real provider config and are not affected by a --github/--local PI
  // session that overrides CFXDEVKIT_LLM_CONFIG_PATH via withTemporaryPiEndpoint.
  return process.env[agentConfigPathEnvVar] ?? process.env[configPathEnvVar] ?? configPath;
}

function isScopedOverlayPath(filePath: string): boolean {
  return normalizePath(filePath).includes('/artifacts/llm/config/units/');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export {
  agentConfigPathEnvVar,
  configPath,
  configPathEnvVar,
  defaultConfig,
  findMonorepoUnitByConfigPath,
  mergeConfigLayers,
  normalizeConfig,
};
