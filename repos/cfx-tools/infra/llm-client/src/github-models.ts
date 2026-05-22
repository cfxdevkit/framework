import {
  chooseBestModel,
  githubModelsEndpoint,
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

export interface GitHubModelsProviderOptions {
  readonly token?: string;
  readonly endpoint?: string;
  readonly defaultModel?: string | null;
}

export class GitHubModelsProvider implements LlmProvider {
  readonly type = 'github-models' as const;
  readonly token: string;
  readonly endpoint: string;
  readonly defaultModel: string;

  constructor(options: GitHubModelsProviderOptions = {}) {
    this.token = options.token ?? process.env.GITHUB_TOKEN ?? '';
    this.endpoint = options.endpoint ?? githubModelsEndpoint;
    this.defaultModel = options.defaultModel ?? process.env.GITHUB_MODEL ?? 'gpt-4o-mini';
  }

  async complete(messages: readonly ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
    if (!this.token) throw new Error('GITHUB_TOKEN is required for GitHubModelsProvider.');
    const attempts: CompletionAttempt[] = [];
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
