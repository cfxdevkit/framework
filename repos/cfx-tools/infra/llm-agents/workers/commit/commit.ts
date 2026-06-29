import { commitPreflightBlock } from '../completion/index.js';
import {
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from '../shared/execution-context.js';
import { unique } from '../shared/logging.js';
import { generateChangesetPlan, writeChangesetFile } from './changeset.js';
import * as R from './commit-results.js';
import { analyzeGateFailures } from './failure-analysis.js';
import { parseCommitFlags } from './flags.js';
import { runRepositoryPolicyGates, runValidationCheck } from './gates/index.js';
import { summarizeWorkingSet } from './hud.js';
import {
  assertNoUnexpectedChanges,
  confirmPrompt,
  executeCommit,
  generateCommitMessage,
  printProposedCommit,
  resolveFilesToStage,
  setTuiConfirm,
  writeCommitReport,
} from './message.js';
import { detectChangedScopes } from './scope.js';
import {
  createWorkflowTerminalUi,
  summarizeCommitPreview,
  summarizeFailureAnalysis,
  summarizeGateFailures,
} from './terminal/ui';
import type { CommitWorkflowOptions, CommitWorkflowResult } from './types.js';

export async function runCommitWorkflow(
  args,
  options: CommitWorkflowOptions = {},
): Promise<CommitWorkflowResult | null> {
  const tuiConfirm = options.tuiConfirm ?? null;
  setTuiConfirm(tuiConfirm);
  try {
    if (args[0] === '--') args.shift();
    const flags = parseCommitFlags(args);
    const approvalMode = options.approvalMode ?? 'defer';
    const messageGenerationModel = flags.model ?? options.modelPolicies?.messageGenerationModel;
    const failureAnalysisModel =
      flags.model ?? options.modelPolicies?.failureAnalysisModel ?? messageGenerationModel;
    const commitWorkflowFlags =
      messageGenerationModel === flags.model ? flags : { ...flags, model: messageGenerationModel };
    const executionContext = await resolveExecutionContext({
      useLlm: true,
      action: 'commit',
      modelOverride: messageGenerationModel,
    });
    const scopes = await detectChangedScopes();
    const ui = createWorkflowTerminalUi({
      commandLabel: 'repo commit',
      executionContext,
      workingSet: summarizeWorkingSet(scopes),
      llmFailureAnalysis: executionContext.llm.status === 'ready',
      ...(options.stdout ? { stdout: options.stdout } : {}),
      ...(options.stderr ? { stderr: options.stderr } : {}),
    });
    ui.start();
    ui.startStep(1, 8, 'Validation sequence');
    ui.note(
      'order: gitnexus analyze -> format -> lint -> typecheck -> tests -> build -> hotspots -> kebab-groups -> check',
    );
    // Unified validation delegates to `cdk-repo-check validation` (single process).
    // Quality + policy gates are merged into one call.
    const qualityReport = await runValidationCheck(flags, ui.gateHooks);
    let failureAnalysis = null;
    if (!qualityReport.passed) {
      failureAnalysis = await analyzeGateFailures({
        command: 'commit',
        executionContext,
        reports: [qualityReport],
        modelOverride: failureAnalysisModel,
      });
      if (!flags.force) {
        ui.finish('blocked', [
          ...summarizeGateFailures(qualityReport),
          ...summarizeFailureAnalysis(failureAnalysis),
          'commit blocked: failing validation gates prevented commit',
        ]);
        return R.buildQualityBlocked({
          executionContext: toExecutionContextRuntimePayload(executionContext),
          scopes,
          qualityGates: qualityReport as CommitWorkflowResult['qualityGates'],
          repositoryPolicies: {
            kind: 'repository-policy',
            label: 'Repository policy follow-up gates',
            passed: false,
            skipped: true,
            results: [],
          },
          failureAnalysis,
          subject: '',
          body: '',
        });
      }
      ui.note('--force enabled: continuing past failing validation gates');
    }
    const skippedPolicyGates = flags.skipPolicyGates || flags.quick;
    let policyReport: Awaited<ReturnType<typeof runRepositoryPolicyGates>>;
    if (skippedPolicyGates) {
      ui.note('policy gates skipped (--quick or --skip-policy-gates)');
      policyReport = {
        kind: 'repository-policy' as const,
        label: 'Repository policy follow-up gates',
        passed: true,
        skipped: true,
        results: [],
      };
    } else {
      // Validation already includes hotspots, kebab-groups, and check as steps.
      // Report them as policy gates for compatibility.
      ui.startStep(2, 7, 'Policy gates (included in validation)');
      const policyResults = qualityReport.results.filter((r) =>
        ['hotspots', 'kebab-groups', 'check'].includes(r.id),
      );
      policyReport = {
        kind: 'repository-policy' as const,
        label: 'Repository policy follow-up gates',
        passed: qualityReport.passed,
        skipped: false,
        results: policyResults,
      };
      if (!policyReport.passed) {
        failureAnalysis = await analyzeGateFailures({
          command: 'commit',
          executionContext,
          reports: [qualityReport, policyReport],
          modelOverride: failureAnalysisModel,
        });
      }
      if (!policyReport.passed && !flags.force) {
        ui.finish('blocked', [
          ...summarizeGateFailures(policyReport),
          ...summarizeFailureAnalysis(failureAnalysis),
          'commit blocked: resolve repository-policy follow-up failures before retrying',
        ]);
        return R.buildPolicyBlocked({
          executionContext: toExecutionContextRuntimePayload(executionContext),
          scopes,
          qualityGates: qualityReport as CommitWorkflowResult['qualityGates'],
          repositoryPolicies: policyReport,
          failureAnalysis,
          subject: '',
          body: '',
        });
      }
      if (!policyReport.passed && flags.force)
        ui.note('--force enabled: continuing past failing repository-policy follow-up gates');
    }
    const totalSteps = 7;
    const scopeStep = 3;
    const releaseStep = 4;
    const messageStep = 5;
    const approvalStep = 6;
    const postChecksStep = 7;
    const commitStep = 7;
    if (scopes.length === 0) {
      ui.startStep(scopeStep, totalSteps, 'Detecting changed scopes');
      ui.finish('clean', ['working tree clean: nothing to commit']);
      return null;
    }
    const initialFiles = unique(scopes.flatMap((s) => s.files));
    ui.note(`${scopes.length} scope(s): ${scopes.map((s) => s.label).join(', ')}`);
    ui.startStep(releaseStep, totalSteps, `Checking release intent [${flags.agent}]`);
    const changesetPlan = await generateChangesetPlan(scopes, flags);
    ui.note(changesetPlan.summary);
    if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0) {
      if (changesetPlan.packages.length > 0) {
        ui.note(
          `publishable package changes: ${changesetPlan.packages.map((p) => p.name).join(', ')}`,
        );
      }
    }
    ui.startStep(messageStep, totalSteps, `Generating commit message [${flags.agent}]`);
    const preflightCtx = await commitPreflightBlock();
    const { response: commitResponse, commit } = await generateCommitMessage(
      preflightCtx,
      changesetPlan,
      commitWorkflowFlags,
    );
    const { subject, body } = commit;
    await writeCommitReport(commitResponse, changesetPlan);
    const c = {
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      qualityGates: qualityReport as CommitWorkflowResult['qualityGates'],
      repositoryPolicies: policyReport,
      failureAnalysis,
      changesetPlan,
      subject,
      body,
    };
    ui.startStep(approvalStep, totalSteps, 'Approval');
    if (flags.dryRun) {
      ui.finish('dry-run', [
        ...summarizeCommitPreview(subject, body),
        'dry-run: skipping changeset writes, post-checks, staging, and commit',
        'report: artifacts/llm/reports/llm-commit.md',
      ]);
      return R.buildDryRun(c);
    }
    if (!flags.yes && approvalMode === 'defer') {
      ui.finish('approval-required', [
        ...summarizeCommitPreview(subject, body),
        'approval required before changeset writes, post-checks, staging, and commit',
        'report: artifacts/llm/reports/llm-commit.md',
      ]);
      return R.buildApprovalRequired(c);
    }
    if (!flags.yes && approvalMode === 'prompt') {
      ui.pause();
      printProposedCommit(subject, body);
      const confirmed = await confirmPrompt('Write changeset if needed and commit? [Y/n] ');
      if (!confirmed) {
        ui.finish('aborted', [
          ...summarizeCommitPreview(subject, body),
          'commit aborted before changeset writes and final commit',
          'report: artifacts/llm/reports/llm-commit.md',
        ]);
        return R.buildAborted(c);
      }
    }
    ui.startStep(postChecksStep, totalSteps, 'Writing changeset and post-checks');
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
      if (written.length > 0) ui.note(`generated changeset files: ${written.join(', ')}`);
    } else if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0) {
      ui.note('release-relevant package changes have no changeset');
    }
    const skipPostChecks = flags.skipPostChecks || flags.quick;
    if (!skipPostChecks) {
      const postCheckReport = await runValidationCheck(
        { ...flags, withBuild: false },
        ui.gateHooks,
      );
      if (!postCheckReport.passed) {
        failureAnalysis = await analyzeGateFailures({
          command: 'commit',
          executionContext,
          reports: [postCheckReport],
          modelOverride: failureAnalysisModel,
        });
      }
      if (!postCheckReport.passed && !flags.force) {
        ui.finish('blocked', [
          ...summarizeCommitPreview(subject, body),
          ...summarizeGateFailures(postCheckReport),
          ...summarizeFailureAnalysis(failureAnalysis),
          'commit blocked: post-generation checks failed',
        ]);
        return R.buildPostChecksBlocked({ ...c, failureAnalysis }, postCheckReport, generatedFiles);
      }
      if (postCheckReport.passed) failureAnalysis = null;
    } else {
      ui.note('skip-post-checks enabled: post-generation validation skipped');
    }
    ui.startStep(commitStep, totalSteps, 'Committing');
    const filesToStage = await resolveFilesToStage(
      initialFiles,
      generatedFiles,
      commit.filesToStage,
    );
    await assertNoUnexpectedChanges(filesToStage);
    const sha = await executeCommit(subject, body, filesToStage);
    ui.finish('committed', [...summarizeCommitPreview(subject, body), `commit: ${sha}`]);
    return R.buildCommitted({ ...c, failureAnalysis }, sha, generatedFiles, flags.yes);
  } finally {
    setTuiConfirm(null);
  }
}
