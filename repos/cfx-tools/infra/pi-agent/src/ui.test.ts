import { describe, expect, it } from 'vitest';
import { createPiCommitWorkflowUiState } from './ui.js';

describe('createPiCommitWorkflowUiState', () => {
  it('renders blocked commit workflow state with failure guidance', () => {
    const state = createPiCommitWorkflowUiState({
      command: 'commit',
      status: 'blocked',
      phase: 'quality-gates',
      executionContext: {
        unit: { name: 'docs', rootDir: '/workspaces/root/docs', configPath: 'artifacts/llm/config/units/docs.json' },
        llm: {
          used: true,
          status: 'ready',
          configPath: 'artifacts/llm/config/units/docs.json',
          provider: 'litellm',
          model: 'demo-model',
        },
      },
      repositoryPolicies: {
        label: 'Repository policy gates',
        passed: true,
        skipped: false,
        results: [],
      },
      qualityGates: {
        label: 'Quality gates',
        passed: false,
        skipped: false,
        results: [{ label: 'Typecheck', status: 'error', summary: 'type mismatch' }],
      },
      approval: {
        required: false,
        approved: false,
        declined: false,
      },
      failureAnalysis: {
        attempted: true,
        usedLlm: true,
        status: 'ready',
        content: 'Summary\nMinimal fixes\nNext commands',
      },
      blockedBy: 'quality-gates',
    });

    expect(state.statusText).toBe('commit · blocked · docs');
    expect(state.widgetLines).toContain('status: blocked');
    expect(state.widgetLines).toContain('phase: quality-gates');
    expect(state.widgetLines).toContain('failure guidance:');
  });

  it('renders a clean commit workflow state when no scopes changed', () => {
    const state = createPiCommitWorkflowUiState(null);

    expect(state.statusText).toBe('commit · clean');
    expect(state.widgetLines).toContain('No changed scopes detected.');
  });
});