import {
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from '../shared/execution-context.js';
import { parseCommitFlags } from './flags.js';
import { runValidationCheck } from './gates.js';
import { summarizeWorkingSet } from './hud.js';
import { detectChangedScopes } from './scope.js';
import { createWorkflowTerminalUi, summarizeGateFailures } from './terminal/ui';
import type { PrecommitWorkflowResult } from './types.js';

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

  // Single unified validation check delegates to `cdk-repo-check validation`.
  // Runs: gitnexus-analyze → format → lint → typecheck → test → build
  //       → hotspots → kebab-groups → check
  ui.startStep(1, 1, 'Validation sequence');

  const report = await runValidationCheck(flags, ui.gateHooks);

  if (!report.passed && !flags.force) {
    ui.finish('blocked', [
      ...summarizeGateFailures(report),
      'precommit blocked: failing validation steps prevent commit',
      'tip: run `repo_agent_check` for LLM-assisted remediation and OpenSpec change planning',
    ]);
    return {
      command: 'precommit',
      status: 'blocked',
      phase: 'quality-gates',
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      qualityGates: report,
      repositoryPolicies: {
        kind: 'repository-policy' as const,
        label: 'Repository policy follow-up gates',
        passed: false,
        skipped: true,
        results: [],
      },
      failureAnalysis: null,
      blockedBy: 'quality-gates',
    };
  }

  if (!report.passed) {
    ui.note('--force enabled: continuing past failing validation steps');
  }

  ui.finish(report.passed ? 'passed' : 'forced', [
    'precommit complete; run `cdk repo commit` when ready',
  ]);

  return {
    command: 'precommit',
    status: report.passed ? 'passed' : 'forced',
    phase: 'completed',
    executionContext: toExecutionContextRuntimePayload(executionContext),
    scopes,
    qualityGates: report,
    repositoryPolicies: {
      kind: 'repository-policy' as const,
      label: 'Repository policy follow-up gates',
      passed: report.passed,
      skipped: true,
      results: [],
    },
    failureAnalysis: null,
  };
}
