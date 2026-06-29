import * as R from './commit-results.js';
import type { Ctx } from './commit-results.js';
import type { CommitWorkflowOptions, CommitWorkflowResult } from './types.js';
import { confirmPrompt, printProposedCommit } from './message.js';
import { summarizeCommitPreview } from './terminal/ui.js';
import type { WorkflowTerminalUi } from './terminal/ui.js';

type ApprovalArgs = {
  flags: ReturnType<typeof import('./flags.js').parseCommitFlags>;
  options: CommitWorkflowOptions;
  ctx: Ctx;
};

export async function handleApproval({
  flags,
  options,
  ctx,
}: ApprovalArgs): Promise<CommitWorkflowResult | null> {
  const { subject, body } = ctx;
  const { tuiConfirm } = options;
  const onAbort = options.onAbort;
  const approvalMode = options.approvalMode ?? 'defer';
  const ui = options.stdout ? createSilentUi() : null;

  if (ui) ui.startStep(6, 7, 'Approval');
  options.onProgress?.('approval', 'Requesting approval');

  // Dry run
  if (flags?.dryRun) {
    onAbort?.();
    if (ui)
      ui.finish('dry-run', [
        ...summarizeCommitPreview(subject, body),
        'dry-run: skipping changeset writes, post-checks, staging, and commit',
        'report: .pi/artifacts/llm/reports/llm-commit.md',
      ]);
    return R.buildDryRun(ctx);
  }

  // Deferred approval
  if (!flags?.yes && approvalMode === 'defer') {
    onAbort?.();
    if (ui)
      ui.finish('approval-required', [
        ...summarizeCommitPreview(subject, body),
        'approval required before changeset writes, post-checks, staging, and commit',
        'report: .pi/artifacts/llm/reports/llm-commit.md',
      ]);
    return R.buildApprovalRequired(ctx);
  }

  // Prompt approval
  if (!flags?.yes && approvalMode === 'prompt') {
    ui?.pause();
    printProposedCommit(subject, body);
    const confirmQuestion = buildConfirmQuestion(subject, body);
    const confirmed = await confirmPrompt(confirmQuestion, tuiConfirm);
    if (!confirmed) {
      onAbort?.();
      if (ui)
        ui.finish('aborted', [
          ...summarizeCommitPreview(subject, body),
          'commit aborted before changeset writes and final commit',
          'report: .pi/artifacts/llm/reports/llm-commit.md',
        ]);
      return R.buildAborted(ctx);
    }
  }

  return null; // continue to post-checks
}

function buildConfirmQuestion(subj: string, bod: string): string {
  const header = `Commit: ${subj}`;
  const bodyPreview = bod ? '\n' + bod.split('\n').slice(0, 10).join('\n') : '';
  return header + bodyPreview + '\n\nApprove and commit? [Y/n]';
}

function createSilentUi(): WorkflowTerminalUi {
  return {
    gateHooks: {
      onGroupStart: () => {},
      onGroupFinish: () => {},
      onGateStart: () => {},
      onGateFinish: () => {},
    },
    start: () => {},
    startStep: () => {},
    note: () => {},
    pause: () => {},
    finish: () => {},
  };
}
