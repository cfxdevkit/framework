import {
  buildActionContext,
  buildBaseContext,
  chooseModel,
  complete,
  createClient,
  defaultConfig,
  discoverModels,
  readConfig,
  writeConfig,
  writeLlmReport,
} from './completion/index.ts';
import { repoActions } from './shared/index.ts';

export async function listModels() {
  const client = await createClient();
  const { models, attempts } = await discoverModels(client.baseUrls, { includeAttempts: true });
  const chosen = chooseModel(models, (await readConfig()).defaultModel);
  console.log(`Lemonade base URL: ${client.baseUrl}`);
  console.log(`Discovered models: ${models.length}`);
  if (!models.length) {
    console.log('Model discovery attempts:');
    for (const attempt of attempts) {
      const detail =
        attempt.error ??
        `HTTP ${attempt.status}${attempt.modelCount ? `, ${attempt.modelCount} model(s)` : ''}`;
      console.log(`- ${attempt.url}: ${detail}`);
    }
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
    throw new Error('Usage: pnpm run llm:config -- set <base-url|default-model|action> ...');
  }
  if (key === 'base-url') {
    config.baseUrl = rest[0];
  } else if (key === 'default-model') {
    config.defaultModel = rest[0];
  } else if (key === 'action') {
    const [action, model] = rest;
    assertAction(action);
    config.actions[action] = model;
  } else {
    throw new Error('Config keys: base-url, default-model, action');
  }
  await writeConfig(config);
  console.log(`Updated ${relativeConfigPath()}`);
}

export async function ask(args) {
  const { prompt, model, quick } = parsePromptAndFlags(args);
  if (!prompt) throw new Error('Usage: pnpm run llm:ask -- "your repo question"');
  const response = await complete({
    action: 'ask',
    modelOverride: model,
    userPrompt: prompt,
    context: await buildBaseContext({ quick }),
    quick,
  });
  await writeLlmReport('ask', response);
  console.log(response.content);
}

export async function runAction(args) {
  if (args[0] === '--') args.shift();
  const [action, ...rest] = args;
  assertAction(action);
  const { prompt, model, quick } = parsePromptAndFlags(rest);
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
  console.log(response.content);
}

export function listActions() {
  for (const [name, spec] of Object.entries(repoActions)) {
    console.log(`${name}: ${spec.title}`);
  }
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
  return 'artifacts/llm/config/lemonade.json';
}
