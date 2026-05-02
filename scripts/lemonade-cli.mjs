#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const root = process.cwd();
const artifactsRoot = join(root, 'artifacts', 'llm');
const configPath = join(artifactsRoot, 'config', 'lemonade.json');
const defaultBaseUrls = ['http://localhost:13305/', 'http://127.0.0.1:13305/', 'http://127.0.0.1:8000/'];
const modelPaths = ['/api/v1/models', '/v1/models', '/models'];
const chatPaths = ['/api/v1/chat/completions', '/v1/chat/completions', '/chat/completions'];
const repoActions = {
  'docs-upkeep': {
    title: 'Documentation Upkeep',
    defaultPrompt:
      'Review documentation alignment warnings and recommend the smallest repo doc updates. Keep findings first.',
    context: ['artifacts/llm/reports/docs-alignment.md', 'docs/README.md', 'docs/llm-fine-tuning-plan.md'],
  },
  review: {
    title: 'Code Review',
    defaultPrompt:
      'Review the current git changes. Prioritize bugs, security risks, missing validation, and regressions.',
    context: ['artifacts/llm/reports/review.md', 'SECURITY.md', 'CONTRIBUTING.md'],
    includeGitDiff: true,
  },
  plan: {
    title: 'Implementation Planning',
    defaultPrompt:
      'Create a repo-aware implementation plan. Respect current repos/cfx-* structure and avoid fine-tuning steps unless asked.',
    context: ['docs/llm-fine-tuning-plan.md', 'docs/llm-automation-agents.md', 'README.md', 'ARCHITECTURE.md'],
  },
  architecture: {
    title: 'Architecture Q&A',
    defaultPrompt:
      'Answer using the current repository architecture and package boundaries. Call out planned topology separately.',
    context: ['ARCHITECTURE.md', 'README.md', 'docs/architecture/package-layout.md'],
  },
  validation: {
    title: 'Validation Selection',
    defaultPrompt:
      'Given the changed files and repository scripts, choose the minimum useful validation commands and explain why.',
    context: ['package.json', 'artifacts/llm/reports/review.md'],
    includeChangedFiles: true,
  },
};

const rawArgs = process.argv.slice(2);
if (rawArgs[0] === '--') rawArgs.shift();
const [command = 'help', ...args] = rawArgs;

try {
  if (command === 'models') await listModels();
  else if (command === 'config') await configure(args);
  else if (command === 'ask') await ask(args);
  else if (command === 'run') await runAction(args);
  else if (command === 'actions') listActions();
  else help();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

async function listModels() {
  const client = await createClient();
  const models = await discoverModels(client.baseUrls);
  const chosen = chooseModel(models, (await readConfig()).defaultModel);
  console.log(`Lemonade base URL: ${client.baseUrl}`);
  console.log(`Discovered models: ${models.length}`);
  for (const model of models) {
    const marker = model.id === chosen?.id ? '*' : ' ';
    const labels = model.labels?.length ? ` [${model.labels.join(', ')}]` : '';
    const size = typeof model.size === 'number' ? ` ${model.size}GB` : '';
    console.log(`${marker} ${model.id ?? model.checkpoint}${size}${labels}`);
  }
}

async function configure(args) {
  const [subcommand, key, ...rest] = args;
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

async function ask(args) {
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

async function runAction(args) {
  if (args[0] === '--') args.shift();
  const [action, ...rest] = args;
  assertAction(action);
  const { prompt, model, quick } = parsePromptAndFlags(rest);
  const spec = repoActions[action];
  const context = await buildActionContext(action, spec, { quick });
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

function listActions() {
  for (const [name, spec] of Object.entries(repoActions)) {
    console.log(`${name}: ${spec.title}`);
  }
}

async function complete({ action, modelOverride, userPrompt, context, quick = false }) {
  const config = await readConfig();
  const client = await createClient(config);
  const models = await discoverModels(client.baseUrls);
  const modelId =
    modelOverride ?? config.actions?.[action] ?? config.defaultModel ?? chooseModel(models)?.id;
  if (!modelId) throw new Error('No Lemonade model available. Run pnpm run llm:models to inspect inventory.');

  const messages = [
    {
      role: 'system',
      content: [
        'You are a repository upkeep assistant for the Conflux DevKit monorepo.',
        'Use the supplied repository context as source of truth.',
        'Do not claim fine-tuning has happened. Do not publish, deploy, rotate secrets, or commit changes.',
        'For review-like tasks, put findings first and keep recommendations specific.',
      ].join(' '),
    },
    { role: 'user', content: `${context}\n\nTask:\n${userPrompt}` },
  ];

  const body = { model: modelId, messages, temperature: 0.2, stream: false, max_tokens: quick ? 256 : 1600 };
  const attempts = [];
  for (const path of chatPaths) {
    const url = new URL(path, client.baseUrl).toString();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
      const text = await response.text();
      attempts.push({ url, ok: response.ok, status: response.status });
      if (!response.ok) continue;
      return {
        generatedAt: new Date().toISOString(),
        action,
        baseUrl: client.baseUrl,
        model: modelId,
        content: extractAssistantText(text),
        attempts,
      };
    } catch (error) {
      attempts.push({ url, ok: false, error: String(error) });
    }
  }
  throw new Error(`Lemonade chat completion failed: ${JSON.stringify(attempts)}`);
}

async function createClient(config = null) {
  const cfg = config ?? (await readConfig());
  const baseUrls = cfg.baseUrl
    ? [cfg.baseUrl]
    : process.env.LEMONADE_URL || process.env.LEMONADE_BASE_URL
      ? [process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL]
      : defaultBaseUrls;
  const models = await discoverModels(baseUrls);
  const attempt = models.find((model) => model.__baseUrl)?.__baseUrl ?? normalizeBaseUrl(baseUrls[0]);
  return { baseUrl: attempt, baseUrls };
}

async function discoverModels(baseUrls) {
  for (const baseUrl of baseUrls.map(normalizeBaseUrl)) {
    for (const path of modelPaths) {
      const url = new URL(path, baseUrl).toString();
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) continue;
        const models = extractModelInventory(await response.text()).map((model) => ({
          ...model,
          __baseUrl: baseUrl,
        }));
        if (models.length) return models;
      } catch {
        // try next endpoint
      }
    }
  }
  return [];
}

function extractModelInventory(text) {
  try {
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
    return data
      .map((model) => ({
        id: typeof model?.id === 'string' ? model.id : undefined,
        checkpoint: typeof model?.checkpoint === 'string' ? model.checkpoint : undefined,
        labels: Array.isArray(model?.labels) ? model.labels.filter((label) => typeof label === 'string') : [],
        recipe: typeof model?.recipe === 'string' ? model.recipe : undefined,
        size: typeof model?.size === 'number' ? model.size : undefined,
        suggested: model?.suggested === true,
      }))
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}

function chooseModel(models, preferredId) {
  if (preferredId) {
    const preferred = models.find((model) => model.id === preferredId || model.checkpoint === preferredId);
    if (preferred) return preferred;
  }
  return [...models].sort((left, right) => modelScore(right) - modelScore(left))[0];
}

function modelScore(model) {
  const text = `${model.id ?? ''} ${model.checkpoint ?? ''} ${(model.labels ?? []).join(' ')}`.toLowerCase();
  let score = 0;
  if (model.suggested) score += 10;
  if (text.includes('coder')) score += 8;
  if (text.includes('coding')) score += 6;
  if (text.includes('tool')) score += 4;
  if (text.includes('qwen')) score += 3;
  if (text.includes('hot')) score += 2;
  return score;
}

function extractAssistantText(text) {
  const parsed = JSON.parse(text);
  const message = parsed?.choices?.[0]?.message?.content ?? parsed?.choices?.[0]?.text ?? parsed?.message;
  if (typeof message !== 'string') return text;
  return message.trim();
}

async function buildActionContext(action, spec, opts = {}) {
  const parts = await buildBaseContext(opts);
  const files = [];
  for (const file of spec.context ?? []) {
    files.push(await readContextFile(file));
  }
  if (spec.includeChangedFiles) files.push(await changedFilesBlock());
  if (spec.includeGitDiff) files.push(await gitDiffBlock());
  return `${parts}\n\n${files.filter(Boolean).join('\n\n')}`.slice(0, opts.quick ? 12000 : 60000);
}

async function buildBaseContext(opts = {}) {
  const files = await Promise.all([
    readContextFile('README.md'),
    readContextFile('ARCHITECTURE.md'),
    readContextFile('docs/llm-automation-agents.md'),
    readContextFile('artifacts/llm/corpus/manifest.json'),
  ]);
  return files.filter(Boolean).join('\n\n').slice(0, opts.quick ? 8000 : 30000);
}

async function readContextFile(path) {
  try {
    const content = await readFile(join(root, path), 'utf8');
    return `--- ${path} ---\n${content.slice(0, 12000)}`;
  } catch {
    return '';
  }
}

async function changedFilesBlock() {
  const files = await git(['diff', '--name-only']);
  const staged = await git(['diff', '--cached', '--name-only']);
  const untracked = await git(['ls-files', '--others', '--exclude-standard']);
  return `--- changed files ---\n${[files, staged, untracked].join('\n').trim()}`;
}

async function gitDiffBlock() {
  const stat = await git(['diff', '--stat']);
  const names = await changedFilesBlock();
  const diff = await git(['diff', '--', ':!pnpm-lock.yaml']);
  return `--- git diff stat ---\n${stat}\n\n${names}\n\n--- git diff excerpt ---\n${diff.slice(0, 30000)}`;
}

async function git(args) {
  const { stdout } = await execFileAsync('git', args, { cwd: root, maxBuffer: 1024 * 1024 * 10 });
  return stdout.trim();
}

async function readConfig() {
  try {
    return { ...defaultConfig(), ...JSON.parse(await readFile(configPath, 'utf8')) };
  } catch (error) {
    if (error?.code === 'ENOENT') return defaultConfig();
    throw error;
  }
}

async function writeConfig(config) {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function defaultConfig() {
  return { baseUrl: null, defaultModel: null, actions: {} };
}

async function writeLlmReport(action, response) {
  const path = join(artifactsRoot, 'reports', `lemonade-${action}.md`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    [`# Lemonade ${action}`, '', `Generated: ${response.generatedAt}`, `Model: ${response.model}`, `Base URL: ${response.baseUrl}`, '', response.content].join('\n'),
    'utf8',
  );
}

function parsePromptAndFlags(args) {
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

function assertAction(action) {
  if (!repoActions[action]) {
    throw new Error(`Unknown action "${action}". Run pnpm run llm:actions to list actions.`);
  }
}

function normalizeBaseUrl(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function relativeConfigPath() {
  return 'artifacts/llm/config/lemonade.json';
}

function help() {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  models                         List auto-discovered Lemonade models
  actions                        List repo-specific actions
  config show                    Show local Lemonade CLI config
  config set base-url <url>      Pin Lemonade base URL
  config set default-model <id>  Pin default model id
  config set action <name> <id>  Pin model for one repo action
  ask [--quick] "question"       Ask a repo-aware question
  run <action> [--quick] [prompt] Run docs-upkeep, review, plan, architecture, validation

Examples:
  pnpm run llm:models
  pnpm run llm:config -- set default-model Qwen3-Coder-Next-GGUF
  pnpm run llm:action -- review
  pnpm run llm:ask -- --quick "Where should a docs alignment scanner live?"
`);
}
