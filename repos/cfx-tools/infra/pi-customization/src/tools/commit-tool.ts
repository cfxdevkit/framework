import { defineTool } from '@earendil-works/pi-coding-agent';
import { clearPiOperatorWidgets, createPiCommitWorkflowUiState } from '../ui.js';
import { executePiCommitSession } from './commit.js';

const repoCommitWorkflowTool = defineTool({
  name: 'repo_commit_workflow',
  label: 'run repo commit workflow',
  description:
    'Execute the non-exiting repository commit workflow and surface status, gates, remediation guidance, and approval state.',
  promptSnippet:
    'Use this to start or rerun the interactive repository commit workflow without leaving the PI session.',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Optional operator instruction for commit message generation.',
      },
      quick: {
        type: 'boolean',
        description: 'Reduce context gathering for a faster exploratory pass.',
      },
      model: { type: 'string', description: 'Optional model override.' },
    },
    required: [],
  },
  async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
    const tuiConfirm = ctx.hasUI
      ? async (question: string) => await ctx.ui.confirm('Approve commit?', question)
      : null;

    const onProgress = ctx.hasUI
      ? (phase: string, detail?: string) => {
          const message = detail ? `${phase}: ${detail}` : phase;
          ctx.ui.setWorkingVisible(true);
          ctx.ui.setWorkingMessage(message);
          ctx.ui.setStatus('repo-commit-progress', message);
          ctx.ui.setWidget(
            'repo-agent-commit',
            [`phase: ${phase}`, ...(detail ? [`detail: ${detail}`] : [])],
            { placement: 'aboveEditor' },
          );
        }
      : undefined;

    const onAbort = ctx.hasUI
      ? () => {
          ctx.ui.setWorkingVisible(false);
          ctx.ui.setStatus('repo-commit-progress', 'Commit workflow aborted');
          ctx.ui.setWidget('repo-agent-commit', undefined, { placement: 'aboveEditor' });
        }
      : undefined;

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
      originalLog(...args);
    };
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      logs.push(`WARN: ${args.map(String).join(' ')}`);
      originalWarn(...args);
    };
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logs.push(`ERROR: ${args.map(String).join(' ')}`);
      originalError(...args);
    };

    const result = await executePiCommitSession({
      prompt: params.prompt as string | undefined,
      quick: params.quick as boolean | undefined,
      model: params.model as string | undefined,
      tuiMode: ctx.hasUI,
      singlePassApproval: ctx.hasUI,
      tuiConfirm,
      onProgress,
      onAbort,
      signal: ctx.signal,
      ctx: { hasUI: true, ui: ctx.ui },
    });

    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    const capturedLogs = logs.length > 0 ? logs : null;

    if (ctx.hasUI) {
      ctx.ui.setWorkingVisible(false);
      if (result) {
        const uiState = createPiCommitWorkflowUiState(result);
        ctx.ui.setStatus('repo-commit-tool', uiState.statusText);
        clearPiOperatorWidgets(ctx);
      }
    }

    const sections: string[][] = [];
    const addLine = (line: string) => {
      if (sections.length === 0) {
        sections.push([line]);
      } else {
        const last = sections[sections.length - 1];
        if (last.length === 0 || (last.length === 1 && last[0] === '')) {
          sections.push([line]);
        } else {
          last.push(line);
        }
      }
    };
    const addSection = (title: string, lines: string[]) => {
      if (lines.length > 0) {
        addLine('');
        addLine(title);
        addLine(lines.join('\n'));
      }
    };

    if (result) {
      addLine(`Commit workflow: ${result.status} (${result.phase})`);
      if (result.repositoryPolicies) {
        const repoResults = result.repositoryPolicies.results || [];
        if (repoResults.length > 0) {
          addSection(
            'Repository policies',
            repoResults.map((r: { label: string; status: string }) => `${r.label}: ${r.status}`),
          );
        }
      }
      if (result.qualityGates) {
        const qualityResults = result.qualityGates.results || [];
        if (qualityResults.length > 0) {
          addSection(
            'Quality gates',
            qualityResults.map((r: { label: string; status: string }) => `${r.label}: ${r.status}`),
          );
        }
      }
      if (result.commitPreview) {
        addSection('Commit', [
          result.commitPreview.subject,
          ...(result.commitPreview.body ? result.commitPreview.body.split('\n') : []),
        ]);
      }
      if (result.approval) {
        addSection('Approval', [
          `required=${result.approval.required}, approved=${result.approval.approved}`,
        ]);
      }
      if (result.failureAnalysis) {
        addSection('Failure analysis', [result.failureAnalysis.status]);
      }
      if (result.sha) {
        addSection('Commit', [`SHA: ${result.sha}`]);
      }
      if (result.aborted) {
        addLine('Workflow was aborted by user.');
      }
      if (result.generatedFiles?.length) {
        addSection(
          'Generated files',
          result.generatedFiles.map((f: string) => `- ${f}`),
        );
      }
      if (result.blockedBy) {
        addLine(`Blocked by: ${result.blockedBy}`);
      }
      if (capturedLogs && capturedLogs.length > 0) {
        addSection('Workflow logs', capturedLogs);
      }
    } else {
      addLine('Commit workflow: clean (no changes to commit)');
    }

    const text = sections.flat().filter(Boolean).join('\n');

    return {
      content: [{ type: 'text', text }],
      details: { result },
    };
  },
});

export { repoCommitWorkflowTool };
