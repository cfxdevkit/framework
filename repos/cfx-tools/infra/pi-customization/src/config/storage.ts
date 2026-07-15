import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { defaultPiConfig, normalizePiConfig } from '../config/normalize.js';
import { resolvePiConfigPath } from '../config/paths.js';
import type { PiLlmConfig } from '../config/types.js';

export async function readPiConfig(configPath = resolvePiConfigPath()): Promise<PiLlmConfig> {
  // In the PI-integrated path, PI manages ~/.pi/agent/providers.json.
  // If the config path doesn't exist, return defaults.
  // The config path is resolved from env vars or defaults to .pi/providers.json.
  try {
    const raw = await readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return normalizePiConfig(parsed);
  } catch {
    return defaultPiConfig();
  }
}

export async function writePiConfig(
  config: PiLlmConfig,
  configPath = resolvePiConfigPath(),
): Promise<void> {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(normalizePiConfig(config), null, 2)}\n`, 'utf8');
}
