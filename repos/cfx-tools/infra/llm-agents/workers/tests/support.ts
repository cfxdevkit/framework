type MockController = {
  mockReset: () => void;
  mockClear: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockReturnValue: (value: unknown) => void;
  mockImplementation: <TArgs extends unknown[], TReturn>(
    implementation: (...args: TArgs) => TReturn,
  ) => void;
};

type WorkflowUiMocks = {
  start?: MockController;
  startStep?: MockController;
  note?: MockController;
  pause?: MockController;
  finish?: MockController;
};

type WorkflowMocks = {
  commandBlock: MockController;
  commitPreflightBlock: MockController;
  resolveExecutionContext: MockController;
  toExecutionContextRuntimePayload: MockController;
  logInfo: MockController;
  logStep: MockController;
  unique: MockController;
  analyzeGateFailures: MockController;
  generateChangesetPlan: MockController;
  writeChangesetFile: MockController;
  runQualityGates: MockController;
  runRepositoryPolicyGates: MockController;
  logFailureAnalysis: MockController;
  logGateReport: MockController;
  logOperationHud: MockController;
  summarizeWorkingSet: MockController;
  createWorkflowTerminalUi?: MockController;
  workflowUi?: WorkflowUiMocks;
  assertNoUnexpectedChanges: MockController;
  confirmPrompt: MockController;
  executeCommit: MockController;
  generateCommitMessage: MockController;
  printProposedCommit: MockController;
  resolveFilesToStage: MockController;
  writeCommitReport: MockController;
  detectChangedScopes: MockController;
};

export function resetWorkflowMocks(mocks: WorkflowMocks): void {
  mocks.commandBlock.mockReset();
  mocks.commitPreflightBlock.mockReset();
  mocks.resolveExecutionContext.mockReset();
  mocks.toExecutionContextRuntimePayload.mockReset();
  mocks.logInfo.mockReset();
  mocks.logStep.mockReset();
  mocks.unique.mockClear();
  mocks.analyzeGateFailures.mockReset();
  mocks.generateChangesetPlan.mockReset();
  mocks.writeChangesetFile.mockReset();
  mocks.runQualityGates.mockReset();
  mocks.runRepositoryPolicyGates.mockReset();
  mocks.logFailureAnalysis.mockReset();
  mocks.logGateReport.mockReset();
  mocks.logOperationHud.mockReset();
  mocks.summarizeWorkingSet.mockReset();
  mocks.createWorkflowTerminalUi?.mockReset?.();
  mocks.workflowUi?.start?.mockReset?.();
  mocks.workflowUi?.startStep?.mockReset?.();
  mocks.workflowUi?.note?.mockReset?.();
  mocks.workflowUi?.pause?.mockReset?.();
  mocks.workflowUi?.finish?.mockReset?.();
  mocks.assertNoUnexpectedChanges.mockReset();
  mocks.confirmPrompt.mockReset();
  mocks.executeCommit.mockReset();
  mocks.generateCommitMessage.mockReset();
  mocks.printProposedCommit.mockReset();
  mocks.resolveFilesToStage.mockReset();
  mocks.writeCommitReport.mockReset();
  mocks.detectChangedScopes.mockReset();
}

export function applyWorkflowMockDefaults(mocks: WorkflowMocks): void {
  mocks.resolveExecutionContext.mockResolvedValue({
    unit: null,
    llm: {
      used: true,
      status: 'ready',
      configPath: 'artifacts/llm/config/llm.json',
      provider: 'litellm',
      baseUrl: 'http://litellm.test/v1',
      model: 'demo-model',
    },
  });
  mocks.toExecutionContextRuntimePayload.mockImplementation((value: unknown) => value);
  mocks.summarizeWorkingSet.mockReturnValue({
    fileCount: 1,
    scopeCount: 1,
    scopeLabels: ['docs'],
    sampleFiles: ['docs/README.md'],
  });
  mocks.createWorkflowTerminalUi?.mockReturnValue?.(mocks.workflowUi);
  mocks.detectChangedScopes.mockResolvedValue([{ label: 'docs', files: ['docs/README.md'] }]);
  mocks.runRepositoryPolicyGates.mockResolvedValue({
    kind: 'repository-policy',
    label: 'Repository policy gates',
    passed: true,
    skipped: false,
    results: [],
  });
  mocks.runQualityGates.mockResolvedValue({
    kind: 'quality',
    label: 'Quality gates',
    passed: true,
    skipped: false,
    results: [],
  });
  mocks.analyzeGateFailures.mockResolvedValue({
    attempted: true,
    usedLlm: true,
    status: 'ready',
    content: 'Summary\nRoot causes\nMinimal fixes\nNext commands',
  });
  mocks.commitPreflightBlock.mockResolvedValue('preflight context');
  mocks.generateChangesetPlan.mockResolvedValue({
    releaseRelevant: false,
    changedChangesets: [],
    changesets: [],
    packages: [],
    summary: 'No release changes detected.',
    risks: [],
  });
  mocks.generateCommitMessage.mockResolvedValue({
    response: { content: '{"subject":"chore: test"}' },
    commit: {
      subject: 'chore: test',
      body: 'body',
      filesToStage: [],
    },
  });
  mocks.writeCommitReport.mockResolvedValue(undefined);
  mocks.confirmPrompt.mockResolvedValue(true);
  mocks.resolveFilesToStage.mockResolvedValue([]);
  mocks.assertNoUnexpectedChanges.mockResolvedValue(undefined);
  mocks.executeCommit.mockResolvedValue('abc123');
}
