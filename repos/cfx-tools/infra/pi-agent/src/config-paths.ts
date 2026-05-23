import { join } from 'node:path';

const configPathEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';

export function resolvePiConfigPath(scope?: string): string {
  const configuredPath = process.env[configPathEnvVar];
  if (scope) {
    return join(process.cwd(), 'artifacts', 'llm', 'config', 'units', `${scope}.json`);
  }

  return configuredPath ?? resolveBasePiConfigPath();
}

export function resolveBasePiConfigPath(): string {
  return join(process.cwd(), '.pi', 'providers.json');
}
