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

import { runPrecommit, runPrecommitWorkflow } from './index.ts';

describe('precommit workflow services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
    resetWorkflowMocks(mocks);
    applyWorkflowMockDefaults(mocks);
  });

  it('returns a recoverable blocked result for precommit validation failures', async () => {
    mocks.runValidationCheck.mockResolvedValueOnce({
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: false,
      skipped: false,
      results: [
        {
          kind: 'quality',
          id: 'hotspots',
          label: 'Code hotspots',
          command: 'pnpm run hotspots',
          required: true,
          status: 'error',
          elapsedMs: 100,
          summary: 'oversized file',
          output: '',
          signalLines: [],
          hints: [],
        },
      ],
    });

    const result = await runPrecommitWorkflow([]);

    expect(result).toMatchObject({
      status: 'blocked',
      phase: 'quality-gates',
      blockedBy: 'quality-gates',
      failureAnalysis: null,
    });
    expect(mocks.runValidationCheck).toHaveBeenCalledTimes(1);
  });

  it('supports rerunning a non-exiting precommit workflow after fixing a failing gate', async () => {
    mocks.runValidationCheck
      .mockResolvedValueOnce({
        kind: 'quality' as const,
        label: 'Incremental validation gates',
        passed: false,
        skipped: false,
        results: [
          {
            kind: 'quality',
            id: 'typecheck',
            label: 'Typecheck',
            command: 'pnpm run typecheck',
            required: true,
            status: 'error',
            elapsedMs: 100,
            summary: 'type error',
            output: '',
            signalLines: [],
            hints: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        kind: 'quality' as const,
        label: 'Incremental validation gates',
        passed: true,
        skipped: false,
        results: [],
      });

    const first = await runPrecommitWorkflow([]);
    const second = await runPrecommitWorkflow([]);

    expect(first).toMatchObject({
      status: 'blocked',
      phase: 'quality-gates',
      blockedBy: 'quality-gates',
    });
    expect(second).toMatchObject({
      status: 'passed',
      phase: 'completed',
    });
  });

  it('keeps deterministic wrappers setting exit codes on blocked precommit workflows', async () => {
    mocks.runValidationCheck.mockResolvedValueOnce({
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: false,
      skipped: false,
      results: [],
    });

    const precommitResult = await runPrecommit([]);
    expect(process.exitCode).toBe(1);
    expect(precommitResult.status).toBe('blocked');
  });
});
