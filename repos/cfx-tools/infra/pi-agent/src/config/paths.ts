import { join } from 'node:path';

const configPathEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';
/** Agent-pinned config path — set by withTemporaryPiEndpoint to survive --github/--local session overrides. */
const agentConfigPathEnvVar = 'CFXDEVKIT_LLM_AGENT_CONFIG_PATH';

export function resolvePiConfigPath(scope?: string): string {
  if (scope) {
    return join(process.cwd(), 'artifacts', 'llm', 'config', 'units', `${scope}.json`);
  }

  // Prefer the agent-pinned path so that commands running inside a --github or
  // --local PI session (where CFXDEVKIT_LLM_CONFIG_PATH is a temp override) still
  // resolve to the real provider config (e.g. lemonade) instead of the session config.
  const agentPath = process.env[agentConfigPathEnvVar];
  if (agentPath) return agentPath;

  const configuredPath = process.env[configPathEnvVar];
  return configuredPath ?? resolveBasePiConfigPath();
}

export function resolveBasePiConfigPath(): string {
  return join(process.cwd(), '.pi', 'providers.json');
}
