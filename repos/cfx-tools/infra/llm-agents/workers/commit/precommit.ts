import {
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from '../shared/execution-context.ts';
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
  ui.startStep(1, 1, 'Incremental validation sequence');
  ui.note(
    'order: gitnexus analyze -> format -> lint -> typecheck -> tests -> hotspots -> kebab-groups -> repo check',
  );
  const qualityReport = await runQualityGates(flags, ui.gateHooks);
  if (!qualityReport.passed) {
    const failureAnalysis = await analyzeGateFailures({
      command: 'precommit',
      executionContext,
      reports: [qualityReport],
      modelOverride: flags.model,
    });
    if (!flags.force) {
      ui.finish('blocked', [
        ...summarizeGateFailures(qualityReport),
        ...summarizeFailureAnalysis(failureAnalysis),
        'precommit blocked: failing validation gates prevent commit',
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
        failureAnalysis,
        blockedBy: 'quality-gates',
      };
    }
    ui.note('--force enabled: continuing past failing validation gates');
  }
  const policyReport = await runRepositoryPolicyGates(ui.gateHooks);
  let failureAnalysis = null;
  if (!policyReport.passed) {
    failureAnalysis = await analyzeGateFailures({
      command: 'precommit',
      executionContext,
      reports: [qualityReport, policyReport],
      modelOverride: flags.model,
    });
  }
  if (!policyReport.passed && !flags.force) {
    ui.finish('blocked', [
      ...summarizeGateFailures(policyReport),
      ...summarizeFailureAnalysis(failureAnalysis),
      'precommit blocked: resolve repository-policy follow-up failures before retrying',
    ]);
    return {
      command: 'precommit',
      status: 'blocked',
      phase: 'repository-policy-gates',
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      repositoryPolicies: policyReport,
      qualityGates: qualityReport,
      failureAnalysis,
      blockedBy: 'repository-policy',
    };
  }
  if (!policyReport.passed && flags.force) {
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
    failureAnalysis,
  };
}
