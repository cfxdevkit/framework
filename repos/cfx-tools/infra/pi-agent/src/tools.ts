import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { format } from 'node:util';
import { defineTool, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import {
  readPiConfig,
  resolveEffectiveActionPolicy,
  type PiEffectiveActionPolicy,
} from './config.js';
import {
  executePiAction,
  executePiCommitWorkflow,
  getPiActionDefinitions,
  type PiCommitWorkflowResult,
  type PiRepoActionExecutionResult,
} from './llm-agents-runtime.js';
import {
  clearPiOperatorWidgets,
  createPiCommitWorkflowUiState,
  createPiRepoActionUiState,
  renderPiActionCatalogLines,
} from './ui.js';

const repoActionCatalogTool = defineTool({
  name: 'repo_action_catalog',
  label: 'repo action catalog',
  description: 'List typed repository workflows available through the shared llm-agents registry.',
  promptSnippet: 'Use this to list supported repo workflows before choosing one to run.',
  parameters: Type.Object({
    mode: Type.Optional(
      Type.String({ description: 'Optional filter: deterministic or exploratory.' }),
    ),
  }),
  async execute(_toolCallId, params) {
    const entries = await getPiActionDefinitions();
    const lines = [...renderPiActionCatalogLines(entries, params.mode)];
    return {
      content: [{ type: 'text', text: lines.join('\n') }],
      details: {
        count: lines.length - 1,
        mode: params.mode ?? null,
        actions: entries.map(({ name, definition }) => ({
          name,
          title: definition.title,
          mode: definition.mode,
          description: definition.description,
        })),
      },
    };
  },
});

const repoRunActionTool = defineTool({
  name: 'repo_run_action',
  label: 'run repo action',
  description: 'Execute a typed repository workflow from the shared llm-agents action registry.',
  promptSnippet:
    'Use this to run a repo workflow by action id and receive structured execution context plus the final response.',
  parameters: Type.Object({
    action: Type.String({ description: 'Shared repo action identifier.' }),
    prompt: Type.Optional(
      Type.String({ description: 'Optional prompt override or follow-up instruction.' }),
    ),
    quick: Type.Optional(
      Type.Boolean({ description: 'Reduce context gathering for a faster exploratory pass.' }),
    ),
    model: Type.Optional(Type.String({ description: 'Optional model override.' })),
  }),
  async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
    const result = await executePiRepoAction({
      action: params.action,
      prompt: params.prompt,
      quick: params.quick,
      model: params.model,
    });

    if (ctx.hasUI) {
      const uiState = createPiRepoActionUiState(result);
      ctx.ui.setStatus('repo-action-tool', uiState.statusText);
      clearPiOperatorWidgets(ctx);
    }

    return {
      content: [{ type: 'text', text: result.response.content }],
      details: {
        action: result.action,
        title: result.definition.title,
        mode: result.definition.mode,
        executionContext: result.executionContext,
      },
    };
  },
});

const repoCommitWorkflowTool = defineTool({
  name: 'repo_commit_workflow',
  label: 'run repo commit workflow',
  description:
    'Execute the non-exiting repository commit workflow and surface status, gates, remediation guidance, and approval state.',
  promptSnippet:
    'Use this to start or rerun the interactive repository commit workflow without leaving the PI session.',
  parameters: Type.Object({
    prompt: Type.Optional(
      Type.String({ description: 'Optional operator instruction for commit message generation.' }),
    ),
    quick: Type.Optional(
      Type.Boolean({ description: 'Reduce context gathering for a faster exploratory pass.' }),
    ),
    model: Type.Optional(Type.String({ description: 'Optional model override.' })),
  }),
  async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
    const result = await executePiCommitSession({
      prompt: params.prompt,
      quick: params.quick,
      model: params.model,
    });

    if (ctx.hasUI) {
      const uiState = createPiCommitWorkflowUiState(result);
      ctx.ui.setStatus('repo-commit-tool', uiState.statusText);
      clearPiOperatorWidgets(ctx);
    }

    return {
      content: [
        {
          type: 'text',
          text: result
            ? `Commit workflow status: ${result.status} (${result.phase})`
            : 'Commit workflow status: clean',
        },
      ],
      details: {
        result,
      },
    };
  },
});

export function registerPiRepoTools(pi: ExtensionAPI): void {
  pi.registerTool(repoActionCatalogTool);
  pi.registerTool(repoRunActionTool);
  pi.registerTool(repoCommitWorkflowTool);
}

export async function executePiRepoAction(options: {
  action: string;
  prompt?: string;
  quick?: boolean;
  model?: string;
}): Promise<PiRepoActionExecutionResult> {
  const actionNames = new Set((await getPiActionDefinitions()).map(({ name }) => name));
  if (!actionNames.has(options.action)) {
    throw new Error(`Unknown repo action: ${options.action}`);
  }

  const args: string[] = [options.action];
  if (options.quick) {
    args.push('--quick');
  }
  if (options.model) {
    args.push('--model', options.model);
  }
  if (options.prompt) {
    args.push(options.prompt);
  }

  const { result } = await withCapturedConsole(async () => await executePiAction(args));
  return result;
}

export async function executePiCommitSession(options: {
  prompt?: string;
  quick?: boolean;
  model?: string;
}): Promise<PiCommitWorkflowResult | null> {
  const args: string[] = [];
  if (options.quick) {
    args.push('--quick');
  }
  if (options.prompt) {
    args.push(options.prompt);
  }

  const commitPolicy = await resolveCommitRuntimePolicy(options.model);
  const { result } = await withScopedCommitPolicy(commitPolicy.profileOverride, async () =>
    withCapturedConsole(
      async () =>
        await executePiCommitWorkflow(args, { modelPolicies: commitPolicy.modelPolicies }),
    ),
  );
  return result;
}

async function resolveCommitRuntimePolicy(explicitModel?: string): Promise<{
  readonly modelPolicies?: {
    readonly messageGenerationModel?: string | null;
    readonly failureAnalysisModel?: string | null;
  };
  readonly profileOverride?: Record<string, unknown>;
}> {
  const config = await readPiConfig();
  const commitPolicy = resolveEffectiveActionPolicy(config, { action: 'commit' });
  const messagePolicy = resolveEffectiveActionPolicy(config, {
    action: 'commit',
    phase: 'message-generation',
  });
  const failurePolicy = resolveEffectiveActionPolicy(config, {
    action: 'commit',
    phase: 'failure-analysis',
  });

  const messageGenerationModel = explicitModel ?? messagePolicy.model ?? commitPolicy.model ?? null;
  const failureAnalysisModel = explicitModel ?? failurePolicy.model ?? messageGenerationModel;
  const profileOverride = buildCommitProfileOverride(commitPolicy);

  return {
    ...(messageGenerationModel || failureAnalysisModel
      ? {
          modelPolicies: {
            ...(messageGenerationModel ? { messageGenerationModel } : {}),
            ...(failureAnalysisModel ? { failureAnalysisModel } : {}),
          },
        }
      : {}),
    ...(profileOverride ? { profileOverride } : {}),
  };
}

function buildCommitProfileOverride(
  commitPolicy: PiEffectiveActionPolicy,
): Record<string, unknown> | undefined {
  if (!commitPolicy.profile.exists || !commitPolicy.profile.provider) {
    return undefined;
  }

  return {
    provider: commitPolicy.profile.provider,
    baseUrl: commitPolicy.profile.baseUrl,
    defaultModel: commitPolicy.profile.defaultModel ?? commitPolicy.model ?? null,
    ...(commitPolicy.profile.requestTimeoutMs !== null
      ? { requestTimeoutMs: commitPolicy.profile.requestTimeoutMs }
      : {}),
    harness: {
      providerStrategy: commitPolicy.profile.providerStrategy,
    },
  };
}

async function withScopedCommitPolicy<T>(
  profileOverride: Record<string, unknown> | undefined,
  work: () => Promise<T>,
): Promise<T> {
  if (!profileOverride) {
    return await work();
  }

  const directory = await mkdtemp(join(tmpdir(), 'cfxdevkit-pi-commit-'));
  const filePath = join(directory, 'llm.commit.json');
  const previous = process.env.CFXDEVKIT_LLM_CONFIG_PATH;
  await writeFile(filePath, `${JSON.stringify(profileOverride, null, 2)}\n`, 'utf8');
  process.env.CFXDEVKIT_LLM_CONFIG_PATH = filePath;
  try {
    return await work();
  } finally {
    if (previous === undefined) {
      delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
    } else {
      process.env.CFXDEVKIT_LLM_CONFIG_PATH = previous;
    }
    await rm(directory, { recursive: true, force: true });
  }
}

async function withCapturedConsole<T>(
  work: () => Promise<T>,
): Promise<{ result: T; logs: readonly string[] }> {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const sink = (...args: unknown[]) => {
    logs.push(format(...args));
  };

  console.log = sink;
  console.warn = sink;
  console.error = sink;
  try {
    const result = await work();
    return { result, logs };
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}
