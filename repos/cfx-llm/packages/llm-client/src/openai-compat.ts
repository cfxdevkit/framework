import { chooseBestModel, modelIdentifier, postChatCompletion } from './http.js';
import type {
  ChatMessage,
  CompletionAttempt,
  CompletionOptions,
  LlmModel,
  LlmProvider,
} from './types.js';

export interface OpenAICompatProviderOptions {
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly defaultModel?: string | null;
}

export class OpenAICompatProvider implements LlmProvider {
  readonly type = 'openai-compat' as const;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly defaultModel: string;

  constructor(options: OpenAICompatProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.OPENAI_BASE_URL ?? '';
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    this.defaultModel = options.defaultModel ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async complete(messages: readonly ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('OPENAI_BASE_URL and OPENAI_API_KEY are required for OpenAICompatProvider.');
    }
    const attempts: CompletionAttempt[] = [];
    const model =
      opts.model ?? modelIdentifier(this.chooseModel([], this.defaultModel), this.defaultModel);
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
    throw new Error(`OpenAI-compatible chat completion failed: ${JSON.stringify(attempts)}`);
  }

  async discoverModels(): Promise<readonly LlmModel[]> {
    return [];
  }

  chooseModel(models: readonly LlmModel[], preferred?: string | null): LlmModel | undefined {
    return chooseBestModel(models, preferred);
  }
}
