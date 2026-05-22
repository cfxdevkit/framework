import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyWorkflowMockDefaults, resetWorkflowMocks } from './workflow.test-support.ts';

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
  runQualityGates: vi.fn(),
  runRepositoryPolicyGates: vi.fn(),
  logFailureAnalysis: vi.fn(),
  logGateReport: vi.fn(),
  logOperationHud: vi.fn(),
  summarizeWorkingSet: vi.fn(),
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

vi.mock('./gates.ts', () => ({
  runQualityGates: mocks.runQualityGates,
  runRepositoryPolicyGates: mocks.runRepositoryPolicyGates,
}));

vi.mock('./hud.ts', () => ({
  logFailureAnalysis: mocks.logFailureAnalysis,
  logGateReport: mocks.logGateReport,
  logOperationHud: mocks.logOperationHud,
  summarizeWorkingSet: mocks.summarizeWorkingSet,
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

import {
  runCommit,
  runCommitWorkflow,
  runPrecommit,
  runPrecommitWorkflow,
} from './index.ts';

describe('commit workflow services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetWorkflowMocks(mocks);
    applyWorkflowMockDefaults(mocks);
  });

  it('returns a recoverable blocked result for precommit repository-policy failures', async () => {
    mocks.runRepositoryPolicyGates.mockResolvedValueOnce({
      kind: 'repository-policy',
      label: 'Repository policy gates',
      passed: false,
      skipped: false,
      results: [
        {
          label: 'Code hotspots',
          status: 'error',
          summary: 'oversized file',
        },
      ],
    });

    const result = await runPrecommitWorkflow([]);

    expect(result).toMatchObject({
      status: 'blocked',
      phase: 'repository-policy-gates',
      blockedBy: 'repository-policy',
      failureAnalysis: {
        status: 'ready',
      },
    });
    expect(mocks.runQualityGates).not.toHaveBeenCalled();
  });

  it('supports rerunning a non-exiting precommit workflow after fixing a failing gate', async () => {
    mocks.runQualityGates
      .mockResolvedValueOnce({
        kind: 'quality',
        label: 'Quality gates',
        passed: false,
        skipped: false,
        results: [
          {
            label: 'Typecheck',
            status: 'error',
            summary: 'type error',
          },
        ],
      })
      .mockResolvedValueOnce({
        kind: 'quality',
        label: 'Quality gates',
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

  it('returns approval-required for commit workflows before prompting by default', async () => {
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
    mocks.runQualityGates.mockResolvedValueOnce({
      kind: 'quality',
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

  it('keeps deterministic wrappers exiting on blocked commit and precommit workflows', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      return undefined as never;
    }) as never);

    mocks.runRepositoryPolicyGates
      .mockResolvedValueOnce({
        kind: 'repository-policy',
        label: 'Repository policy gates',
        passed: false,
        skipped: false,
        results: [],
      })
      .mockResolvedValueOnce({
        kind: 'repository-policy',
        label: 'Repository policy gates',
        passed: true,
        skipped: false,
        results: [],
      });
    mocks.runQualityGates.mockResolvedValueOnce({
      kind: 'quality',
      label: 'Quality gates',
      passed: false,
      skipped: false,
      results: [],
    });

    const precommitResult = await runPrecommit([]);
    const commitResult = await runCommit([]);

    expect(precommitResult.status).toBe('blocked');
    expect(commitResult?.status).toBe('blocked');
    expect(exitSpy).toHaveBeenCalledTimes(2);
    expect(exitSpy).toHaveBeenNthCalledWith(1, 1);
    expect(exitSpy).toHaveBeenNthCalledWith(2, 1);
  });
});
