import { resolveExecutionContext, toExecutionContextRuntimePayload } from '../shared/execution-context.ts';
import { logInfo, logStep } from '../shared/logging.ts';
import { analyzeGateFailures } from './failure-analysis.ts';
import { parseCommitFlags } from './flags.ts';
import { runQualityGates, runRepositoryPolicyGates } from './gates.ts';
import { logFailureAnalysis, logGateReport, logOperationHud, summarizeWorkingSet } from './hud.ts';
import { detectChangedScopes } from './scope.ts';
import type { PrecommitWorkflowResult } from './types.ts';

export async function runPrecommitWorkflow(args): Promise<PrecommitWorkflowResult> {
  if (args[0] === '--') args.shift();
  const flags = parseCommitFlags(args);
  const executionContext = await resolveExecutionContext({
    useLlm: true,
    action: 'validation',
    modelOverride: flags.model,
  });
  const scopes = await detectChangedScopes();
  logOperationHud({
    title: 'Repo Precommit HUD',
    executionContext,
    workingSet: summarizeWorkingSet(scopes),
    llmFailureAnalysis: executionContext.llm.status === 'ready',
  });
  logStep(1, 1, 'Repository policy and quality gates');
  const policyReport = await runRepositoryPolicyGates();
  logGateReport(policyReport);
  if (!policyReport.passed) {
    const failureAnalysis = await analyzeGateFailures({
      command: 'precommit',
      executionContext,
      reports: [policyReport],
      modelOverride: flags.model,
    });
    logFailureAnalysis(failureAnalysis);
    logInfo('\n  ✗ Precommit failed: repository policy hard-gate failures.');
    logInfo('  Resolve blocking repository-policy findings before committing.');
    return {
      command: 'precommit',
      status: 'blocked',
      phase: 'repository-policy-gates',
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      repositoryPolicies: policyReport,
      qualityGates: { kind: 'quality', label: 'Quality gates', passed: false, skipped: true, results: [] },
      failureAnalysis,
      blockedBy: 'repository-policy',
    };
  }
  const qualityReport = await runQualityGates(flags);
  logGateReport(qualityReport);
  let failureAnalysis = null;
  if (!qualityReport.passed) {
    failureAnalysis = await analyzeGateFailures({
      command: 'precommit',
      executionContext,
      reports: [policyReport, qualityReport],
      modelOverride: flags.model,
    });
    logFailureAnalysis(failureAnalysis);
  }
  if (!qualityReport.passed && !flags.force) {
    logInfo('\n  ✗ Precommit failed: quality gate failures. Use --force to bypass.');
    return {
      command: 'precommit',
      status: 'blocked',
      phase: 'quality-gates',
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      repositoryPolicies: policyReport,
      qualityGates: qualityReport,
      failureAnalysis,
      blockedBy: 'quality-gates',
    };
  }
  if (!qualityReport.passed && flags.force) {
    logInfo('  ⚠ --force: proceeding despite gate failures');
  }
  logInfo('\n  ✓ All precommit gates passed. Run `cdk repo commit` when ready.');
  return {
    command: 'precommit',
    status: qualityReport.passed ? 'passed' : 'forced',
    phase: 'completed',
    executionContext: toExecutionContextRuntimePayload(executionContext),
    scopes,
    repositoryPolicies: policyReport,
    qualityGates: qualityReport,
    failureAnalysis,
  };
}