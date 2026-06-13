import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { defaultPiConfig, mergePiConfigLayers, normalizePiConfig } from '../config/normalize.js';
import { resolveBasePiConfigPath, resolvePiConfigPath } from '../config/paths.js';
import type { PiLlmConfig } from '../config/types.js';

export async function readPiConfig(configPath = resolvePiConfigPath()): Promise<PiLlmConfig> {
  const basePath = resolveBasePiConfigPath();
  const baseConfig = await readConfigFile(basePath);

  if (configPath === basePath) {
    return normalizePiConfig(baseConfig ?? defaultPiConfig());
  }

  const scopedConfig = await readConfigFile(configPath);
  if (!scopedConfig) {
    return normalizePiConfig(baseConfig ?? defaultPiConfig());
  }

  return mergePiConfigLayers(baseConfig ?? defaultPiConfig(), scopedConfig);
}

export async function writePiConfig(
  config: PiLlmConfig,
  configPath = resolvePiConfigPath(),
): Promise<void> {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(normalizePiConfig(config), null, 2)}\n`, 'utf8');
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

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
