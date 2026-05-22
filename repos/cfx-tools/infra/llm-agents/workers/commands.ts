import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { dirname, join } from 'node:path';
import {
  artifactsRoot,
  buildActionContext,
  buildBaseContext,
  complete,
  defaultConfig,
  getProviderBaseUrl,
  getProviderDefaultModel,
  readConfig,
  resolveProvider,
  writeConfig,
  writeLlmReport,
} from './completion/index.ts';
import { repoActions } from './shared/index.ts';

const providerTypes = ['litellm', 'openai-compat', 'github-models'] as const;
const MIN_VALIDATION_CONTEXT_TOKENS = 30000;

function displayModelId(model) {
  return model.id ?? model.checkpoint ?? '(unknown-model)';
}

function displayModelLabels(model) {
  return model.labels?.length ? model.labels.join(', ') : '';
}

function parseValidateModelsFlags(args) {
  const flags = {
    quick: false,
    noThinking: false,
    model: null,
    limit: Number.POSITIVE_INFINITY,
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--quick') {
      flags.quick = true;
    } else if (arg === '--no-thinking') {
      flags.noThinking = true;
    } else if (arg === '--model' && args[index + 1]) {
      flags.model = args[++index];
    } else if (arg === '--limit' && args[index + 1]) {
      const limit = Number(args[++index]);
      if (Number.isFinite(limit) && limit > 0) flags.limit = limit;
    }
  }
  return flags;
}

function summarizeValidationResult(result) {
  if (!result.ok) return `[error] ${result.model}: ${result.error}`;
  return [
    `[ok] ${result.model}`,
    `headers=${result.headersMs ?? 'n/a'}ms`,
    `firstReasoning=${result.firstReasoningMs ?? 'n/a'}ms`,
    `firstContent=${result.firstContentMs ?? 'n/a'}ms`,
    `complete=${result.completeMs ?? 'n/a'}ms`,
    `reasoning=${result.reasoningObserved ? 'yes' : 'no'}`,
    `finish=${result.finishReason ?? 'unknown'}`,
  ].join(', ');
}

function createValidationMetrics() {
  return {
    headersMs: null,
    firstReasoningMs: null,
    firstContentMs: null,
    completeMs: null,
    reasoningObserved: false,
    finishReason: null,
    contentChars: 0,
    reasoningChars: 0,
  };
}

function applyValidationProgress(metrics, event) {
  if (event.phase === 'headers' && metrics.headersMs === null) {
    metrics.headersMs = event.elapsedMs;
  }
  if (event.phase === 'reasoning') {
    metrics.reasoningObserved = true;
    metrics.reasoningChars = event.reasoningChars ?? metrics.reasoningChars;
    if (metrics.firstReasoningMs === null) metrics.firstReasoningMs = event.elapsedMs;
  }
  if (event.phase === 'content') {
    metrics.contentChars = event.contentChars ?? metrics.contentChars;
    if (metrics.firstContentMs === null) metrics.firstContentMs = event.elapsedMs;
  }
  if (event.phase === 'heartbeat') {
    metrics.reasoningChars = event.reasoningChars ?? metrics.reasoningChars;
    metrics.contentChars = event.contentChars ?? metrics.contentChars;
  }
  if (event.phase === 'complete') {
    metrics.completeMs = event.elapsedMs;
    metrics.finishReason = event.finishReason ?? metrics.finishReason;
    metrics.reasoningChars = event.reasoningChars ?? metrics.reasoningChars;
    metrics.contentChars = event.contentChars ?? metrics.contentChars;
  }
}

function firstResponseMs(result) {
  return result.firstContentMs ?? result.firstReasoningMs;
}

function validateJsonProbe(content) {
  try {
    const parsed = JSON.parse(content);
    const shapeOk =
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.ok === true &&
      parsed.mode === 'json';
    return { jsonValid: true, jsonShapeOk: shapeOk };
  } catch {
    return { jsonValid: false, jsonShapeOk: false };
  }
}

function toDisplayDuration(value) {
  return value === null ? 'n/a' : `${value}ms`;
}

function toTableCell(value, maxWidth = 32) {
  const text = String(value ?? '');
  if (text.length <= maxWidth) return text;
  return `${text.slice(0, maxWidth - 1)}…`;
}

function renderValidationTable(results) {
  const rows = results.map((result) => {
    const note = result.error ?? (result.jsonShapeOk ? '' : 'json payload mismatch');
    return [
      toTableCell(result.model, 30),
      toDisplayDuration(result.loadMs),
      toDisplayDuration(result.firstResponseMs),
      toDisplayDuration(result.hotFirstResponseMs),
      result.jsonShapeOk ? 'ok' : result.jsonValid ? 'invalid' : 'error',
      result.reasoningObserved ? 'yes' : 'no',
      result.ok ? 'ok' : 'error',
      toTableCell(note, 36),
    ];
  });

  const header = ['Model', 'Load', 'First', 'Hot First', 'JSON', 'Reason', 'Status', 'Note'];
  const widths = header.map((label, index) =>
    Math.max(label.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const renderRow = (row) => row.map((cell, index) => cell.padEnd(widths[index])).join(' | ');
  const divider = widths.map((width) => '-'.repeat(width)).join('-|-');
  return [renderRow(header), divider, ...rows.map(renderRow)].join('\n');
}

async function runValidationProbe(params) {
  const metrics = createValidationMetrics();

  try {
    const response = await params.provider.complete(
      [{ role: 'user', content: params.prompt }],
      {
        action: params.action,
        model: params.model,
        temperature: 0,
        maxTokens: params.maxTokens,
        quick: params.quick,
        timeoutMs: params.timeoutMs,
        enableThinking: params.enableThinking,
        ...(params.minContextTokens ? { minContextTokens: params.minContextTokens } : {}),
        onProgress: (event) => applyValidationProgress(metrics, event),
      },
    );

    const content = response.trim();
    const probe = {
      ok: true,
      headersMs: metrics.headersMs,
      firstReasoningMs: metrics.firstReasoningMs,
      firstContentMs: metrics.firstContentMs,
      firstResponseMs: firstResponseMs(metrics),
      completeMs: metrics.completeMs,
      reasoningObserved: metrics.reasoningObserved,
      finishReason: metrics.finishReason,
      contentChars: metrics.contentChars,
      reasoningChars: metrics.reasoningChars,
      contentPreview: content.slice(0, 80),
    };
    return params.validate ? { ...probe, ...params.validate(content) } : probe;
  } catch (error) {
    return {
      ok: false,
      headersMs: metrics.headersMs,
      firstReasoningMs: metrics.firstReasoningMs,
      firstContentMs: metrics.firstContentMs,
      firstResponseMs: firstResponseMs(metrics),
      completeMs: metrics.completeMs,
      reasoningObserved: metrics.reasoningObserved,
      finishReason: metrics.finishReason,
      contentChars: metrics.contentChars,
      reasoningChars: metrics.reasoningChars,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function findValidationError(result) {
  if (!result.cold.ok) return `cold: ${result.cold.error}`;
  if (!result.hot.ok) return `hot: ${result.hot.error}`;
  if (!result.json.ok) return `json: ${result.json.error}`;
  if (!result.jsonShapeOk) return 'json payload mismatch';
  return null;
}

async function writeModelValidationReport(report) {
  const filePath = join(artifactsRoot, 'reports', 'model-validation.json');
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return 'artifacts/llm/reports/model-validation.json';
}

export async function validateModels(args) {
  const flags = parseValidateModelsFlags(args[0] === '--' ? args.slice(1) : args);
  const provider = await resolveProvider();
  const config = await readConfig();
  const minContextTokens =
    provider.type === 'litellm' || provider.type === 'openai-compat'
      ? MIN_VALIDATION_CONTEXT_TOKENS
      : null;
  const discoverStartedAt = Date.now();
  const models = await provider.discoverModels();
  const discoverMs = Date.now() - discoverStartedAt;
  const selectedModels = models
    .filter((model) => !flags.model || displayModelId(model) === flags.model)
    .slice(0, flags.limit);

  if (!selectedModels.length) {
    throw new Error(
      flags.model
        ? `No discovered model matched ${flags.model}.`
        : 'No models discovered from the resolved provider. Check base URL, credentials, and provider compatibility.',
    );
  }

  console.log(`LLM provider: ${provider.type}`);
  console.log(`Base URL: ${getProviderBaseUrl(provider) || 'n/a'}`);
  console.log(`Discovered models: ${models.length} in ${discoverMs}ms`);
  console.log(`Validating models: ${selectedModels.length}`);
  if (minContextTokens) {
    console.log(`Minimum context hint: ${minContextTokens} tokens`);
  }

  const results = [];
  for (const model of selectedModels) {
    const modelId = displayModelId(model);
    const labels = displayModelLabels(model);
    console.log(`\nProbing ${modelId}${labels ? ` [${labels}]` : ''}...`);

    const cold = await runValidationProbe({
      provider,
      action: 'validate-models-cold',
      model: modelId,
      prompt: 'Reply with exactly OK.',
      maxTokens: flags.quick ? 32 : 64,
      quick: flags.quick,
      timeoutMs: config.requestTimeoutMs,
      enableThinking: flags.noThinking ? false : undefined,
      minContextTokens,
    });
    console.log(`  cold: ${summarizeValidationResult({ model: modelId, ...cold })}`);

    const hot = await runValidationProbe({
      provider,
      action: 'validate-models-hot',
      model: modelId,
      prompt: 'Reply with exactly OK.',
      maxTokens: flags.quick ? 32 : 64,
      quick: flags.quick,
      timeoutMs: config.requestTimeoutMs,
      enableThinking: flags.noThinking ? false : undefined,
      minContextTokens,
    });
    console.log(`  hot:  ${summarizeValidationResult({ model: modelId, ...hot })}`);

    const json = await runValidationProbe({
      provider,
      action: 'validate-models-json',
      model: modelId,
      prompt:
        'Reply with only minified JSON and no other text: {"ok":true,"mode":"json"}',
      maxTokens: flags.quick ? 96 : 160,
      quick: flags.quick,
      timeoutMs: config.requestTimeoutMs,
      enableThinking: flags.noThinking ? false : undefined,
      minContextTokens,
      validate: validateJsonProbe,
    });
    console.log(`  json: ${summarizeValidationResult({ model: modelId, ...json })}`);

    const result = {
      model: modelId,
      labels: model.labels ?? [],
      size: model.size ?? null,
      ok: Boolean(cold.ok && hot.ok && json.ok && json.jsonShapeOk),
      loadMs: cold.headersMs,
      firstResponseMs: cold.firstResponseMs,
      hotFirstResponseMs: hot.firstResponseMs,
      jsonValid: json.jsonValid ?? false,
      jsonShapeOk: json.jsonShapeOk ?? false,
      requestedMinContextTokens: minContextTokens,
      reasoningObserved: Boolean(
        cold.reasoningObserved || hot.reasoningObserved || json.reasoningObserved,
      ),
      headersMs: cold.headersMs,
      firstReasoningMs: cold.firstReasoningMs,
      firstContentMs: cold.firstContentMs,
      completeMs: cold.completeMs,
      finishReason: cold.finishReason,
      contentChars: cold.contentChars,
      reasoningChars: cold.reasoningChars,
      contentPreview: cold.contentPreview,
      cold,
      hot,
      json,
      error: null,
    };
    result.error = findValidationError(result);
    results.push(result);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    provider: provider.type,
    baseUrl: getProviderBaseUrl(provider),
    discoverMs,
    noThinking: flags.noThinking,
    quick: flags.quick,
    minContextTokens,
    results,
  };
  const reportPath = await writeModelValidationReport(report);
  console.log(`\nComparison:`);
  console.log(renderValidationTable(results));
  console.log(`\nreport: ${reportPath}`);
}

async function promptForDefaultModel(provider, config) {
  const models = await provider.discoverModels();
  if (!models.length) {
    throw new Error('No models discovered from the resolved provider. Check base URL, credentials, and provider compatibility.');
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive model selection requires a TTY. Run `pnpm run llm:models` and then `pnpm run llm:config -- set default-model <id>` if needed.');
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
    const answer = (await rl.question(`Enter selection [1-${models.length}]${currentId ? ` or press Enter to keep ${currentId}` : ''}: `)).trim();
    if (!answer) {
      if (!currentId) throw new Error('A selection is required because no default model is configured yet.');
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
  const chosen = provider.chooseModel(models, config.defaultModel ?? getProviderDefaultModel(provider));
  console.log(`LLM provider: ${provider.type}`);
  console.log(`Base URL: ${getProviderBaseUrl(provider) || 'n/a'}`);
  console.log(`Discovered models: ${models.length}`);
  if (!models.length) {
    console.log('No models discovered from the resolved provider. Check base URL, credentials, and provider compatibility.');
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
    if (provider === 'lemonade') {
      config.provider = 'lemonade';
      console.log('Using legacy provider alias "lemonade". Prefer litellm or openai-compat for new config.');
    } else if (!providerTypes.includes(provider as (typeof providerTypes)[number])) {
      throw new Error(`provider must be one of: ${providerTypes.join(', ')}`);
    } else {
      config.provider = provider;
    }
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
  return 'artifacts/llm/config/llm.json';
}
