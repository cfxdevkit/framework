import type { PiLlmConfig, PiLlmProviderType, PiProviderStrategy } from './config.js';
import type { PiScopeName } from './extension.js';

export interface PiLlmModel {
  readonly id?: string;
  readonly checkpoint?: string;
  readonly labels?: readonly string[];
  readonly recipe?: string;
  readonly size?: number;
  readonly suggested?: boolean;
  readonly baseUrl?: string;
}

export interface PiResolvedProviderState {
  readonly type: PiLlmProviderType;
  readonly baseUrl: string | null;
  readonly defaultModel: string | null;
  readonly models: readonly PiLlmModel[];
}

export type PiCliProvider = 'openai';

export interface PiCliInvocation {
  readonly provider: PiCliProvider;
  readonly model: string | null;
  readonly env: Readonly<Record<string, string>>;
}

export interface PiProviderBridge {
  readonly config: PiLlmConfig;
  readonly providerType: PiLlmProviderType;
  readonly models: readonly PiLlmModel[];
  readonly configPath: string;
  readonly providerStrategy: PiProviderStrategy;
  readonly providerBaseUrl: string | null;
  readonly defaultModel: string | null;
  readonly pi: PiCliInvocation;
  readonly scope?: PiScopeName;
}
