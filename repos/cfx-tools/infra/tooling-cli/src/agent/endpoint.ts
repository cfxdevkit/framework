import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { hasOpenRouterKey, OPENROUTER_BASE_URL, openRouterModel } from '@cfxdevkit/pi-agent';
import { withPiAgent, withPiAgentSource } from './runtime.js';

const execFileAsync = promisify(execFile);
export const githubModelsEndpoint = 'https://models.inference.ai.azure.com';
export const defaultGithubModel = 'gpt-4.1';

export type PiEndpoint = 'default' | 'local' | 'github';

type PiEndpointAuth = {
  status: 'env' | 'gh' | 'missing';
  token: string | null;
  note: string;
};

type AgentConfig = {
  provider?: string | null;
  baseUrl?: string | null;
  defaultModel?: string | null;
  githubModel?: string | null;
  harness?: { providerStrategy?: string | null };
  [key: string]: unknown;
};

export function parsePiEndpointArgs(
  rawArgs: readonly string[],
  defaultEndpoint: PiEndpoint = 'default',
): { endpoint: PiEndpoint; args: string[] } {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  let endpoint = defaultEndpoint;
  const remaining: string[] = [];
  for (const arg of args) {
    if (arg === '--local') {
      endpoint = 'local';
      continue;
    }
    if (arg === '--github') {
      endpoint = 'github';
      continue;
    }
    remaining.push(arg);
  }
  return { endpoint, args: remaining };
}

export async function withPiAgentForEndpoint(
  endpoint: PiEndpoint,
  run: (piAgent: {
    runPiInteractive: (opts?: { scope?: string; promptArgs?: readonly string[] }) => Promise<void>;
    runPiCommit: (opts?: { scope?: string; promptArgs?: readonly string[] }) => Promise<void>;
    runPiPrint: (opts: { scope?: string; promptArgs: readonly string[] }) => Promise<void>;
    runPiRpc: (opts?: { scope?: string }) => Promise<void>;
  }) => Promise<void>,
): Promise<void> {
  if (endpoint === 'default') {
    await withPiAgent(run);
    return;
  }
  await withTemporaryPiEndpoint(endpoint, async () => withPiAgentSource(run));
}

async function withTemporaryPiEndpoint(
  endpoint: Exclude<PiEndpoint, 'default'>,
  work: () => Promise<void>,
): Promise<void> {
  // Read base config lazily to avoid circular dep with withLlmClient at import time
  const { withLlmClient } = await import('./runtime.js');
  const baseConfig = (await withLlmClient((client) =>
    client.readConfig(),
  )) as unknown as AgentConfig;

  const tempDir = await mkdtemp(join(tmpdir(), 'cfxdevkit-pi-'));
  const tempConfigPath = join(tempDir, `providers-${endpoint}.json`);
  await writeFile(
    tempConfigPath,
    `${JSON.stringify(buildPiEndpointConfig(baseConfig, endpoint), null, 2)}\n`,
    'utf8',
  );

  // Preserve the real agent config path so that agent commands (cdk agent check,
  // cdk repo merge, etc.) spawned inside this PI session still resolve lemonade
  // rather than the session's temporary GitHub Models override.
  const realAgentConfigPath =
    process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH ??
    process.env.CFXDEVKIT_LLM_CONFIG_PATH ??
    join(process.cwd(), '.pi', 'providers.json');

  const prevConfig = process.env.CFXDEVKIT_LLM_CONFIG_PATH;
  const prevAgentConfig = process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH;
  const prevGithubToken = process.env.GITHUB_TOKEN;
  process.env.CFXDEVKIT_LLM_CONFIG_PATH = tempConfigPath;
  process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH = realAgentConfigPath;

  try {
    if (endpoint === 'github' && !hasOpenRouterKey()) {
      const auth = await resolveGithubAuth(true);
      process.env.GITHUB_TOKEN = auth.token ?? '';
    }
    await work();
  } finally {
    if (prevConfig === undefined) delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
    else process.env.CFXDEVKIT_LLM_CONFIG_PATH = prevConfig;
    if (prevAgentConfig === undefined) delete process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH;
    else process.env.CFXDEVKIT_LLM_AGENT_CONFIG_PATH = prevAgentConfig;
    if (prevGithubToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prevGithubToken;
    await rm(tempDir, { recursive: true, force: true });
  }
}

function buildPiEndpointConfig(
  config: AgentConfig,
  endpoint: Exclude<PiEndpoint, 'default'>,
): AgentConfig {
  if (endpoint === 'github') {
    // Prefer OpenRouter when its key is present; otherwise fall back to the
    // existing GitHub Copilot / GitHub Models configuration.
    if (hasOpenRouterKey()) {
      return {
        ...config,
        provider: 'openai-compat',
        baseUrl: OPENROUTER_BASE_URL,
        defaultModel: openRouterModel(),
        githubModel: openRouterModel(),
        harness: { ...config.harness, providerStrategy: 'direct' },
      };
    }
    return {
      ...config,
      provider: 'github-models',
      baseUrl: githubModelsEndpoint,
      defaultModel: config.githubModel ?? defaultGithubModel,
      githubModel: config.githubModel ?? defaultGithubModel,
      harness: { ...config.harness, providerStrategy: 'direct' },
    };
  }
  return {
    ...config,
    provider: 'lemonade',
    baseUrl: null,
    defaultModel: config.provider === 'github-models' ? null : (config.defaultModel ?? null),
    harness: { ...config.harness, providerStrategy: 'direct' },
  };
}

export async function resolveGithubAuth(required: boolean): Promise<PiEndpointAuth> {
  // 1. GITHUB_TOKEN env var (must be non-empty)
  const envToken = process.env.GITHUB_TOKEN?.trim();
  if (envToken) {
    return {
      status: 'env',
      token: envToken,
      note: 'using GITHUB_TOKEN from the current environment',
    };
  }

  // 2. gh CLI token bridge — check status text, not just exit code
  try {
    const result = await execFileAsync('gh', ['auth', 'status', '--hostname', 'github.com'], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024,
      env: { ...process.env, NO_COLOR: '1' },
    }).catch((err: { stdout?: string; stderr?: string; message?: string }) => ({
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message ?? '',
    }));
    const statusText = `${result.stdout}${result.stderr}`;
    if (statusText.includes('Logged in to github.com')) {
      const { stdout } = await execFileAsync('gh', ['auth', 'token'], {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024,
        env: { ...process.env, NO_COLOR: '1' },
      });
      const ghToken = stdout.trim();
      if (ghToken)
        return { status: 'gh', token: ghToken, note: 'bridging GitHub auth from gh auth token' };
    }
  } catch {}

  // 3. Not authenticated — provide actionable guidance
  const note = [
    'GitHub authentication is required for the --github PI endpoint.',
    'Fix with one of:',
    '  a) export GITHUB_TOKEN=<your-token>    (fastest, works in all shells)',
    '  b) gh auth login                       (persists across sessions)',
    '  c) echo $TOKEN | gh auth login --with-token',
    'In a devcontainer, GITHUB_TOKEN is usually injected automatically by the host.',
    'If missing, check that the GitHub Codespaces secret or PAT is configured.',
  ].join('\n');

  if (required) throw new Error(note);
  return { status: 'missing', token: null, note };
}

export async function printAgentEndpoints(scope?: string): Promise<void> {
  const { withLlmClient } = await import('./runtime.js');
  const config = (await withLlmClient((client) => client.readConfig())) as unknown as AgentConfig;
  const githubAuth = await resolveGithubAuth(false);
  const localNote =
    config.provider === 'lemonade'
      ? `provider: lemonade @ ${config.baseUrl ?? 'auto'}`
      : `provider override: lemonade (base config uses ${config.provider})`;
  const prefix = scope ? `--scope ${scope} ` : '';

  const cloudActive = hasOpenRouterKey() ? 'OpenRouter' : 'GitHub Copilot/Models';
  const cloudBlock = hasOpenRouterKey()
    ? `Cloud endpoint (OpenRouter — OPENROUTER_API_KEY detected):
  - provider override: openai-compat
  - baseUrl: ${OPENROUTER_BASE_URL}
  - auth: OPENROUTER_API_KEY (preferred over GitHub Copilot)
  - default model: ${openRouterModel()}
  - command: cdk agent ${prefix}chat --github [prompt]`
    : `Cloud endpoint (GitHub Models — no OpenRouter key found):
  - provider override: github-models
  - baseUrl: ${githubModelsEndpoint}
  - auth: ${githubAuth.note}
  - default model: ${config.githubModel ?? defaultGithubModel}
  - set OPENROUTER_API_KEY to route cloud calls through OpenRouter instead
  - command: cdk agent ${prefix}chat --github [prompt]`;

  console.log(`cdk agent endpoints

Local endpoint (lemonade):
  - ${localNote}
  - default model: ${config.provider === 'github-models' ? 'auto' : (config.defaultModel ?? 'auto')}
  - command: cdk agent ${prefix}chat --local [prompt]

${cloudBlock}

Next:
  - local planning: cdk agent check --quick
  - cloud review / implementation (${cloudActive}): cdk agent chat --github`);
}
