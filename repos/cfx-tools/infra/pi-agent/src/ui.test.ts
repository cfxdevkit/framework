import { describe, expect, it } from 'vitest';
import { createPiCommitWorkflowUiState, createPiRuntimeUiState } from './ui.js';

describe('createPiRuntimeUiState', () => {
  it('keeps the persistent footer status compact while retaining full context lines', () => {
    const state = createPiRuntimeUiState({
      extension: {
        name: 'cfxdevkit-repo-agent',
        resources: {
          settingsPath: '.pi/settings.json',
          promptPath: '.pi/prompts/repo-system.md',
          skillPath: '.pi/skills/repo-actions.md',
          extensionPath: '.pi/extensions/repo-agent.ts',
        },
      },
      providerBridge: {
        scope: 'scripts',
        providerType: 'litellm',
        providerStrategy: 'auto',
        configPath: '/workspaces/root/artifacts/llm/config/units/scripts.json',
        defaultModel: 'Qwen3-Coder-Next-GGUF',
        pi: {
          provider: 'litellm',
          model: 'Qwen3-Coder-Next-GGUF',
          baseUrl: 'http://localhost:4000',
          apiKeyEnv: 'LITELLM_KEY',
        },
      },
      actionCount: 14,
    });

    expect(state.statusText).toBe('repo:scripts');
    expect(state.widgetLines).toContain('Repo agent context');
    expect(state.widgetLines).toContain('provider: litellm');
    expect(state.widgetLines).toContain('actions: 14');
  });
});

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