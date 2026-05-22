import { describe, expect, it } from 'vitest';
import {
  defaultConfig,
  extractAssistantText,
  mergeConfigLayers,
  normalizeConfig,
} from './client.ts';

describe('defaultConfig', () => {
  it('includes the repo harness defaults', () => {
    expect(defaultConfig()).toMatchObject({
      providerProfiles: {},
      actionPolicies: {},
    });
    expect(defaultConfig().harness).toEqual({
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
    });
  });
});

describe('normalizeConfig', () => {
  it('merges partial harness overrides without dropping defaults', () => {
    expect(
      normalizeConfig({
        provider: 'openai-compat',
        providerProfiles: {
          'local-fast': {
            provider: 'litellm',
            defaultModel: 'qwen-local',
          },
        },
        actionPolicies: {
          commit: {
            profile: 'local-fast',
            phases: {
              'failure-analysis': {
                model: 'qwen-strong',
              },
            },
          },
        },
        harness: {
          providerStrategy: 'direct',
          exploratory: {
            allowWideChanges: false,
          },
        },
      }),
    ).toMatchObject({
      provider: 'openai-compat',
      providerProfiles: {
        'local-fast': {
          provider: 'litellm',
          defaultModel: 'qwen-local',
        },
      },
      actionPolicies: {
        commit: {
          profile: 'local-fast',
          phases: {
            'failure-analysis': {
              model: 'qwen-strong',
            },
          },
        },
      },
      harness: {
        version: 1,
        defaultMode: 'deterministic',
        providerStrategy: 'direct',
        deterministic: {
          preserveDeterministicArtifacts: true,
          preserveDeterministicSections: true,
        },
        exploratory: {
          allowCodeChanges: true,
          allowWideChanges: false,
        },
      },
    });
  });
});

describe('extractAssistantText', () => {
  it('extracts plain string assistant content', () => {
    expect(
      extractAssistantText(
        JSON.stringify({
          choices: [{ message: { content: 'hello' } }],
        }),
      ),
    ).toBe('hello');
  });

  it('extracts array-based assistant content', () => {
    expect(
      extractAssistantText(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [
                  { type: 'text', text: 'hello ' },
                  { type: 'text', text: 'world' },
                ],
              },
            },
          ],
        }),
      ),
    ).toBe('hello world');
  });

  it('returns empty string when assistant content is empty', () => {
    expect(
      extractAssistantText(
        JSON.stringify({
          choices: [{ message: { content: '' } }],
        }),
      ),
    ).toBe('');
  });

  it('falls back to raw text only when no assistant content field exists', () => {
    expect(extractAssistantText('plain text response')).toBe('plain text response');
  });
});

describe('mergeConfigLayers', () => {
  it('treats scoped config as an overlay on top of the base config', () => {
    expect(
      mergeConfigLayers(defaultConfig(), {
        harness: {
          defaultMode: 'exploratory',
          exploratory: {
            allowWideChanges: false,
          },
        },
      }),
    ).toMatchObject({
      harness: {
        version: 1,
        defaultMode: 'exploratory',
        providerStrategy: 'auto',
        deterministic: {
          preserveDeterministicArtifacts: true,
          preserveDeterministicSections: true,
        },
        exploratory: {
          allowCodeChanges: true,
          allowWideChanges: false,
        },
      },
    });
  });

  it('merges provider profiles and nested action phase policies additively', () => {
    expect(
      mergeConfigLayers(
        normalizeConfig({
          providerProfiles: {
            'local-fast': {
              provider: 'litellm',
              defaultModel: 'qwen-local',
            },
          },
          actionPolicies: {
            commit: {
              profile: 'local-fast',
              phases: {
                'message-generation': {
                  model: 'qwen-local',
                },
              },
            },
          },
        }),
        {
          providerProfiles: {
            'cloud-strong': {
              provider: 'github-models',
              defaultModel: 'gpt-4.1',
            },
          },
          actionPolicies: {
            commit: {
              phases: {
                'failure-analysis': {
                  profile: 'cloud-strong',
                },
              },
            },
          },
        },
      ),
    ).toMatchObject({
      providerProfiles: {
        'local-fast': {
          provider: 'litellm',
          defaultModel: 'qwen-local',
        },
        'cloud-strong': {
          provider: 'github-models',
          defaultModel: 'gpt-4.1',
        },
      },
      actionPolicies: {
        commit: {
          profile: 'local-fast',
          phases: {
            'message-generation': {
              model: 'qwen-local',
            },
            'failure-analysis': {
              profile: 'cloud-strong',
            },
          },
        },
      },
    });
  });
});
