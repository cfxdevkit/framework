import { createInterface } from 'node:readline/promises';
import { relative } from 'node:path';
import {
  buildActionContext,
  complete,
  defaultConfig,
  getProviderBaseUrl,
  getProviderDefaultModel,
  readConfig,
  resolveProvider,
  writeConfig,
  writeLlmReport,
} from './completion/index.ts';
import {
  configPath,
  configPathEnvVar,
  listRepoActions,
  repoActions,
  type RepoActionDefinition,
  type RepoActionName,
} from './shared/index.ts';
import {
  logExecutionContext,
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
  type ExecutionContextRuntimePayload,
} from './shared/execution-context.ts';
export { validateModels } from './validate-models.ts';

export interface RepoActionExecutionResult {
  readonly action: RepoActionName;
  readonly definition: RepoActionDefinition;
  readonly executionContext: ExecutionContextRuntimePayload;
  readonly response: Awaited<ReturnType<typeof complete>>;
}

const providerTypes = ['lemonade', 'litellm', 'openai-compat', 'github-models'] as const;

function displayModelId(model) {
  return model.id ?? model.checkpoint ?? '(unknown-model)';
}

async function promptForDefaultModel(provider, config) {
  const models = await provider.discoverModels();
  if (!models.length) {
    throw new Error(
      'No models discovered from the resolved provider. Check base URL, credentials, and provider compatibility.',
    );
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'Interactive model selection requires a TTY. Run `pnpm run llm:models` and then `pnpm run llm:config -- set default-model <id>` if needed.',
    );
  }

  const currentId = config.defaultModel ?? getProviderDefaultModel(provider);
  console.log('Select default model:');
  for (const [index, model] of models.entries()) {
    const modelId = displayModelId(model);
    const marker = modelId === currentId ? '*' : ' ';
    const labels = model.labels?.length ? ` [${model.labels.join(', ')}]` : '';
    const size = typeof model.size === 'number' ? ` ${model.size}GB` : '';
    console.log(` ${index + 1}. ${marker} ${modelId}${size}${labels}`);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (
      await rl.question(
        `Enter selection [1-${models.length}]${currentId ? ` or press Enter to keep ${currentId}` : ''}: `,
      )
    ).trim();
    if (!answer) {
      if (!currentId)
        throw new Error('A selection is required because no default model is configured yet.');
      return currentId;
    }
    const selectedIndex = Number(answer);
    if (!Number.isInteger(selectedIndex) || selectedIndex < 1 || selectedIndex > models.length) {
      throw new Error(`Selection must be an integer between 1 and ${models.length}.`);
    }
    return displayModelId(models[selectedIndex - 1]);
  } finally {
    rl.close();
  }
}

export async function listModels() {
  const provider = await resolveProvider();
  const config = await readConfig();
  const models = await provider.discoverModels();
  const chosen = provider.chooseModel(
    models,
    config.defaultModel ?? getProviderDefaultModel(provider),
  );
  console.log(`LLM provider: ${provider.type}`);
  console.log(`Base URL: ${getProviderBaseUrl(provider) || 'n/a'}`);
  console.log(`Discovered models: ${models.length}`);
  if (!models.length) {
    console.log(
      'No models discovered from the resolved provider. Check base URL, credentials, and provider compatibility.',
    );
  }
  for (const model of models) {
    const marker = model.id === chosen?.id ? '*' : ' ';
    const labels = model.labels?.length ? ` [${model.labels.join(', ')}]` : '';
    const size = typeof model.size === 'number' ? ` ${model.size}GB` : '';
    console.log(`${marker} ${model.id ?? model.checkpoint}${size}${labels}`);
  }
}

export async function configure(args) {
  const normalizedArgs = args[0] === '--' ? args.slice(1) : args;
  const [subcommand, key, ...rest] = normalizedArgs;
  const config = await readConfig();
  if (!subcommand || subcommand === 'show') {
    console.log(JSON.stringify(config, null, 2));
    return;
  }
  if (subcommand === 'reset') {
    await writeConfig(defaultConfig());
    console.log(`Reset ${relativeConfigPath()}`);
    return;
  }
  if (subcommand !== 'set') {
    throw new Error(
      'Usage: pnpm run llm:config -- set <provider|base-url|default-model|request-timeout-ms|action> ...',
    );
  }
  if (key === 'provider') {
    const provider = rest[0];
    if (!providerTypes.includes(provider as (typeof providerTypes)[number])) {
      throw new Error(`provider must be one of: ${providerTypes.join(', ')}`);
    }
    config.provider = provider;
  } else if (key === 'base-url') {
    config.baseUrl = rest[0];
  } else if (key === 'default-model') {
    if (rest[0]) {
      config.defaultModel = rest[0];
    } else {
      const provider = await resolveProvider();
      config.defaultModel = await promptForDefaultModel(provider, config);
      console.log(`Selected default model: ${config.defaultModel}`);
    }
  } else if (key === 'request-timeout-ms') {
    const value = Number(rest[0]);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('request-timeout-ms must be a positive integer number of milliseconds');
    }
    config.requestTimeoutMs = value;
  } else if (key === 'action') {
    const [action, model] = rest;
    assertAction(action);
    config.actions[action] = model;
  } else {
    throw new Error('Config keys: provider, base-url, default-model, request-timeout-ms, action');
  }
  await writeConfig(config);
  console.log(`Updated ${relativeConfigPath()}`);
}

export async function runAction(args) {
  const result = await executeAction(args);
  console.log(result.response.content);
  return result;
}

export async function executeAction(args): Promise<RepoActionExecutionResult> {
  if (args[0] === '--') args.shift();
  const [action, ...rest] = args;
  assertAction(action);
  const { prompt, model, quick } = parsePromptAndFlags(rest);
  const executionContext = await resolveExecutionContext({
    useLlm: true,
    action,
    modelOverride: model,
  });
  logExecutionContext(executionContext);
  const spec = repoActions[action];
  const context = await buildActionContext(spec, { quick });
  const response = await complete({
    action,
    modelOverride: model,
    userPrompt: prompt || spec.defaultPrompt,
    context,
    quick,
  });
  await writeLlmReport(action, response);
  return {
    action,
    definition: spec,
    executionContext: toExecutionContextRuntimePayload(executionContext),
    response,
  };
}

export function listActions() {
  for (const [name, spec] of listRepoActions()) {
    console.log(`${name}: ${spec.title}`);
  }
}

export function getActionDefinitions(): readonly {
  name: RepoActionName;
  definition: RepoActionDefinition;
}[] {
  return listRepoActions().map(([name, definition]) => ({ name, definition }));
}

// ─── Docs upkeep pipeline ────────────────────────────────────────────────────

export function parsePromptAndFlags(args) {
  const promptParts = [];
  let model = null;
  let quick = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') {
      model = args[++index];
    } else if (arg === '--quick') {
      quick = true;
    } else {
      promptParts.push(arg);
    }
  }
  return { prompt: promptParts.join(' ').trim(), model, quick };
}

// ─── Test upkeep pipeline ─────────────────────────────────────────────────────

export function assertAction(action) {
  if (!repoActions[action]) {
    throw new Error(`Unknown action "${action}". Run pnpm run llm:actions to list actions.`);
  }
}

export function relativeConfigPath() {
  const scopedPath = process.env[configPathEnvVar];
  if (scopedPath) {
    return relative(process.cwd(), scopedPath) || scopedPath;
  }
  return relative(process.cwd(), configPath) || '.pi/providers.json';
}
