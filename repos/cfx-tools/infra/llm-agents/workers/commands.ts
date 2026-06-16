import { relative } from 'node:path';
import { createInterface } from 'node:readline/promises';
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
  type ExecutionContextRuntimePayload,
  logExecutionContext,
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from './shared/execution-context.ts';
import {
  configPath,
  configPathEnvVar,
  listRepoActions,
  root,
  type RepoActionDefinition,
  type RepoActionName,
  repoActions,
} from './shared/index.ts';
import {
  generateChangesetPlan,
  writeChangesetFile,
} from './commit/changeset.ts';

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
  const { prompt, model, quick, generate } = parsePromptAndFlags(rest);

  // ── --generate mode for changeset action ──────────────────────────────────
  // Skips the LLM review flow and directly generates .changeset/*.md files
  // for publishable packages with uncommitted changes.
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

// ─── Docs upkeep pipeline ────────────────────────────────────────────────────

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

// ─── Changeset generate (LLM-powered) ─────────────────────────────────────────

async function executeChangesetGenerate(
  action: RepoActionName,
  flags: { quick: boolean; model: string | null },
): Promise<RepoActionExecutionResult> {
  const executionContext = await resolveExecutionContext({
    useLlm: true,
    action,
    modelOverride: flags.model,
  });
  logExecutionContext(executionContext);

  // Build minimal scopes from current git status (staged + unstaged)
  const { execSync } = await import('node:child_process');
  const stagedOutput = execSync('git diff --name-only --cached', {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const unstagedOutput = execSync('git diff --name-only', {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const allFiles = [
    ...stagedOutput.split('\n').filter(Boolean),
    ...unstagedOutput.split('\n').filter(Boolean),
  ];

  // Build scopes: group changed files by their publishable package
  // We detect package dirs by looking at the changed paths and finding the
  // nearest 'repos/cfx-*/packages/*' prefix that matches a known package.
  const scopeFiles: Record<string, string[]> = {};
  for (const f of allFiles) {
    // Find matching package dir: e.g. 'repos/cfx-core/packages/cdk/README.md' → 'repos/cfx-core/packages/cdk'
    const match = f.match(/^(repos\/cfx-[a-z]+\/packages\/[a-z0-9-]+)/);
    if (match) {
      const pkgDir = match[1];
      if (!scopeFiles[pkgDir]) scopeFiles[pkgDir] = [];
      scopeFiles[pkgDir].push(f);
    }
    // Fallback: treat any 'repos/...' path as its top-level scope
    else if (f.startsWith('repos/')) {
      const parts = f.split('/');
      const scopeKey = parts.length >= 4 ? `${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}` : f;
      if (!scopeFiles[scopeKey]) scopeFiles[scopeKey] = [];
      scopeFiles[scopeKey].push(f);
    }
  }

  const scopeArray = Object.entries(scopeFiles).map(([dir, files]) => ({ files, kind: 'dir' }));
  if (scopeArray.length === 0) {
    console.log('✅ No changes detected; nothing to generate.');
    const spec = repoActions[action];
    return {
      action,
      definition: spec,
      executionContext: toExecutionContextRuntimePayload(executionContext),
      response: {
        content:
          'No publishable package changes detected. Nothing to generate.\nRun `git add` first, then try again.',
      },
    };
  }

  const plan = await generateChangesetPlan(scopeArray, { quick: flags.quick });

  if (!plan.releaseRelevant || plan.changedChangesets.length > 0) {
    console.log(`✅ ${plan.summary}`);
    const spec = repoActions[action];
    return {
      action,
      definition: spec,
      executionContext: toExecutionContextRuntimePayload(executionContext),
      response: {
        content: plan.summary,
      },
    };
  }

  // Generate the changeset file
  const createdFiles = await writeChangesetFile(plan);
  if (createdFiles.length > 0) {
    console.log(`✅ Created changeset: ${createdFiles.join(', ')}`);
    console.log(`\nSummary:\n${plan.summary}`);
    if (plan.changesets.length > 0) {
      console.log('\nAffected packages:');
      for (const cs of plan.changesets) {
        console.log(`  • ${cs.packageName}: ${cs.bump} — ${cs.summary}`);
      }
    }
    if (plan.risks.length > 0) {
      console.log('\n⚠️  Risks:');
      for (const r of plan.risks) console.log(`   • ${r}`);
    }
    console.log('\nNext steps:');
    console.log('  1. Review the changeset file');
    console.log('  2. Commit it: git add .changeset/');
    console.log('  3. Run `npx changeset version` to bump versions');
  }

  const spec = repoActions[action];
  return {
    action,
    definition: spec,
    executionContext: toExecutionContextRuntimePayload(executionContext),
    response: {
      content: plan.summary,
    },
  };
}
