import { writeChangesetFile } from './changeset.js';
import { analyzeGateFailures } from './failure-analysis.js';
import { assertNoUnexpectedChanges, executeCommit, resolveFilesToStage } from './message.js';
import {
  createWorkflowTerminalUi,
  summarizeCommitPreview,
  summarizeFailureAnalysis,
  summarizeGateFailures,
} from './terminal/ui.js';
import { runValidationCheck } from './gates/index.js';
import * as R from './commit-results.js';
import type { CommitWorkflowResult } from './types.js';

export async function runPostChecksAndCommit(options: {
  flags: ReturnType<typeof import('./flags.js').parseCommitFlags>;
  ui: ReturnType<typeof createWorkflowTerminalUi> | null;
  inPiMode: boolean;
  onProgress?: (phase: string, detail?: string) => void;
  onAbort?: () => void;
  executionContext: CommitWorkflowResult['executionContext'];
  scopes: any[];
  qualityGates: CommitWorkflowResult['qualityGates'];
  repositoryPolicies: CommitWorkflowResult['repositoryPolicies'];
  failureAnalysis: CommitWorkflowResult['failureAnalysis'];
  changesetPlan: Awaited<ReturnType<typeof import('./changeset.js').generateChangesetPlan>>;
  subject: string;
  body: string;
  initialFiles: string[];
  commit: { filesToStage: string[] };
}): Promise<CommitWorkflowResult> {
  const {
    flags,
    ui,
    inPiMode,
    onProgress,
    onAbort,
    executionContext,
    scopes,
    qualityGates,
    repositoryPolicies,
    failureAnalysis,
    changesetPlan,
    subject,
    body,
    initialFiles,
    commit,
  } = options;

  onProgress?.('post-checks', 'Running post-generation validation');
  const generatedFiles: string[] = [];
  const skipChangesetsQuick = flags.quick && !flags.changesetBump && !flags.prompt;
  if (
    changesetPlan.releaseRelevant &&
    changesetPlan.changedChangesets.length === 0 &&
    changesetPlan.changesets.length > 0 &&
    !flags.skipChangeset &&
    !skipChangesetsQuick
  ) {
    const written = await writeChangesetFile(changesetPlan);
    generatedFiles.push(...written);
    if (written.length > 0 && ui) ui.note(`generated changeset files: ${written.join(', ')}`);
  }
  if (
    changesetPlan.releaseRelevant &&
    changesetPlan.changedChangesets.length === 0 &&
    !changesetPlan.changesets.length &&
    ui
  ) {
    ui.note('release-relevant package changes have no changeset');
  }
  const skipPostChecks = flags.skipPostChecks || flags.quick;
  if (!skipPostChecks) {
    const postCheckReport = await runValidationCheck(
      { ...flags, withBuild: false },
      inPiMode ? undefined : ui?.gateHooks,
      (stepId, status) => {
        onProgress?.('post-check-step', `${stepId} ${status}`);
      },
      (gateId, gateLabel, event, status) => {
        const prefix = event === 'start' ? 'post-gate-start' : 'post-gate-finish';
        onProgress?.(`${prefix}-${gateId}`, `${gateLabel}: ${event} ${status}`);
      },
    );
    if (!postCheckReport.passed) {
      const fa = await analyzeGateFailures({
        command: 'commit',
        executionContext: executionContext,
        reports: [postCheckReport],
        modelOverride: flags.model ?? null,
      });
      if (!postCheckReport.passed && !flags.force) {
        onAbort?.();
        if (ui)
          ui.finish('blocked', [
            ...summarizeCommitPreview(subject, body),
            ...summarizeGateFailures(postCheckReport),
            ...summarizeFailureAnalysis(fa),
            'commit blocked: post-generation checks failed',
          ]);
        return R.buildPostChecksBlocked(
          {
            executionContext,
            scopes,
            qualityGates,
            repositoryPolicies,
            failureAnalysis: fa,
            changesetPlan,
            subject,
            body,
          },
          postCheckReport,
          generatedFiles,
        );
      }
    }
  } else if (ui) {
    ui.note('skip-post-checks enabled: post-generation validation skipped');
  }
  onProgress?.('post-checks-complete', skipPostChecks ? 'skipped' : 'passed');
  // ── Commit ──────────────────────────────────────────────────────────
  onProgress?.('commit', 'Staging and committing');
  const filesToStage = await resolveFilesToStage(initialFiles, generatedFiles, commit.filesToStage);
  await assertNoUnexpectedChanges(filesToStage);
  const sha = await executeCommit(subject, body, filesToStage);
  if (ui) ui.finish('committed', [...summarizeCommitPreview(subject, body), `commit: ${sha}`]);
  onProgress?.('committed', `SHA: ${sha}`);
  return R.buildCommitted(
    {
      executionContext,
      scopes,
      qualityGates,
      repositoryPolicies,
      failureAnalysis,
      changesetPlan,
      subject,
      body,
    },
    sha,
    generatedFiles,
    flags.yes,
  );
}
