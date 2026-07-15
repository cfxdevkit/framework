import { join } from 'node:path';

/**
 * Config path environment variable used by llm-agents and tooling-cli.
 * Resolves to ~/.pi/agent/providers.json at runtime (PI manages this).
 */
const configPathEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';
/** Agent-pinned config path — survives --github/--local session overrides. */
const agentConfigPathEnvVar = 'CFXDEVKIT_LLM_AGENT_CONFIG_PATH';

/**
 * Resolve the config path from environment variables.
 * In the PI-integrated path, PI manages `~/.pi/agent/providers.json`.
 * This function only resolves env overrides; PI itself handles default resolution.
 */
export function resolvePiConfigPath(): string {
  const agentPath = process.env[agentConfigPathEnvVar];
  if (agentPath) return agentPath;

  const configuredPath = process.env[configPathEnvVar];
  if (configuredPath) return configuredPath;

  // Default: PI manages ~/.pi/agent/providers.json at runtime
  return join(process.cwd(), '.pi', 'providers.json');
}
