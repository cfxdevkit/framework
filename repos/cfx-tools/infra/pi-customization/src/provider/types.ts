import type { PiLlmConfig, PiLlmProviderType, PiProviderStrategy } from '../config/types.js';

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

/**
 * Provider bridge — exposes resolved provider state for PI command handlers.
 * In the PI-integrated path, PI manages provider resolution.
 * This bridge reads from the config resolved via env vars.
 */
export interface PiProviderBridge {
  readonly config: PiLlmConfig;
  readonly providerType: PiLlmProviderType;
  readonly models: readonly PiLlmModel[];
  readonly configPath: string;
  readonly providerStrategy: PiProviderStrategy;
  readonly providerBaseUrl: string | null;
  readonly defaultModel: string | null;
  readonly pi: PiCliInvocation;
}
