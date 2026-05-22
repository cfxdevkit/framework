import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readConfig: vi.fn(),
  resolveProvider: vi.fn(),
  findMonorepoUnit: vi.fn(),
  resolveAgentConfigPath: vi.fn(),
  getProviderBaseUrl: vi.fn(),
  getProviderDefaultModel: vi.fn(),
}));

vi.mock('../workers/shared/index.js', () => ({
  configPathEnvVar: 'CFXDEVKIT_LLM_CONFIG_PATH',
}));

vi.mock('../workers/shared/units.js', () => ({
  findMonorepoUnit: mocks.findMonorepoUnit,
  resolveAgentConfigPath: mocks.resolveAgentConfigPath,
}));

vi.mock('../workers/completion/client.js', () => ({
  readConfig: mocks.readConfig,
}));

vi.mock('./resolve.js', () => ({
  resolveProvider: mocks.resolveProvider,
}));

vi.mock('./provider-meta.js', () => ({
  getProviderBaseUrl: mocks.getProviderBaseUrl,
  getProviderDefaultModel: mocks.getProviderDefaultModel,
}));

import {
  resolveEffectiveActionPolicy,
  resolveRuntimeBridgeState,
  resolveScopedProviderType,
} from './runtime-bridge.js';

describe('runtime bridge scope handling', () => {
  beforeEach(() => {
    mocks.readConfig.mockReset();
    mocks.resolveProvider.mockReset();
    mocks.findMonorepoUnit.mockReset();
    mocks.resolveAgentConfigPath.mockReset();
    mocks.getProviderBaseUrl.mockReset();
    mocks.getProviderDefaultModel.mockReset();

    mocks.resolveAgentConfigPath.mockImplementation((scope?: string) =>
      scope
        ? `/workspaces/root/artifacts/llm/config/units/${scope}.json`
        : '/workspaces/root/artifacts/llm/config/llm.json',
    );
    mocks.findMonorepoUnit.mockReturnValue({
      name: 'docs',
      rootDir: '/workspaces/root/docs',
      rootPath: '/workspaces/root/docs',
      relativeRootPath: 'docs',
      configPath: '/workspaces/root/artifacts/llm/config/units/docs.json',
      relativeConfigPath: 'artifacts/llm/config/units/docs.json',
      description: 'Docs unit',
      focus: 'Documentation',
      defaultMode: 'deterministic',
    });
    mocks.readConfig.mockImplementation(async () => {
      return {
        provider: 'litellm',
        baseUrl: null,
        defaultModel: null,
        actions: {},
        providerProfiles: {},
        actionPolicies: {},
        harness: {
          version: 1,
          defaultMode: 'deterministic',
          providerStrategy: 'auto',
          deterministic: {
            preserveDeterministicArtifacts: true,
            preserveDeterministicSections: true,
          },
          exploratory: {
            allowCodeChanges: true,
            allowWideChanges: true,
          },
        },
      };
    });
    mocks.resolveProvider.mockResolvedValue({
      type: 'litellm',
      discoverModels: async () => [{ id: 'demo-model' }],
    });
    mocks.getProviderBaseUrl.mockReturnValue('http://litellm.test/v1');
    mocks.getProviderDefaultModel.mockReturnValue('demo-model');
    delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
  });

  afterEach(() => {
    delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
  });

  it('applies and restores the scoped config path while resolving runtime state', async () => {
    mocks.readConfig.mockImplementationOnce(async () => {
      expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBe(
        '/workspaces/root/artifacts/llm/config/units/docs.json',
      );
      return {
        provider: 'litellm',
        baseUrl: null,
        defaultModel: null,
        actions: {},
        providerProfiles: {},
        actionPolicies: {},
        harness: {
          version: 1,
          defaultMode: 'deterministic',
          providerStrategy: 'auto',
          deterministic: {
            preserveDeterministicArtifacts: true,
            preserveDeterministicSections: true,
          },
          exploratory: {
            allowCodeChanges: true,
            allowWideChanges: true,
          },
        },
      };
    });

    const state = await resolveRuntimeBridgeState('docs');

    expect(state).toEqual(
      expect.objectContaining({
        scope: 'docs',
        configPath: '/workspaces/root/artifacts/llm/config/units/docs.json',
        providerType: 'litellm',
        providerBaseUrl: 'http://litellm.test/v1',
        defaultModel: 'demo-model',
        models: [{ id: 'demo-model' }],
      }),
    );
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBeUndefined();
  });

  it('restores any previous scoped config env after provider resolution', async () => {
    process.env.CFXDEVKIT_LLM_CONFIG_PATH = '/tmp/original.json';

    await expect(resolveScopedProviderType('docs')).resolves.toBe('litellm');
    expect(process.env.CFXDEVKIT_LLM_CONFIG_PATH).toBe('/tmp/original.json');
  });

  it('reports the effective action policy without changing current provider resolution', async () => {
    mocks.readConfig.mockResolvedValueOnce({
      provider: 'litellm',
      baseUrl: 'http://litellm.test/v1',
      defaultModel: 'repo-default',
      actions: {
        review: 'legacy-review-model',
      },
      providerProfiles: {
        'local-fast': {
          provider: 'litellm',
          defaultModel: 'qwen-local',
        },
      },
      actionPolicies: {
        review: {
          profile: 'local-fast',
        },
      },
      harness: {
        version: 1,
        defaultMode: 'deterministic',
        providerStrategy: 'auto',
        deterministic: {
          preserveDeterministicArtifacts: true,
          preserveDeterministicSections: true,
        },
        exploratory: {
          allowCodeChanges: true,
          allowWideChanges: true,
        },
      },
    });

    const state = await resolveRuntimeBridgeState('docs', { action: 'review' });

    expect(state.providerType).toBe('litellm');
    expect(state.defaultModel).toBe('demo-model');
    expect(state.effectivePolicy).toMatchObject({
      source: 'action',
      model: 'legacy-review-model',
      profile: {
        name: 'local-fast',
        exists: true,
        provider: 'litellm',
        defaultModel: 'qwen-local',
      },
    });
  });

  it('prefers phase overrides over action defaults when resolving effective policies', () => {
    const policy = resolveEffectiveActionPolicy(
      {
        provider: 'litellm',
        baseUrl: null,
        defaultModel: 'repo-default',
        actions: {
          commit: 'legacy-commit-model',
        },
        providerProfiles: {
          'cloud-strong': {
            provider: 'github-models',
            defaultModel: 'gpt-4.1',
          },
        },
        actionPolicies: {
          commit: {
            profile: 'cloud-strong',
            phases: {
              'failure-analysis': {
                model: 'gpt-4.1-mini',
              },
            },
          },
        },
        harness: {
          version: 1,
          defaultMode: 'deterministic',
          providerStrategy: 'auto',
          deterministic: {
            preserveDeterministicArtifacts: true,
            preserveDeterministicSections: true,
          },
          exploratory: {
            allowCodeChanges: true,
            allowWideChanges: true,
          },
        },
      },
      { action: 'commit', phase: 'failure-analysis' },
    );

    expect(policy).toMatchObject({
      source: 'phase',
      legacyActionModel: 'legacy-commit-model',
      model: 'gpt-4.1-mini',
      profile: {
        name: 'cloud-strong',
        exists: true,
        provider: 'github-models',
        defaultModel: 'gpt-4.1',
      },
    });
  });
});
