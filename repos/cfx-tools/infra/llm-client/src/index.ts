export {
  chooseModel,
  createClient,
  defaultConfig,
  discoverModels,
  extractAssistantText,
  normalizeConfig,
  readConfig,
  writeConfig,
} from '../workers/completion/client.js';
export {
  complete,
  completeCommitAgent,
  completeStructuredAgent,
} from '../workers/completion/complete.js';
export {
  buildActionContext,
  buildBaseContext,
  commitPreflightBlock,
  readContextFile,
  writeLlmReport,
} from '../workers/completion/context.js';
export { parseJsonObject } from '../workers/completion/json.js';
export { commandBlock, git } from '../workers/completion/runner.js';
export {
  artifactsRoot,
  chatPaths,
  configPath,
  configPathEnvVar,
  defaultBaseUrls,
  modelPaths,
} from '../workers/shared/index.js';
export {
  buildMonorepoUnitConfig,
  findMonorepoUnit,
  findMonorepoUnitByConfigPath,
  listMonorepoUnits,
  relativeAgentConfigPath,
  renderMonorepoUnitConfig,
  resolveAgentConfigPath,
} from '../workers/shared/units.js';
export { LlmProviderNotFoundError } from './errors.js';
export { createProvider } from './factory.js';
export { GitHubModelsProvider } from './github-models.js';
export { LemonadeProvider } from './lemonade.js';
export { LiteLLMProvider } from './litellm.js';
export { OpenAICompatProvider } from './openai-compat.js';
export {
  getProviderBaseUrl,
  getProviderDefaultModel,
  resolveProviderModel,
} from './provider-meta.js';
export { resolveProvider } from './resolve.js';
export {
  listProviderProfiles,
  listScopedRuntimeModels,
  resolveEffectiveActionPolicy,
  resolveNamedProviderProfile,
  resolveRuntimeBridgeState,
  resolveScopedProviderType,
  resolveScopedRuntimeConfig,
} from './runtime-bridge.js';
export type {
  ChatMessage,
  CompletionAttempt,
  CompletionOptions,
  CompletionProgressEvent,
  CompletionReport,
  LlmActionPhasePolicy,
  LlmActionPolicy,
  LlmConfig,
  LlmEffectiveActionPolicy,
  LlmHarnessConfig,
  LlmHarnessMode,
  LlmModel,
  LlmProvider,
  LlmProviderProfile,
  LlmProviderStrategy,
  LlmProviderType,
  LlmResolvedProviderProfile,
  LlmRuntimeBridgeState,
  MonorepoUnit,
  ResolveProviderAttempt,
} from './types.js';
