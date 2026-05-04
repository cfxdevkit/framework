// @ts-nocheck
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
} from './lemonade-completion.ts';
import { repoActions } from './lemonade-shared.ts';

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

export function normalizeBaseUrl(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

export function relativeConfigPath() {
  return 'artifacts/llm/config/lemonade.json';
}

export function help() {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  models                         List auto-discovered Lemonade models
  actions                        List repo-specific actions
  config show                    Show local Lemonade CLI config
  config set base-url <url>      Pin Lemonade base URL
  config set default-model <id>  Pin default model id
  config set action <name> <id>  Pin model for one repo action
  ask [--quick] "question"       Ask a repo-aware question
  docs-upkeep [flags] [prompt]   Refresh docs checks and upkeep markdown folder-by-folder
    --scope <path>               Limit to one docs folder prefix; repeatable
    --max-folders <n>            Limit folder count for bounded local runs
    --docs-only                  Only scan docs/ instead of every markdown file in the repo
    --write                      Apply complete-file markdown updates proposed by the local LLM
    --yes / -y                   Skip write confirmation prompt
    --quick                      Shorter per-folder artifact generation
    --agent <direct|pi-rpc>      Use direct Lemonade calls or Pi RPC for structured LLM steps
    --pi-provider <name>         Pi provider to use with --agent pi-rpc
    --pi-model <id>              Pi model to use with --agent pi-rpc
    --model <id>                 Override LLM model
  commit [flags] [prompt]        Full commit pipeline:
                                   1. Quality gates (lint, typecheck, tests; opt-in: build)
                                   2. Preflight (gitnexus + git + review)
                                   3. Detect changed scopes
                                   4. Generate structured changelog JSON per scope (serial)
                                   5. Generate structured commit JSON
                                   6. Confirm proposed commit
                                   7. Write changelogs + re-run lint/typecheck/tests
                                   8. Stage explicit file list + commit
    --dry-run                    Show what would happen; skip writes and commit
    --yes / -y                   Skip confirmation prompt
    --force / -f                 Commit even if quality gates fail
    --skip-checks                Skip all quality gates (Phase 1)
    --skip-post-checks           Skip post-generation lint/typecheck/tests after changelog writes
    --skip-tests                 Skip Moon test suite in quality gates
    --with-build                 Also run Moon build in quality gates
    --with-tests                 Explicitly keep Moon test suite enabled (default)
    --agent <direct|pi-rpc>       Use direct Lemonade calls or Pi RPC for agent steps
    --pi-provider <name>          Pi provider to use with --agent pi-rpc
    --pi-model <id>               Pi model to use with --agent pi-rpc
    --quick                      Short LLM calls (faster, less detail)
    --model <id>                 Override LLM model
  run <action> [--quick] [prompt] Run docs-upkeep, test-audit, repo-health, review, plan, architecture, validation
  test-upkeep [flags] [prompt]    Analyse test coverage per package, identify hotspots, and optionally write new test files:
                                   1. Discover packages with vitest.config.ts
                                   2. Build deterministic test inventory (source vs test files)
                                   3. Run vitest per package and capture output
                                   4. LLM: identify hotspots, suggest new tests (sibling context propagated)
                                   5. Optionally write missing test files directly to src/
    --scope <path>               Limit to packages under this path prefix; repeatable
    --max-packages <n>           Limit package count for bounded runs
    --skip-test-run              Skip vitest execution (inventory-only analysis)
    --write                      Write LLM-suggested test files to src/ (new files only, skip existing)
    --yes / -y                   Skip write confirmation prompt
    --quick                      Shorter LLM calls
    --agent <direct|pi-rpc>      Use direct Lemonade calls or Pi RPC for structured LLM steps
    --pi-provider <name>         Pi provider to use with --agent pi-rpc
    --pi-model <id>              Pi model to use with --agent pi-rpc
    --model <id>                 Override LLM model

Examples:
  pnpm run llm:models
  pnpm run llm:config -- set default-model Qwen3-Coder-Next-GGUF
  pnpm run llm:commit
  pnpm run llm:commit -- --dry-run
  pnpm run llm:commit -- --yes
  pnpm run llm:commit -- --agent pi-rpc --pi-provider lemonade --pi-model Qwen3-Coder-Next-GGUF
  pnpm run llm:action -- review
  pnpm run llm:docs-upkeep -- --quick
  pnpm run llm:docs-upkeep -- --quick --write --yes --max-folders 3
  pnpm run llm:docs-upkeep -- --agent pi-rpc --pi-provider lemonade --quick --max-folders 1
  pnpm run llm:docs-upkeep -- --scope docs/architecture --max-folders 1
  pnpm run llm:test-audit
  pnpm run llm:ask -- --quick "Where should a docs alignment scanner live?"

  pnpm run llm:test-upkeep
  pnpm run llm:test-upkeep -- --quick --scope repos/cfx-core/packages/core
  pnpm run llm:test-upkeep -- --scope repos/cfx-keys --max-packages 3
  pnpm run llm:test-upkeep -- --write --yes --scope repos/cfx-core/packages/core
  pnpm run llm:test-upkeep -- --agent pi-rpc --pi-provider lemonade --quick --max-packages 1
  pnpm run llm:test-upkeep -- --skip-test-run --quick
`);
}
