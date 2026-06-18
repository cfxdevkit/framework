import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withPiAgent } from './runtime.js';

const DEFAULT_ENDPOINT = 'http://localhost:28787/v1/';

type AgentConfig = {
  provider?: string | null;
  baseUrl?: string | null;
  defaultModel?: string | null;
  githubModel?: string | null;
  harness?: { providerStrategy?: string | null };
  [key: string]: unknown;
};

/**
 * Parse --endpoint <url> from raw args, returning the endpoint URL and remaining args.
 * If no --endpoint flag is given, returns null (use default config).
 */
export function parseEndpointOverride(rawArgs: readonly string[]): {
  endpoint: string | null;
  args: string[];
} {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  let endpoint: string | null = null;
  const remaining: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    if (current === '--endpoint' && i + 1 < args.length) {
      const nextArg = args[i + 1];
      if (typeof nextArg === 'string') {
        endpoint = nextArg;
      }
      i += 1;
    } else if (typeof current === 'string') {
      remaining.push(current);
    }
  }
  return { endpoint, args: remaining };
}

/**
 * Run PI agent with a temporary endpoint override.
 * Writes a minimal override config, sets CFXDEVKIT_LLM_CONFIG_PATH,
 * then restores the original config on exit.
 *
 * If `endpoint` is null, calls `withPiAgent` directly (no override).
 */
export async function withEndpointOverride(
  endpoint: string | null,
  run: (piAgent: {
    runPiInteractive: (opts?: { scope?: string; promptArgs?: readonly string[] }) => Promise<void>;
    runPiCommit: (opts?: { scope?: string; promptArgs?: readonly string[] }) => Promise<void>;
    runPiPrint: (opts: { scope?: string; promptArgs: readonly string[] }) => Promise<void>;
    runPiRpc: (opts?: { scope?: string }) => Promise<void>;
  }) => Promise<void>,
): Promise<void> {
  if (!endpoint) {
    await withPiAgent(run);
    return;
  }

  // Read base config lazily to avoid circular dep
  const { withLlmClient } = await import('./runtime.js');
  const baseConfig = (await withLlmClient((client) =>
    client.readConfig(),
  )) as unknown as AgentConfig;

  const tempDir = await mkdtemp(join(tmpdir(), 'cfxdevkit-pi-'));
  const tempConfigPath = join(tempDir, 'providers-override.json');
  const overrideConfig: AgentConfig = {
    ...baseConfig,
    provider: baseConfig.provider ?? 'openai-compat',
    baseUrl: endpoint,
    harness: {
      ...baseConfig.harness,
      providerStrategy: 'direct',
    },
  };

  await writeFile(tempConfigPath, `${JSON.stringify(overrideConfig, null, 2)}\n`, 'utf8');

  // Preserve the real agent config path so nested cdk commands still
  // resolve the base config (tools, skills, prompts, etc.).
  const realAgentConfigPath =
    process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH ??
    process.env.CFXDEVKIT_LLM_CONFIG_PATH ??
    join(process.cwd(), '.pi', 'providers.json');

  const prevConfig = process.env.CFXDEVKIT_LLM_CONFIG_PATH;
  const prevAgentConfig = process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH;
  process.env.CFXDEVKIT_LLM_CONFIG_PATH = tempConfigPath;
  process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH = realAgentConfigPath;

  try {
    await withPiAgent(run);
  } finally {
    if (prevConfig === undefined) delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
    else process.env.CFXDEVKIT_LLM_CONFIG_PATH = prevConfig;
    if (prevAgentConfig === undefined) delete process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH;
    else process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH = prevAgentConfig;
    await rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Get the default local endpoint URL.
 */
export function getDefaultEndpoint(): string {
  return DEFAULT_ENDPOINT;
}

/**
 * Print endpoint information (local only, no cloud).
 */
export async function printAgentEndpoints(scope?: string): Promise<void> {
  const { withLlmClient } = await import('./runtime.js');
  const config = (await withLlmClient((client) => client.readConfig())) as unknown as AgentConfig;
  const prefix = scope ? `--scope ${scope} ` : '';

  const baseUrl = config.baseUrl ?? DEFAULT_ENDPOINT;
  const model = config.defaultModel ?? 'auto';

  console.log(`cdk agent endpoints

Local endpoint:
  - provider: ${config.provider ?? 'openai-compat'}
  - baseUrl: ${baseUrl}
  - default model: ${model}
  - command: cdk agent ${prefix}chat [prompt]

Custom endpoint override:
  - use --endpoint <url> to route through any OpenAI-compatible server
  - command: cdk agent ${prefix}chat --endpoint <url> [prompt]

Notes:
  - Default local endpoint is ${DEFAULT_ENDPOINT}
  - The headroom proxy at localhost:28787 is recommended for local model work
  - Lemonade-compatible servers work directly with the openai-compat provider

Next:
  - local planning: cdk agent check --quick
  - repo-aware chat: cdk agent chat [prompt]
  - custom backend: cdk agent chat --endpoint <url> [prompt]`);
}
