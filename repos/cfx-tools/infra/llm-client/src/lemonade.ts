import { chatPaths, defaultBaseUrls, modelPaths } from '../workers/shared/index.js';
import {
  chooseBestModel,
  formatFetchError,
  joinEndpoint,
  modelIdentifier,
  parseModels,
  postChatCompletion,
} from './http.js';
import type {
  ChatMessage,
  CompletionAttempt,
  CompletionOptions,
  LlmModel,
  LlmProvider,
} from './types.js';

export interface LemonadeProviderOptions {
  readonly baseUrl?: string;
  readonly baseUrls?: readonly string[];
  readonly defaultModel?: string | null;
}

export class LemonadeProvider implements LlmProvider {
  readonly type = 'lemonade' as const;
  readonly baseUrls: readonly string[];
  readonly defaultModel: string | null;

  constructor(options: LemonadeProviderOptions = {}) {
    this.baseUrls = options.baseUrl ? [options.baseUrl] : (options.baseUrls ?? defaultBaseUrls);
    this.defaultModel = options.defaultModel ?? null;
  }

  async complete(messages: readonly ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    const models = await this.discoverModels();
    const chosen = this.chooseModel(models, opts.model ?? this.defaultModel);
    const model = modelIdentifier(chosen, opts.model ?? this.defaultModel ?? 'local-model');
    const attempts: CompletionAttempt[] = [];
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
        } catch (error) {
          formatFetchError(error);
        }
      }
    }
    return [];
  }

  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined {
    return chooseBestModel(models, preferred);
  }
}
