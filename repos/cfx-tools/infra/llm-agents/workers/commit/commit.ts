import { commitPreflightBlock } from '../completion/index.js';
import {
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from '../shared/execution-context.js';
import { unique } from '../shared/logging.js';
import { generateChangesetPlan } from './changeset.js';
import * as R from './commit-results.js';
import { analyzeGateFailures } from './failure-analysis.js';
import type { GateFailureAnalysis } from './failure-analysis.js';
import { parseCommitFlags } from './flags.js';
import { runValidationCheck } from './gates/index.js';
import type { GateReport } from './gates/types.js';
import { summarizeWorkingSet } from './hud.js';
import { generateCommitMessage, writeCommitReport } from './message.js';
import { detectChangedScopes } from './scope.js';
import {
  createWorkflowTerminalUi,
  summarizeFailureAnalysis,
  summarizeGateFailures,
} from './terminal/ui.js';
import { runPostChecksAndCommit } from './post-checks.js';
import { handleApproval } from './approval.js';
import type { CommitWorkflowOptions, CommitWorkflowResult } from './types.js';

export async function runCommitWorkflow(
  args,
  options: CommitWorkflowOptions = {},
): Promise<CommitWorkflowResult | null> {
  const signal = options.signal;
  const onAbort = options.onAbort;
  const onProgress = options.onProgress;
  const inPiMode = process.env.PI_CODING_AGENT === 'true';

  try {
    if (args[0] === '--') args.shift();
    const flags = parseCommitFlags(args);
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
    const ui = inPiMode
      ? null
      : createWorkflowTerminalUi({
          commandLabel: 'repo commit',
          executionContext,
          workingSet: summarizeWorkingSet([]),
          llmFailureAnalysis: executionContext.llm.status === 'ready',
          ...(options.stdout ? { stdout: options.stdout } : {}),
          ...(options.stderr ? { stderr: options.stderr } : {}),
        });
    const scopes = await detectChangedScopes();

    // Validate
    if (ui) ui.startStep(1, 7, 'Validation sequence');
    onProgress?.('validation-start', 'Running validation');
    const qualityReport = await runValidationCheck(
      flags,
      inPiMode ? undefined : ui.gateHooks,
      (stepId, status) => onProgress?.('validation-step', `${stepId} ${status}`),
      (gateId, gateLabel, event, status) =>
        onProgress?.(
          `${event === 'start' ? 'gate-start' : 'gate-finish'}-${gateId}`,
          `${gateLabel}: ${event} ${status}`,
        ),
    );
    let failureAnalysis: GateFailureAnalysis | null = null;
    if (!qualityReport.passed) {
      const fa = await analyzeGateFailures({
        command: 'commit',
        executionContext,
        reports: [qualityReport],
        modelOverride: failureAnalysisModel,
      });
      failureAnalysis = fa;
      if (!flags.force) {
        onAbort?.();
        onProgress?.('validation-complete', 'failed');
        if (ui)
          ui.finish('blocked', [
            ...summarizeGateFailures(qualityReport),
            ...summarizeFailureAnalysis(fa),
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
          failureAnalysis: fa,
          subject: '',
          body: '',
        });
      }
      if (ui) ui.note('--force enabled: continuing past failing validation');
    }
    onProgress?.('validation-complete', qualityReport.passed ? 'passed' : 'failed');
    if (signal?.aborted) {
      onAbort?.();
      return null;
    }

    // Policy gates
    const skippedPolicyGates = flags.skipPolicyGates || flags.quick;
    let policyReport: GateReport;
    if (skippedPolicyGates) {
      if (ui) ui.note('policy gates skipped (--quick or --skip-policy-gates)');
      onProgress?.('policy-gates-skipped', 'Skipped');
      policyReport = {
        kind: 'repository-policy',
        label: 'Repository policy follow-up gates',
        passed: true,
        skipped: true,
        results: [],
      };
    } else {
      if (ui) ui.startStep(2, 7, 'Policy gates');
      onProgress?.('policy-gates', 'Running policy gates');
      const policyResults = qualityReport.results.filter((r) =>
        ['hotspots', 'kebab-groups', 'check'].includes(r.id),
      );
      policyReport = {
        kind: 'repository-policy',
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
        onAbort?.();
        onProgress?.('policy-gates-complete', 'failed');
        if (ui)
          ui.finish('blocked', [
            ...summarizeGateFailures(policyReport),
            ...summarizeFailureAnalysis(failureAnalysis),
            'commit blocked: resolve repository-policy follow-up failures',
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
      if (!policyReport.passed && flags.force && ui)
        ui.note('--force enabled: continuing past failing policy gates');
    }
    onProgress?.('policy-gates-complete', policyReport.passed ? 'passed' : 'failed');
    if (signal?.aborted) {
      onAbort?.();
      return null;
    }

    // Scopes
    if (scopes.length === 0) {
      if (ui) ui.startStep(3, 7, 'Detecting changed scopes');
      onProgress?.('scope-detection', 'No changed scopes');
      if (ui) ui.finish('clean', ['working tree clean: nothing to commit']);
      return null;
    }
    const initialFiles = unique(scopes.flatMap((s) => s.files));
    if (ui) ui.note(`${scopes.length} scope(s): ${scopes.map((s) => s.label).join(', ')}`);
    onProgress?.('scope-detection', `Found ${scopes.length} scope(s)`);
    if (signal?.aborted) {
      onAbort?.();
      return null;
    }

    // Changeset plan
    if (ui) ui.startStep(4, 7, `Checking release intent [${flags.agent}]`);
    onProgress?.('release-intent', 'Checking release intent');
    const changesetPlan = await generateChangesetPlan(scopes, flags);
    if (signal?.aborted) {
      onAbort?.();
      return null;
    }
    if (ui) ui.note(changesetPlan.summary);

    // Message
    if (ui) ui.startStep(5, 7, `Generating commit message [${flags.agent}]`);
    onProgress?.('message-generation', 'Generating commit message');
    const preflightCtx = await commitPreflightBlock();
    const { response: commitResponse, commit: commitAny } = await generateCommitMessage(
      preflightCtx,
      changesetPlan,
      commitWorkflowFlags,
    );
    const { subject, body } = commitAny as any;
    await writeCommitReport(commitResponse, changesetPlan);
    const c = {
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes: scopes as any[],
      qualityGates: qualityReport as CommitWorkflowResult['qualityGates'],
      repositoryPolicies: policyReport,
      failureAnalysis,
      changesetPlan,
      subject,
      body,
    };
    onProgress?.('message-generated', `Subject: ${subject}`);
    if (signal?.aborted) {
      onAbort?.();
      return null;
    }

    // Approval
    const approvalResult = await handleApproval({ flags, options, ctx: c });
    if (approvalResult) return approvalResult;
    if (signal?.aborted) {
      onAbort?.();
      return null;
    }

    // Post & Commit
    return await runPostChecksAndCommit({
      flags,
      ui,
      inPiMode,
      onProgress,
      onAbort,
      executionContext: toExecutionContextRuntimePayload(executionContext),
      scopes,
      qualityGates: qualityReport,
      repositoryPolicies: policyReport,
      failureAnalysis,
      changesetPlan,
      subject,
      body,
      initialFiles: initialFiles as string[],
      commit: { filesToStage: commitAny.filesToStage },
    });
  } finally {
    /* tuiConfirm is per-call via options */
  }
}
