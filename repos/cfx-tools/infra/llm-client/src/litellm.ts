import { chooseBestModel, joinEndpoint, modelIdentifier, parseModels, postChatCompletion } from './http.js';
import type {
  ChatMessage,
  CompletionAttempt,
  CompletionOptions,
  LlmModel,
  LlmProvider,
} from './types.js';

export interface LiteLLMProviderOptions {
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly defaultModel?: string | null;
}

export class LiteLLMProvider implements LlmProvider {
  readonly type = 'litellm' as const;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly defaultModel: string;

  constructor(options: LiteLLMProviderOptions = {}) {
    this.baseUrl =
      options.baseUrl ?? process.env.LITELLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? '';
    this.apiKey =
      options.apiKey ?? process.env.LITELLM_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
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
    const attempts: CompletionAttempt[] = [];
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