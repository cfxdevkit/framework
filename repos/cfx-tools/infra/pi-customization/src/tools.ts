import { defineTool, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import {
  executePiAction,
  executePiAgentCheck,
  getPiActionDefinitions,
  type PiRepoActionExecutionResult,
} from './llm-agents-runtime.js';
import { executePiCommitSession, setTuiConfirm } from './tools/commit.js';
import { withCapturedConsole } from './tools/utils.js';
import {
  clearPiOperatorWidgets,
  createPiAgentCheckUiState,
  createPiCommitWorkflowUiState,
  createPiRepoActionUiState,
  renderPiActionCatalogLines,
} from './ui.js';

export { executePiCommitSession, setTuiConfirm } from './tools/commit.js';

const repoAgentCheckTool = defineTool({
  name: 'repo_agent_check',
  label: 'run agent check',
  description:
    'Run the full repo validation → OpenSpec change planning pipeline. Validates the repository and auto-creates OpenSpec changes for any error-status validation steps found.',
  promptSnippet:
    'Use this when validation errors are found to create OpenSpec changes for remediation. Returns status, actionable steps, and names of any created changes.',
  parameters: Type.Object({
    dryRun: Type.Optional(
      Type.Boolean({ description: 'Plan without writing OpenSpec artifacts.' }),
    ),
    createBranch: Type.Optional(
      Type.Boolean({ description: 'Create a git branch for the planned changes.' }),
    ),
    quick: Type.Optional(Type.Boolean({ description: 'Reduce LLM context for a faster pass.' })),
  }),
  async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
    const result = await executePiAgentCheck({
      dryRun: params.dryRun,
      createBranch: params.createBranch,
      quick: params.quick,
    });

    if (ctx.hasUI) {
      const uiState = createPiAgentCheckUiState(result);
      ctx.ui.setStatus('repo-agent-check-tool', uiState.statusText);
      clearPiOperatorWidgets(ctx);
    }

    const changeNames = result.artifacts.map((a) => a.name);
    const summary =
      result.status === 'ok'
        ? 'Validation passed — no changes needed.'
        : `Validation ${result.status}: ${changeNames.length} OpenSpec change(s) created: ${
            changeNames.join(', ') || '(none)'
          }`;
    return {
      content: [{ type: 'text', text: summary }],
      details: {
        status: result.status,
        validationStatus: result.validation.status,
        actionableStepCount: result.validation.actionableSteps.length,
        changes: changeNames,
        plan: result.plan
          ? { summary: result.plan.summary, branch: result.plan.branch.name }
          : null,
        artifacts: result.artifacts,
        dryRun: result.dryRun,
      },
    };
  },
});

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
    if (ctx.hasUI) {
      setTuiConfirm(async (question) => {
        return await ctx.ui.confirm('Approve commit?', question);
      });
    }
    try {
      const result = await executePiCommitSession({
        prompt: params.prompt,
        quick: params.quick,
        model: params.model,
        tuiMode: ctx.hasUI,
        singlePassApproval: ctx.hasUI,
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
    } finally {
      setTuiConfirm(null);
    }
  },
});

export function registerPiRepoTools(pi: ExtensionAPI): void {
  pi.registerTool(repoAgentCheckTool);
  pi.registerTool(repoActionCatalogTool);
  pi.registerTool(repoRunActionTool);
  pi.registerTool(repoCommitWorkflowTool);
}

export { executePiAgentCheck } from './llm-agents-runtime.js';
export { withCapturedConsole } from './tools/utils.js';

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
  if (options.quick) args.push('--quick');
  if (options.model) args.push('--model', options.model);
  if (options.prompt) args.push(options.prompt);

  const { result } = await withCapturedConsole(async () => await executePiAction(args));
  return result;
}
