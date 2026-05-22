export function resetWorkflowMocks(mocks) {
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
  mocks.assertNoUnexpectedChanges.mockReset();
  mocks.confirmPrompt.mockReset();
  mocks.executeCommit.mockReset();
  mocks.generateCommitMessage.mockReset();
  mocks.printProposedCommit.mockReset();
  mocks.resolveFilesToStage.mockReset();
  mocks.writeCommitReport.mockReset();
  mocks.detectChangedScopes.mockReset();
}

export function applyWorkflowMockDefaults(mocks) {
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
  mocks.toExecutionContextRuntimePayload.mockImplementation((value) => value);
  mocks.summarizeWorkingSet.mockReturnValue({
    fileCount: 1,
    scopeCount: 1,
    scopeLabels: ['docs'],
    sampleFiles: ['docs/README.md'],
  });
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