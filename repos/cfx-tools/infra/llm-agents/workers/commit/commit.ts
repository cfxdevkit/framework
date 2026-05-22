import { commandBlock, commitPreflightBlock } from '../completion/index.ts';
import { resolveExecutionContext, toExecutionContextRuntimePayload } from '../shared/execution-context.ts';
import { unique } from '../shared/logging.ts';
import { generateChangesetPlan, writeChangesetFile } from './changeset.ts';
import { analyzeGateFailures } from './failure-analysis.ts';
import { parseCommitFlags } from './flags.ts';
import { runQualityGates, runRepositoryPolicyGates } from './gates.ts';
import { summarizeWorkingSet } from './hud.ts';
import { assertNoUnexpectedChanges, confirmPrompt, executeCommit, generateCommitMessage, printProposedCommit, resolveFilesToStage, writeCommitReport } from './message.ts';
import { detectChangedScopes } from './scope.ts';
import {
  createWorkflowTerminalUi,
  summarizeCommitPreview,
  summarizeFailureAnalysis,
  summarizeGateFailures,
} from './terminal-ui.ts';
import type { CommitWorkflowOptions, CommitWorkflowResult } from './types.ts';

export async function runCommitWorkflow(args, options: CommitWorkflowOptions = {}): Promise<CommitWorkflowResult | null> {
  if (args[0] === '--') args.shift();
  const flags = parseCommitFlags(args);
  const approvalMode = options.approvalMode ?? 'defer';
  const messageGenerationModel = flags.model ?? options.modelPolicies?.messageGenerationModel;
  const failureAnalysisModel = flags.model ?? options.modelPolicies?.failureAnalysisModel ?? messageGenerationModel;
  const commitWorkflowFlags = messageGenerationModel === flags.model ? flags : { ...flags, model: messageGenerationModel };
  const executionContext = await resolveExecutionContext({ useLlm: true, action: 'commit', modelOverride: messageGenerationModel });
  const scopes = await detectChangedScopes();
  const ui = createWorkflowTerminalUi({
    commandLabel: 'repo commit',
    executionContext,
    workingSet: summarizeWorkingSet(scopes),
    llmFailureAnalysis: executionContext.llm.status === 'ready',
  });
  ui.start();
  ui.startStep(1, 8, 'Repository policy and quality gates');
  const policyReport = await runRepositoryPolicyGates(ui.gateHooks);
  let failureAnalysis = null;
  if (!policyReport.passed) {
    failureAnalysis = await analyzeGateFailures({ command: 'commit', executionContext, reports: [policyReport], modelOverride: failureAnalysisModel });
    ui.finish('blocked', [
      ...summarizeGateFailures(policyReport),
      ...summarizeFailureAnalysis(failureAnalysis),
      'commit blocked: resolve repository-policy failures before retrying',
    ]);
    return { command: 'commit', status: 'blocked', phase: 'repository-policy-gates', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: { kind: 'quality', label: 'Quality gates', passed: false, skipped: true, results: [] }, approval: { required: false, approved: false, declined: false }, failureAnalysis, blockedBy: 'repository-policy' };
  }
  const qualityReport = await runQualityGates(flags, ui.gateHooks);
  if (!qualityReport.passed) {
    failureAnalysis = await analyzeGateFailures({ command: 'commit', executionContext, reports: [policyReport, qualityReport], modelOverride: failureAnalysisModel });
  }
  if (!qualityReport.passed && !flags.force) {
    ui.finish('blocked', [
      ...summarizeGateFailures(qualityReport),
      ...summarizeFailureAnalysis(failureAnalysis),
      'commit blocked: failing quality gates prevented commit',
    ]);
    return { command: 'commit', status: 'blocked', phase: 'quality-gates', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, approval: { required: false, approved: false, declined: false }, failureAnalysis, blockedBy: 'quality-gates' };
  }
  if (!qualityReport.passed && flags.force) ui.note('--force enabled: continuing past failing quality gates');
  ui.startStep(2, 8, 'Preflight checks');
  ui.note('ensuring GitNexus is registered');
  await commandBlock('gitnexus ensure', 'pnpm', ['run', 'gitnexus:ensure'], { timeoutMs: 60000 });
  ui.note('collecting git status, diff, review, and analysis signals');
  const preflightCtx = await commitPreflightBlock();
  ui.startStep(3, 8, 'Detecting changed scopes');
  if (scopes.length === 0) {
    ui.finish('clean', ['working tree clean: nothing to commit']);
    return null;
  }
  const initialFiles = unique(scopes.flatMap((scope) => scope.files));
  ui.note(`${scopes.length} scope(s): ${scopes.map((scope) => scope.label).join(', ')}`);
  ui.startStep(4, 8, `Checking release intent [${flags.agent}]`);
  const changesetPlan = await generateChangesetPlan(scopes, flags);
  ui.note(changesetPlan.summary);
  if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0) {
    if (changesetPlan.packages.length > 0) {
      ui.note(`publishable package changes: ${changesetPlan.packages.map((pkg) => pkg.name).join(', ')}`);
    }
  }
  ui.startStep(5, 8, `Generating commit message [${flags.agent}]`);
  const { response: commitResponse, commit } = await generateCommitMessage(preflightCtx, changesetPlan, commitWorkflowFlags);
  const { subject, body } = commit;
  await writeCommitReport(commitResponse, changesetPlan);
  ui.startStep(6, 8, 'Approval');
  if (flags.dryRun) {
    ui.finish('dry-run', [
      ...summarizeCommitPreview(subject, body),
      'dry-run: skipping changeset writes, post-checks, staging, and commit',
      'report: artifacts/llm/reports/llm-commit.md',
    ]);
    return { command: 'commit', status: 'dry-run', phase: 'approval', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: false, approved: false, declined: false }, failureAnalysis, dryRun: true };
  }
  if (!flags.yes && approvalMode === 'defer') {
    ui.finish('approval-required', [
      ...summarizeCommitPreview(subject, body),
      'approval required before changeset writes, post-checks, staging, and commit',
      'report: artifacts/llm/reports/llm-commit.md',
    ]);
    return { command: 'commit', status: 'approval-required', phase: 'approval', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: true, approved: false, declined: false }, failureAnalysis };
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
      return { command: 'commit', status: 'aborted', phase: 'approval', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: true, approved: false, declined: true }, failureAnalysis };
    }
  }
  ui.startStep(7, 8, 'Writing changeset and post-checks');
  const generatedFiles: string[] = [];
  if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0 && changesetPlan.changesets.length > 0 && !flags.skipChangeset) {
    const written = await writeChangesetFile(changesetPlan);
    generatedFiles.push(...written);
    if (written.length > 0) ui.note(`generated changeset files: ${written.join(', ')}`);
  } else if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0) {
    ui.note('release-relevant package changes have no changeset');
  }
  if (!flags.skipPostChecks) {
    const postCheckReport = await runQualityGates({ ...flags, withBuild: false }, ui.gateHooks);
    if (!postCheckReport.passed) {
      failureAnalysis = await analyzeGateFailures({ command: 'commit', executionContext, reports: [postCheckReport], modelOverride: failureAnalysisModel });
    }
    if (!postCheckReport.passed && !flags.force) {
      ui.finish('blocked', [
        ...summarizeCommitPreview(subject, body),
        ...summarizeGateFailures(postCheckReport),
        ...summarizeFailureAnalysis(failureAnalysis),
        'commit blocked: post-generation checks failed',
      ]);
      return { command: 'commit', status: 'blocked', phase: 'post-checks', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, postGenerationQualityGates: postCheckReport, changesetPlan, commitPreview: { subject, body }, approval: { required: !flags.yes, approved: true, declined: false }, failureAnalysis, blockedBy: 'post-checks', generatedFiles };
    }
    if (postCheckReport.passed) failureAnalysis = null;
  } else {
    ui.note('skip-post-checks enabled: post-generation validation skipped');
  }
  ui.startStep(8, 8, 'Committing');
  const filesToStage = await resolveFilesToStage(initialFiles, generatedFiles, commit.filesToStage);
  await assertNoUnexpectedChanges(filesToStage);
  const sha = await executeCommit(subject, body, filesToStage);
  ui.finish('committed', [...summarizeCommitPreview(subject, body), `commit: ${sha}`]);
  return { command: 'commit', status: 'committed', phase: 'completed', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: !flags.yes, approved: true, declined: false }, failureAnalysis, generatedFiles, sha };
}