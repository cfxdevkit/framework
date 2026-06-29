// Main store module - re-exports from split files
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';

// Model registry singleton
let _modelRegistry: ModelRegistry | null = null;

export function setModelRegistry(registry: ModelRegistry): void {
  _modelRegistry = registry;
}

export function getModelRegistry(): ModelRegistry | null {
  return _modelRegistry;
}

export type { MemoryStoreAddParams } from './store-core.js';
// Re-export everything
export { MemoryStore } from './store-core.js';
export {
  appendInbox,
  getIndexFilePath,
  getStorePath,
  loadJSONL,
  readInbox,
  saveIndex,
  saveJSONL,
} from './store-io.js';
export { parseLLMResponse, runReflection } from './store-reflection.js';
export type {
  MemoryConfig,
  MemoryKind,
  MemoryRecord,
  MemoryState,
  MemoryStoreStats,
} from './types.js';
export { DEFAULT_CONFIG } from './types.js';
