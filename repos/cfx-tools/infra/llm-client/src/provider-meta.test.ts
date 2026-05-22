import { describe, expect, it } from 'vitest';
import { GitHubModelsProvider } from './github-models.js';
import { LemonadeProvider } from './lemonade.js';
import { LiteLLMProvider } from './litellm.js';
import { getProviderBaseUrl, getProviderDefaultModel } from './provider-meta.js';

describe('provider metadata helpers', () => {
  it('returns the first Lemonade base URL', () => {
    const provider = new LemonadeProvider({ baseUrl: 'http://localhost:13305/api/v1/' });
    expect(getProviderBaseUrl(provider)).toBe('http://localhost:13305/api/v1/');
  });

  it('returns LiteLLM base URL and default model', () => {
    const provider = new LiteLLMProvider({
      baseUrl: 'http://localhost:4000/v1',
      defaultModel: 'my-model',
    });
    expect(getProviderBaseUrl(provider)).toBe('http://localhost:4000/v1');
    expect(getProviderDefaultModel(provider)).toBe('my-model');
  });

  it('returns GitHub Models endpoint', () => {
    const provider = new GitHubModelsProvider({ endpoint: 'https://models.example.test/' });
    expect(getProviderBaseUrl(provider)).toBe('https://models.example.test/');
  });
});