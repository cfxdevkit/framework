import { chatPaths, defaultBaseUrls, modelPaths } from '../shared/index.ts';
import { chooseBestModel, joinEndpoint, modelIdentifier, parseModels } from './provider-meta.ts';
import { postChatCompletion } from './provider-stream.ts';
import type {
  ChatMessage,
  CompletionAttemptState,
  CompletionOptions,
  LlmModel,
  LlmProvider,
} from './types.ts';

const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com';

export class LemonadeProvider implements LlmProvider {
  readonly type = 'lemonade' as const;
  readonly baseUrls: readonly string[];
  readonly defaultModel: string | null;

  constructor(
    options: {
      readonly baseUrl?: string;
      readonly baseUrls?: readonly string[];
      readonly defaultModel?: string | null;
    } = {},
  ) {
    this.baseUrls = options.baseUrl ? [options.baseUrl] : (options.baseUrls ?? defaultBaseUrls);
    this.defaultModel = options.defaultModel ?? null;
  }

  async complete(messages: readonly ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    const models = await this.discoverModels();
    const chosen = this.chooseModel(models, opts.model ?? this.defaultModel);
    const model = modelIdentifier(chosen, opts.model ?? this.defaultModel ?? 'local-model');
    const attempts: CompletionAttemptState[] = [];
    const baseUrl = chosen?.baseUrl ?? this.baseUrls[0];
    if (!baseUrl) throw new Error('No Lemonade base URL configured.');
    for (const path of chatPaths) {
      for (let retry = 0; retry < 2; retry++) {
        const content = await postChatCompletion({
          baseUrl,
          chatPath: path,
          model,
          messages,
          opts,
          attempts,
        });
        if (content !== undefined) return content;
      }
    }
    throw new Error(`Lemonade chat completion failed: ${JSON.stringify(attempts)}`);
  }

  async discoverModels(): Promise<readonly LlmModel[]> {
    for (const baseUrl of this.baseUrls) {
      for (const path of modelPaths) {
        const url = joinEndpoint(baseUrl, path);
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
          const text = await response.text();
          if (!response.ok) continue;
          const models = parseModels(text, baseUrl);
          if (models.length > 0) return models;
        } catch {
          // try next endpoint
        }
      }
    }
    return [];
  }

  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined {
    return chooseBestModel(models, preferred);
  }
}

export class LiteLLMProvider implements LlmProvider {
  readonly type = 'litellm' as const;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly defaultModel: string;

  constructor(
    options: {
      readonly baseUrl?: string;
      readonly apiKey?: string;
      readonly defaultModel?: string | null;
    } = {},
  ) {
    this.baseUrl =
      options.baseUrl ?? process.env.LITELLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? '';
    this.apiKey = options.apiKey ?? process.env.LITELLM_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
    this.defaultModel =
      options.defaultModel ??
      process.env.LITELLM_MODEL ??
      process.env.OPENAI_MODEL ??
      'gpt-4o-mini';
  }

  async complete(messages: readonly ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    if (!this.baseUrl) {
      throw new Error('LITELLM_BASE_URL or config baseUrl is required for LiteLLMProvider.');
    }
    const attempts: CompletionAttemptState[] = [];
    const models = await this.discoverModels();
    const model =
      opts.model ?? modelIdentifier(this.chooseModel(models, this.defaultModel), this.defaultModel);
    for (let retry = 0; retry < 2; retry++) {
      const content = await postChatCompletion({
        baseUrl: this.baseUrl,
        chatPath: 'chat/completions',
        model,
        messages,
        opts,
        attempts,
        headers: this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : undefined,
      });
      if (content !== undefined) return content;
    }
    throw new Error(`LiteLLM chat completion failed: ${JSON.stringify(attempts)}`);
  }

  async discoverModels(): Promise<readonly LlmModel[]> {
    if (!this.baseUrl) return [];
    try {
      const response = await fetch(joinEndpoint(this.baseUrl, 'models'), {
        headers: this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : undefined,
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return [];
      return parseModels(await response.text(), this.baseUrl);
    } catch {
      return [];
    }
  }

  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined {
    return chooseBestModel(models, preferred);
  }
}

export class OpenAICompatProvider implements LlmProvider {
  readonly type = 'openai-compat' as const;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly defaultModel: string;

  constructor(
    options: {
      readonly baseUrl?: string;
      readonly apiKey?: string;
      readonly defaultModel?: string | null;
    } = {},
  ) {
    this.baseUrl = options.baseUrl ?? process.env.OPENAI_BASE_URL ?? '';
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.defaultModel = options.defaultModel ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async complete(messages: readonly ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('OPENAI_BASE_URL and OPENAI_API_KEY are required for OpenAICompatProvider.');
    }
    const attempts: CompletionAttemptState[] = [];
    const models = await this.discoverModels();
    const model =
      opts.model ?? modelIdentifier(this.chooseModel(models, this.defaultModel), this.defaultModel);
    for (let retry = 0; retry < 2; retry++) {
      const content = await postChatCompletion({
        baseUrl: this.baseUrl,
        chatPath: 'chat/completions',
        model,
        messages,
        opts,
        attempts,
        headers: { authorization: `Bearer ${this.apiKey}` },
      });
      if (content !== undefined) return content;
    }
    throw new Error(`OpenAI-compatible chat completion failed: ${JSON.stringify(attempts)}`);
  }

  async discoverModels(): Promise<readonly LlmModel[]> {
    if (!this.baseUrl || !this.apiKey) return [];
    try {
      const response = await fetch(joinEndpoint(this.baseUrl, 'models'), {
        headers: { authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return [];
      return parseModels(await response.text(), this.baseUrl);
    } catch {
      return [];
    }
  }

  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined {
    return chooseBestModel(models, preferred);
  }
}

export class GitHubModelsProvider implements LlmProvider {
  readonly type = 'github-models' as const;
  readonly token: string;
  readonly endpoint: string;
  readonly defaultModel: string;

  constructor(
    options: {
      readonly token?: string;
      readonly endpoint?: string;
      readonly defaultModel?: string | null;
    } = {},
  ) {
    this.token = options.token ?? process.env.GITHUB_TOKEN ?? '';
    this.endpoint = options.endpoint ?? GITHUB_MODELS_ENDPOINT;
    this.defaultModel = options.defaultModel ?? process.env.GITHUB_MODEL ?? 'gpt-4o-mini';
  }

  async complete(messages: readonly ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    if (!this.token) throw new Error('GITHUB_TOKEN is required for GitHubModelsProvider.');
    const attempts: CompletionAttemptState[] = [];
    const models = await this.discoverModels();
    const model =
      opts.model ?? modelIdentifier(this.chooseModel(models, this.defaultModel), this.defaultModel);
    for (let retry = 0; retry < 2; retry++) {
      const content = await postChatCompletion({
        baseUrl: this.endpoint,
        chatPath: 'chat/completions',
        model,
        messages,
        opts,
        attempts,
        headers: { authorization: `Bearer ${this.token}` },
      });
      if (content !== undefined) return content;
    }
    throw new Error(`GitHub Models chat completion failed: ${JSON.stringify(attempts)}`);
  }

  async discoverModels(): Promise<readonly LlmModel[]> {
    if (!this.token) return [];
    try {
      const response = await fetch(joinEndpoint(this.endpoint, 'models'), {
        headers: { authorization: `Bearer ${this.token}` },
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) return [];
      return parseModels(await response.text(), this.endpoint);
    } catch {
      return [];
    }
  }

  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined {
    return chooseBestModel(models, preferred);
  }
}
