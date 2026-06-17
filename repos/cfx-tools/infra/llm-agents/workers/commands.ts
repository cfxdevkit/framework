import { relative } from 'node:path';
import { executeChangesetGenerate, type RepoActionExecutionResult } from './changeset-generate.ts';
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
import { applyConfigKey } from './config-helpers.ts';
import {
  logExecutionContext,
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from './shared/execution-context.ts';
import {
  configPath,
  configPathEnvVar,
  listRepoActions,
  type RepoActionDefinition,
  type RepoActionName,
  repoActions,
} from './shared/index.ts';

export type { RepoActionExecutionResult } from './changeset-generate.ts';
export { validateModels } from './validate-models.ts';

// ─── Model list ────────────────────────────────────────────────────────────────

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

// ─── Config ────────────────────────────────────────────────────────────────────

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

  await applyConfigKey(config, key, rest);
  await writeConfig(config);
  console.log(`Updated ${relativeConfigPath()}`);
}

// ─── Action runner ─────────────────────────────────────────────────────────────

export async function runAction(args) {
  const result = await executeAction(args);
  console.log(result.response.content);
  return result;
}

export async function executeAction(args): Promise<RepoActionExecutionResult> {
  if (args[0] === '--') args.shift();
  const [action, ...rest] = args;
  assertAction(action);
  const { prompt, model, quick, generate } = parsePromptAndFlags(rest);

  // ── --generate mode for changeset action ──────────────────────────────────
  if (generate && action === 'changeset') {
    return await executeChangesetGenerate(action, { quick, model });
  }

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function parsePromptAndFlags(args) {
  const promptParts = [];
  let model = null;
  let quick = false;
  let generate = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') {
      model = args[++index];
    } else if (arg === '--quick') {
      quick = true;
    } else if (arg === '--generate') {
      generate = true;
    } else {
      promptParts.push(arg);
    }
  }
  return { prompt: promptParts.join(' ').trim(), model, quick, generate };
}

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
