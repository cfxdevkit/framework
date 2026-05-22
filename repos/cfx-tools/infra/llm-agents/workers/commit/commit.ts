import { commandBlock, commitPreflightBlock } from '../completion/index.ts';
import { resolveExecutionContext, toExecutionContextRuntimePayload } from '../shared/execution-context.ts';
import { logInfo, logStep, unique } from '../shared/logging.ts';
import { generateChangesetPlan, writeChangesetFile } from './changeset.ts';
import { analyzeGateFailures } from './failure-analysis.ts';
import { parseCommitFlags } from './flags.ts';
import { runQualityGates, runRepositoryPolicyGates } from './gates.ts';
import { logFailureAnalysis, logGateReport, logOperationHud, summarizeWorkingSet } from './hud.ts';
import { assertNoUnexpectedChanges, confirmPrompt, executeCommit, generateCommitMessage, printProposedCommit, resolveFilesToStage, writeCommitReport } from './message.ts';
import { detectChangedScopes } from './scope.ts';
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
  logOperationHud({ title: 'Repo Commit HUD', executionContext, workingSet: summarizeWorkingSet(scopes), llmFailureAnalysis: executionContext.llm.status === 'ready' });
  logStep(1, 8, 'Repository policy and quality gates');
  const policyReport = await runRepositoryPolicyGates();
  logGateReport(policyReport);
  let failureAnalysis = null;
  if (!policyReport.passed) {
    failureAnalysis = await analyzeGateFailures({ command: 'commit', executionContext, reports: [policyReport], modelOverride: failureAnalysisModel });
    logFailureAnalysis(failureAnalysis);
    logInfo('\n  Commit aborted because a blocking repository policy failed.');
    logInfo('  Resolve blocking repository-policy findings before committing.');
    return { command: 'commit', status: 'blocked', phase: 'repository-policy-gates', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: { kind: 'quality', label: 'Quality gates', passed: false, skipped: true, results: [] }, approval: { required: false, approved: false, declined: false }, failureAnalysis, blockedBy: 'repository-policy' };
  }
  const qualityReport = await runQualityGates(flags);
  logGateReport(qualityReport);
  if (!qualityReport.passed) {
    failureAnalysis = await analyzeGateFailures({ command: 'commit', executionContext, reports: [policyReport, qualityReport], modelOverride: failureAnalysisModel });
    logFailureAnalysis(failureAnalysis);
  }
  if (!qualityReport.passed && !flags.force) {
    logInfo('\n  Commit aborted due to quality gate failures. Use --force to bypass.');
    return { command: 'commit', status: 'blocked', phase: 'quality-gates', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, approval: { required: false, approved: false, declined: false }, failureAnalysis, blockedBy: 'quality-gates' };
  }
  if (!qualityReport.passed && flags.force) logInfo('  ⚠ --force: proceeding despite gate failures');
  logStep(2, 8, 'Preflight checks');
  logInfo('  Ensuring GitNexus is registered...');
  await commandBlock('gitnexus ensure', 'pnpm', ['run', 'gitnexus:ensure'], { timeoutMs: 60000 });
  logInfo('  Collecting git status, diff, review, and analysis signals...');
  const preflightCtx = await commitPreflightBlock();
  logInfo('  ✓ preflight complete');
  logStep(3, 8, 'Detecting changed scopes');
  if (scopes.length === 0) {
    logInfo('  Nothing to commit (working tree clean).');
    return null;
  }
  const initialFiles = unique(scopes.flatMap((scope) => scope.files));
  logInfo(`  ${scopes.length} scope(s): ${scopes.map((scope) => scope.label).join(', ')}`);
  logStep(4, 8, `Checking release intent  [${flags.agent}]`);
  const changesetPlan = await generateChangesetPlan(scopes, flags);
  logInfo(`  ${changesetPlan.summary}`);
  if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0) {
    if (changesetPlan.packages.length > 0) {
      logInfo(`  publishable package changes: ${changesetPlan.packages.map((pkg) => pkg.name).join(', ')}`);
    }
    for (const entry of changesetPlan.changesets) {
      logInfo(`  → ${entry.packageName}: ${entry.bump} — ${entry.summary}`);
    }
  }
  logStep(5, 8, `Generating commit message  [${flags.agent}]`);
  const { response: commitResponse, commit } = await generateCommitMessage(preflightCtx, changesetPlan, commitWorkflowFlags);
  const { subject, body } = commit;
  logInfo(`  subject: ${subject}`);
  await writeCommitReport(commitResponse, changesetPlan);
  logInfo('  report: artifacts/llm/reports/llm-commit.md');
  logStep(6, 8, 'Approval');
  printProposedCommit(subject, body);
  if (flags.dryRun) {
    logInfo('  --dry-run: skipping changeset writes, post-generation checks, staging, and commit');
    return { command: 'commit', status: 'dry-run', phase: 'approval', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: false, approved: false, declined: false }, failureAnalysis, dryRun: true };
  }
  if (!flags.yes && approvalMode === 'defer') {
    logInfo('  Approval required before changeset writes, post-checks, staging, and commit.');
    return { command: 'commit', status: 'approval-required', phase: 'approval', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: true, approved: false, declined: false }, failureAnalysis };
  }
  if (!flags.yes && approvalMode === 'prompt') {
    const confirmed = await confirmPrompt('Write changeset if needed and commit? [Y/n] ');
    if (!confirmed) {
      logInfo('  Aborted.');
      return { command: 'commit', status: 'aborted', phase: 'approval', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: true, approved: false, declined: true }, failureAnalysis };
    }
  }
  logStep(7, 8, 'Writing changeset and post-checks');
  const generatedFiles: string[] = [];
  if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0 && changesetPlan.changesets.length > 0 && !flags.skipChangeset) {
    const written = await writeChangesetFile(changesetPlan);
    generatedFiles.push(...written);
    for (const file of written) logInfo(`  ✓ ${file} created`);
  } else if (changesetPlan.releaseRelevant && changesetPlan.changedChangesets.length === 0) {
    logInfo('  ⚠ release-relevant package changes have no changeset');
  }
  if (!flags.skipPostChecks) {
    const postCheckReport = await runQualityGates({ ...flags, withBuild: false });
    logGateReport(postCheckReport);
    if (!postCheckReport.passed) {
      failureAnalysis = await analyzeGateFailures({ command: 'commit', executionContext, reports: [postCheckReport], modelOverride: failureAnalysisModel });
      logFailureAnalysis(failureAnalysis);
    }
    if (!postCheckReport.passed && !flags.force) {
      logInfo('\n  Commit aborted due to post-generation check failures. Use --force to bypass.');
      return { command: 'commit', status: 'blocked', phase: 'post-checks', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, postGenerationQualityGates: postCheckReport, changesetPlan, commitPreview: { subject, body }, approval: { required: !flags.yes, approved: true, declined: false }, failureAnalysis, blockedBy: 'post-checks', generatedFiles };
    }
    if (postCheckReport.passed) failureAnalysis = null;
  } else {
    logInfo('  --skip-post-checks: skipping post-generation validation');
  }
  logStep(8, 8, 'Committing');
  const filesToStage = await resolveFilesToStage(initialFiles, generatedFiles, commit.filesToStage);
  await assertNoUnexpectedChanges(filesToStage);
  const sha = await executeCommit(subject, body, filesToStage);
  logInfo(`  ✓ Committed: ${sha}`);
  return { command: 'commit', status: 'committed', phase: 'completed', executionContext: toExecutionContextRuntimePayload(executionContext), scopes, repositoryPolicies: policyReport, qualityGates: qualityReport, changesetPlan, commitPreview: { subject, body }, approval: { required: !flags.yes, approved: true, declined: false }, failureAnalysis, generatedFiles, sha };
}