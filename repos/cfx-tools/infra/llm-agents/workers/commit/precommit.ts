import {
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from '../shared/execution-context.ts';
import { parseCommitFlags } from './flags.ts';
import { runQualityGates, runRepositoryPolicyGates } from './gates.ts';
import { summarizeWorkingSet } from './hud.ts';
import { detectChangedScopes } from './scope.ts';
import { createWorkflowTerminalUi, summarizeGateFailures } from './terminal/ui';
import type { PrecommitWorkflowResult } from './types.ts';

export async function runPrecommitWorkflow(args): Promise<PrecommitWorkflowResult> {
  if (args[0] === '--') args.shift();
  const flags = parseCommitFlags(args);
  // Deterministic execution — no LLM. Use resolveExecutionContext with useLlm:false
  // so execution context metadata is still captured, but no model is resolved.
  const executionContext = await resolveExecutionContext({
    useLlm: false,
    action: 'validation',
  });
  const scopes = await detectChangedScopes();
  const ui = createWorkflowTerminalUi({
    commandLabel: 'repo precommit',
    executionContext,
    workingSet: summarizeWorkingSet(scopes),
    llmFailureAnalysis: false,
  });
  ui.start();
  ui.startStep(1, 1, 'Incremental validation sequence');
  ui.note(
    'order: gitnexus analyze -> format -> lint -> typecheck -> tests -> build -> hotspots -> kebab-groups -> repo check',
  );
  const qualityReport = await runQualityGates(flags, ui.gateHooks);
  if (!qualityReport.passed && !flags.force) {
    ui.finish('blocked', [
      ...summarizeGateFailures(qualityReport),
      'precommit blocked: failing validation gates prevent commit',
      'tip: run `repo_agent_check` for LLM-assisted remediation and OpenSpec change planning',
    ]);
    return {
      command: 'precommit',
      status: 'blocked',
      phase: 'quality-gates',
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      repositoryPolicies: {
        kind: 'repository-policy',
        label: 'Repository policy follow-up gates',
        passed: false,
        skipped: true,
        results: [],
      },
      qualityGates: qualityReport,
      failureAnalysis: null,
      blockedBy: 'quality-gates',
    };
  }
  if (!qualityReport.passed) {
    ui.note('--force enabled: continuing past failing validation gates');
  }
  const policyReport = await runRepositoryPolicyGates(ui.gateHooks);
  if (!policyReport.passed && !flags.force) {
    ui.finish('blocked', [
      ...summarizeGateFailures(policyReport),
      'precommit blocked: resolve repository-policy follow-up failures before retrying',
      'tip: run `repo_agent_check` for LLM-assisted remediation and OpenSpec change planning',
    ]);
    return {
      command: 'precommit',
      status: 'blocked',
      phase: 'repository-policy-gates',
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      repositoryPolicies: policyReport,
      qualityGates: qualityReport,
      failureAnalysis: null,
      blockedBy: 'repository-policy',
    };
  }
  if (!policyReport.passed) {
    ui.note('--force enabled: continuing past failing repository-policy follow-up gates');
  }
  ui.finish(qualityReport.passed && policyReport.passed ? 'passed' : 'forced', [
    'all precommit gates passed; run `cdk repo commit` when ready',
  ]);
  return {
    command: 'precommit',
    status: qualityReport.passed && policyReport.passed ? 'passed' : 'forced',
    phase: 'completed',
    executionContext: toExecutionContextRuntimePayload(executionContext),
    scopes,
    repositoryPolicies: policyReport,
    qualityGates: qualityReport,
    failureAnalysis: null,
  };
}
