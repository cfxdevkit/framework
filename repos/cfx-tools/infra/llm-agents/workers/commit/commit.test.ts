import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyWorkflowMockDefaults, resetWorkflowMocks } from '../tests/support.ts';

const mocks = vi.hoisted(() => ({
  commandBlock: vi.fn(),
  commitPreflightBlock: vi.fn(),
  resolveExecutionContext: vi.fn(),
  toExecutionContextRuntimePayload: vi.fn(),
  logInfo: vi.fn(),
  logStep: vi.fn(),
  unique: vi.fn((items: readonly string[]) => [...new Set(items)]),
  analyzeGateFailures: vi.fn(),
  generateChangesetPlan: vi.fn(),
  writeChangesetFile: vi.fn(),
  runValidationCheck: vi.fn(),
  runQualityGates: vi.fn(),
  runRepositoryPolicyGates: vi.fn(),
  logFailureAnalysis: vi.fn(),
  logGateReport: vi.fn(),
  logOperationHud: vi.fn(),
  summarizeWorkingSet: vi.fn(),
  workflowUi: {
    gateHooks: {},
    start: vi.fn(),
    startStep: vi.fn(),
    note: vi.fn(),
    pause: vi.fn(),
    finish: vi.fn(),
  },
  createWorkflowTerminalUi: vi.fn(),
  assertNoUnexpectedChanges: vi.fn(),
  confirmPrompt: vi.fn(),
  executeCommit: vi.fn(),
  generateCommitMessage: vi.fn(),
  printProposedCommit: vi.fn(),
  resolveFilesToStage: vi.fn(),
  writeCommitReport: vi.fn(),
  detectChangedScopes: vi.fn(),
}));

vi.mock('../completion/index.ts', () => ({
  commandBlock: mocks.commandBlock,
  commitPreflightBlock: mocks.commitPreflightBlock,
}));

vi.mock('../shared/execution-context.ts', () => ({
  resolveExecutionContext: mocks.resolveExecutionContext,
  toExecutionContextRuntimePayload: mocks.toExecutionContextRuntimePayload,
}));

vi.mock('../shared/logging.ts', () => ({
  logInfo: mocks.logInfo,
  logStep: mocks.logStep,
  unique: mocks.unique,
}));

vi.mock('./failure-analysis.ts', () => ({
  analyzeGateFailures: mocks.analyzeGateFailures,
}));

vi.mock('./changeset.ts', () => ({
  generateChangesetPlan: mocks.generateChangesetPlan,
  writeChangesetFile: mocks.writeChangesetFile,
}));

vi.mock('./gates/index.ts', () => ({
  runValidationCheck: mocks.runValidationCheck,
  runQualityGates: mocks.runQualityGates,
  runRepositoryPolicyGates: mocks.runRepositoryPolicyGates,
}));

vi.mock('./hud.ts', () => ({
  logFailureAnalysis: mocks.logFailureAnalysis,
  logGateReport: mocks.logGateReport,
  logOperationHud: mocks.logOperationHud,
  summarizeWorkingSet: mocks.summarizeWorkingSet,
}));

vi.mock('./terminal/ui.ts', () => ({
  createWorkflowTerminalUi: mocks.createWorkflowTerminalUi,
  summarizeCommitPreview: vi.fn((subject: string, body: string) => [
    `commit: ${subject}`,
    `body: ${body}`,
  ]),
  summarizeFailureAnalysis: vi.fn(() => ['analysis: available']),
  summarizeGateFailures: vi.fn(() => ['blocked: gate failed']),
}));

vi.mock('./message.ts', () => ({
  assertNoUnexpectedChanges: mocks.assertNoUnexpectedChanges,
  confirmPrompt: mocks.confirmPrompt,
  executeCommit: mocks.executeCommit,
  generateCommitMessage: mocks.generateCommitMessage,
  printProposedCommit: mocks.printProposedCommit,
  resolveFilesToStage: mocks.resolveFilesToStage,
  writeCommitReport: mocks.writeCommitReport,
}));

vi.mock('./scope.ts', () => ({
  detectChangedScopes: mocks.detectChangedScopes,
}));

import { runCommit, runCommitWorkflow } from './index.ts';

describe('commit workflow services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
    resetWorkflowMocks(mocks);
    applyWorkflowMockDefaults(mocks);
  });

  it('returns approval-required for commit workflows before prompting by default', async () => {
    mocks.runValidationCheck.mockResolvedValueOnce({
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: true,
      skipped: false,
      results: [],
    });
    const result = await runCommitWorkflow([]);

    expect(result).toMatchObject({
      status: 'approval-required',
      phase: 'approval',
      approval: {
        required: true,
        approved: false,
        declined: false,
      },
      commitPreview: {
        subject: 'chore: test',
        body: 'body',
      },
    });
    expect(mocks.confirmPrompt).not.toHaveBeenCalled();
    expect(mocks.executeCommit).not.toHaveBeenCalled();
  });

  it('uses split policy models for commit generation and failure analysis when provided', async () => {
    mocks.runValidationCheck.mockResolvedValueOnce({
      kind: 'quality' as const,
      label: 'Quality gates',
      passed: false,
      skipped: false,
      results: [],
    });

    const result = await runCommitWorkflow([], {
      modelPolicies: {
        messageGenerationModel: 'commit-model',
        failureAnalysisModel: 'failure-model',
      },
    });

    expect(result).toMatchObject({
      status: 'blocked',
      phase: 'quality-gates',
    });
    expect(mocks.resolveExecutionContext).toHaveBeenCalledWith(
      expect.objectContaining({ modelOverride: 'commit-model' }),
    );
    expect(mocks.analyzeGateFailures).toHaveBeenCalledWith(
      expect.objectContaining({ modelOverride: 'failure-model' }),
    );
  });

  it('passes the policy-selected commit model into message generation', async () => {
    mocks.runValidationCheck.mockResolvedValueOnce({
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: true,
      skipped: false,
      results: [],
    });
    await runCommitWorkflow([], {
      modelPolicies: {
        messageGenerationModel: 'commit-model',
      },
    });

    expect(mocks.generateCommitMessage).toHaveBeenCalledWith(
      'preflight context',
      expect.any(Object),
      expect.objectContaining({ model: 'commit-model' }),
    );
  });

  it('keeps deterministic wrappers setting exit codes on blocked commit workflows', async () => {
    mocks.runValidationCheck.mockResolvedValueOnce({
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: false,
      skipped: false,
      results: [],
    });

    process.exitCode = 0;
    const commitResult = await runCommit([]);

    expect(commitResult?.status).toBe('blocked');
    expect(process.exitCode).toBe(1);
  });

  it('marks aborted deterministic commit runs as non-zero without hard exiting', async () => {
    mocks.confirmPrompt.mockResolvedValueOnce(false);
    mocks.runValidationCheck.mockResolvedValueOnce({
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: true,
      skipped: false,
      results: [],
    });

    const result = await runCommit([]);

    expect(result?.status).toBe('aborted');
    // In TUI mode (PI_CODING_AGENT=true), WorkflowTerminalUi is not used
    // so ui.pause() is never called — the test verifies status only.
    expect(process.exitCode).toBe(1);
  });
});
