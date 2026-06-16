import { createInterface } from 'node:readline/promises';
import { getProviderDefaultModel, resolveProvider } from './completion/index.ts';
import { repoActions } from './shared/index.ts';

const providerTypes = ['lemonade', 'litellm', 'openai-compat', 'github-models'] as const;

function displayModelId(model) {
  return model.id ?? model.checkpoint ?? '(unknown-model)';
}

async function assertAction(action) {
  if (!repoActions[action]) {
    throw new Error(`Unknown action "${action}". Run pnpm run llm:actions to list actions.`);
  }
}

export async function promptForDefaultModel(provider, config) {
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

export async function applyConfigKey(config, key: string, values: string[]): Promise<void> {
  if (key === 'provider') {
    const provider = values[0];
    if (!providerTypes.includes(provider as (typeof providerTypes)[number])) {
      throw new Error(`provider must be one of: ${providerTypes.join(', ')}`);
    }
    config.provider = provider;
  } else if (key === 'base-url') {
    config.baseUrl = values[0];
  } else if (key === 'default-model') {
    if (values[0]) {
      config.defaultModel = values[0];
    } else {
      const provider = await resolveProvider();
      config.defaultModel = await promptForDefaultModel(provider, config);
      console.log(`Selected default model: ${config.defaultModel}`);
    }
  } else if (key === 'request-timeout-ms') {
    const value = Number(values[0]);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('request-timeout-ms must be a positive integer number of milliseconds');
    }
    config.requestTimeoutMs = value;
  } else if (key === 'action') {
    const [action, model] = values;
    await assertAction(action);
    config.actions[action] = model;
  } else {
    throw new Error('Config keys: provider, base-url, default-model, request-timeout-ms, action');
  }
}
