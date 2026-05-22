import { resolveExecutionContext, toExecutionContextRuntimePayload } from '../shared/execution-context.ts';
import { analyzeGateFailures } from './failure-analysis.ts';
import { parseCommitFlags } from './flags.ts';
import { runQualityGates, runRepositoryPolicyGates } from './gates.ts';
import { summarizeWorkingSet } from './hud.ts';
import { detectChangedScopes } from './scope.ts';
import {
  createWorkflowTerminalUi,
  summarizeFailureAnalysis,
  summarizeGateFailures,
} from './terminal-ui.ts';
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
  const ui = createWorkflowTerminalUi({
    commandLabel: 'repo precommit',
    executionContext,
    workingSet: summarizeWorkingSet(scopes),
    llmFailureAnalysis: executionContext.llm.status === 'ready',
  });
  ui.start();
  ui.startStep(1, 1, 'Repository policy and quality gates');
  const policyReport = await runRepositoryPolicyGates(ui.gateHooks);
  if (!policyReport.passed) {
    const failureAnalysis = await analyzeGateFailures({
      command: 'precommit',
      executionContext,
      reports: [policyReport],
      modelOverride: flags.model,
    });
    ui.finish('blocked', [
      ...summarizeGateFailures(policyReport),
      ...summarizeFailureAnalysis(failureAnalysis),
      'precommit blocked: resolve repository-policy failures before retrying',
    ]);
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
  const qualityReport = await runQualityGates(flags, ui.gateHooks);
  let failureAnalysis = null;
  if (!qualityReport.passed) {
    failureAnalysis = await analyzeGateFailures({
      command: 'precommit',
      executionContext,
      reports: [policyReport, qualityReport],
      modelOverride: flags.model,
    });
  }
  if (!qualityReport.passed && !flags.force) {
    ui.finish('blocked', [
      ...summarizeGateFailures(qualityReport),
      ...summarizeFailureAnalysis(failureAnalysis),
      'precommit blocked: failing quality gates prevent commit',
    ]);
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
    ui.note('--force enabled: continuing past failing quality gates');
  }
  ui.finish(qualityReport.passed ? 'passed' : 'forced', ['all precommit gates passed; run `cdk repo commit` when ready']);
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