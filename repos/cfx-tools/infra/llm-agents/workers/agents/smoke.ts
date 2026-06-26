import { getProviderBaseUrl, readConfig, resolveProvider } from '../completion/index.js';
import type { ValidationProbeResult } from '../validate-models/probe';
import { runValidationProbe } from '../validate-models/probe';
import { summarizeValidationResult } from '../validate-models/report';
import { assignTierProbe, renderSmokeTable, validateTaskKey } from './smoke-render.js';

// ─── Tier probe definitions ───────────────────────────────────────────────────

export type TierProbe = {
  readonly tier: 1 | 2 | 3;
  readonly label: string;
  readonly representativeActions: readonly string[];
  /** Prompt used for the task-json probes (with and without thinking). */
  readonly taskPrompt: string;
  readonly taskKey: string;
};

const TIER_PROBES: readonly TierProbe[] = [
  {
    tier: 1,
    label: 'Lightweight / structured output',
    representativeActions: ['validation'],
    taskPrompt:
      'List 2 shell commands to validate a TypeScript monorepo. ' +
      'Reply with ONLY minified JSON and no other text: {"commands":["cmd1","cmd2"]}',
    taskKey: 'commands',
  },
  {
    tier: 2,
    label: 'Documentation generation',
    representativeActions: ['docs-api', 'readme-upkeep', 'structure-upkeep', 'package-pages'],
    taskPrompt:
      'Write a one-sentence JSDoc description for a TypeScript function named `runBuild`. ' +
      'Reply with ONLY minified JSON and no other text: {"description":"..."}',
    taskKey: 'description',
  },
  {
    tier: 3,
    label: 'Reasoning / code review',
    representativeActions: [
      'review',
      'commit',
      'changeset',
      'release-readiness',
      'ci-cd',
      'test-audit',
      'repo-health',
      'docs-pipeline',
    ],
    taskPrompt:
      'In one sentence, what is the main risk of merging code that has not been linted? ' +
      'Reply with ONLY minified JSON and no other text: {"risk":"..."}',
    taskKey: 'risk',
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type SmokeProbeSet = {
  readonly cold: ValidationProbeResult;
  readonly hot: ValidationProbeResult;
  readonly task: ValidationProbeResult;
  readonly taskNoThink: ValidationProbeResult;
};

export type SmokeModelResult = {
  readonly model: string;
  readonly tier: 1 | 2 | 3 | 'default';
  readonly tierLabel: string;
  readonly assignedActions: readonly string[];
  readonly probes: SmokeProbeSet;
  readonly ok: boolean;
  readonly reasoningObserved: boolean;
  readonly error: string | null;
};

export type SmokeTestReport = {
  readonly generatedAt: string;
  readonly provider: string;
  readonly baseUrl: string;
  readonly defaultModel: string | null;
  readonly results: readonly SmokeModelResult[];
};

export async function runAgentSmoke(args: string[]): Promise<void> {
  const quick = args.includes('--quick');
  const noThinking = args.includes('--no-thinking');

  const provider = await resolveProvider();
  const config = await readConfig();
  const baseUrl = getProviderBaseUrl(provider);

  console.log(`\nAgent smoke test`);
  console.log(`Provider: ${provider.type}  Base URL: ${baseUrl || 'n/a'}`);
  console.log(`Default model: ${config.defaultModel ?? '(none)'}`);
  console.log(`Probes: cold → hot → task+thinking → task-no-thinking`);
  if (quick) console.log('Mode: quick (reduced token budgets)');
  console.log('');

  // Build model → actions map
  const modelActions = new Map<string, string[]>();
  for (const [action, model] of Object.entries(config.actions ?? {})) {
    if (!modelActions.has(model)) modelActions.set(model, []);
    const entry = modelActions.get(model);
    if (entry) entry.push(action);
  }
  if (config.defaultModel && !modelActions.has(config.defaultModel)) {
    modelActions.set(config.defaultModel, []);
  }

  if (modelActions.size === 0) {
    console.log('No models configured. Nothing to probe.');
    return;
  }

  // Discover models once to get context-window info for each
  const discoveredModels = await provider.discoverModels();
  const modelMeta = new Map(
    discoveredModels
      .filter((m) => m.id || m.checkpoint)
      .map((m) => [m.id ?? m.checkpoint ?? '', m]),
  );

  const results: SmokeModelResult[] = [];

  for (const [modelId, actions] of modelActions) {
    const tierProbe = assignTierProbe(TIER_PROBES, actions);
    const tierNum = actions.length === 0 ? ('default' as const) : tierProbe.tier;
    const tierLabel = actions.length === 0 ? 'default (unconfigured)' : tierProbe.label;

    console.log(`── ${modelId}`);
    console.log(`   tier ${tierNum} · ${tierLabel}`);
    if (actions.length) console.log(`   actions: ${actions.join(', ')}`);

    const meta = modelMeta.get(modelId);
    const ctxWindow = meta?.maxContextWindow;
    // Derive probe budget from config tokenBudget + model context window
    const budget = config.tokenBudget;
    const fraction = budget?.contextFraction ?? 0.75;
    const cap = budget?.cap; // null = no cap, undefined = default 32768 cap
    const quickBudget = budget?.quick ?? 512;
    const cloudFallback = budget?.cloudFallback ?? 4096;
    const computedFull = ctxWindow
      ? cap === null
        ? Math.floor(ctxWindow * fraction)
        : Math.min(Math.floor(ctxWindow * fraction), cap ?? 32768)
      : cloudFallback;
    const probeBudget = quick ? Math.max(quickBudget, Math.floor(computedFull / 4)) : computedFull;
    if (ctxWindow) {
      console.log(
        `   ctx ${(ctxWindow / 1024).toFixed(0)}k → budget ${probeBudget} tokens (fraction ${fraction}, cap ${cap === null ? 'none' : (cap ?? 32768)})`,
      );
    }

    const baseParams = {
      provider,
      config,
      model: modelId,
      quick,
      minContextTokens: null as null,
    };

    // 1. Cold probe — simple echo, measures load time
    const cold = await runValidationProbe({
      ...baseParams,
      action: 'smoke-cold',
      prompt: 'Reply with exactly: OK',
      maxTokens: probeBudget,
      enableThinking: false,
    });
    console.log(`   cold:       ${summarizeValidationResult({ model: modelId, ...cold })}`);

    // 2. Hot probe — same prompt, model should already be warm
    const hot = await runValidationProbe({
      ...baseParams,
      action: 'smoke-hot',
      prompt: 'Reply with exactly: OK',
      maxTokens: probeBudget,
      enableThinking: false,
    });
    console.log(`   hot:        ${summarizeValidationResult({ model: modelId, ...hot })}`);

    // 3. Task probe WITH thinking — tier-appropriate JSON, thinking allowed
    const task = noThinking
      ? { ...cold, ok: false, error: 'skipped (--no-thinking)' }
      : await runValidationProbe({
          ...baseParams,
          action: `smoke-task-t${tierNum}`,
          prompt: tierProbe.taskPrompt,
          maxTokens: probeBudget,
          validate: validateTaskKey(tierProbe.taskKey),
        });
    if (!noThinking) {
      console.log(`   task+think: ${summarizeValidationResult({ model: modelId, ...task })}`);
    }

    // 4. Task probe WITHOUT thinking — same prompt, explicit disable
    const taskNoThink = await runValidationProbe({
      ...baseParams,
      action: `smoke-task-nt${tierNum}`,
      prompt: tierProbe.taskPrompt,
      maxTokens: probeBudget,
      enableThinking: false,
      validate: validateTaskKey(tierProbe.taskKey),
    });
    console.log(`   task-think: ${summarizeValidationResult({ model: modelId, ...taskNoThink })}`);

    const reasoningObserved =
      cold.reasoningObserved ||
      hot.reasoningObserved ||
      task.reasoningObserved ||
      taskNoThink.reasoningObserved;

    // Model is viable if cold+hot respond AND at least one task probe produces valid JSON
    const viable =
      cold.ok &&
      hot.ok &&
      ((task as ValidationProbeResult & { jsonShapeOk?: boolean }).jsonShapeOk === true ||
        (taskNoThink as ValidationProbeResult & { jsonShapeOk?: boolean }).jsonShapeOk === true);

    let error: string | null = null;
    if (!cold.ok) error = `cold: ${cold.error?.slice(0, 60) ?? 'failed'}`;
    else if (!hot.ok) error = `hot: ${hot.error?.slice(0, 60) ?? 'failed'}`;
    else if (!viable) error = 'task json failed (both thinking variants)';

    results.push({
      model: modelId,
      tier: tierNum,
      tierLabel,
      assignedActions: actions,
      probes: { cold, hot, task, taskNoThink },
      ok: viable,
      reasoningObserved,
      error,
    });

    console.log(`   → ${viable ? '✓ viable' : `✗ not viable${error ? `: ${error}` : ''}`}\n`);
  }

  console.log('Summary:\n');
  console.log(renderSmokeTable(results));

  const passing = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(
    `\n${passing}/${total} models viable.` +
      (passing < total
        ? '\nModels with empty-body cold failures are still loading — retry in a few seconds.' +
          '\nModels with task-json failure but ok cold/hot need prompt or thinking-mode tuning.'
        : '\nAll configured models are responsive and producing valid task output.'),
  );
}
