import { homedir } from 'node:os';
import { join } from 'node:path';

export type MemoryKind = 'correction' | 'preference' | 'lesson' | 'convention' | 'pattern';
export type MemorySource = 'session' | 'correction' | 'explicit' | 'inference';
export type MemoryStability = 'volatile' | 'semi_stable' | 'stable';

export interface MemoryRecord {
  id: string;
  kind: MemoryKind;
  content: string;
  confidence: number;
  source: MemorySource;
  tags: string[];
  project?: string;
  created: number;
  updated: number;
  stability: MemoryStability;
}

export interface DailyLogEntry {
  timestamp: number;
  content: string;
  messageCount: number;
}

export interface MemoryConfig {
  enabled: boolean;
  minConfidence: number;
  maxCoreItems: number;
  maxDailyItems: number;
  injectionMaxChars: number;
  extractionModel: string;
  autoApplyHighConfidence: boolean;
  projectLocal: boolean;
  reflectionCadence?: 'daily' | 'weekly' | 'manual';
  reflectionLookbackDays?: number;
}

export interface MemoryState {
  coreLearnings: MemoryRecord[];
  corrections: MemoryRecord[];
  preferences: MemoryRecord[];
  patterns: MemoryRecord[];
  dailyLog: DailyLogEntry[];
  currentSessionMessages: unknown[];
  currentSessionId: string;
  projectRoot?: string;
  reflectionCount: number;
  lastReflectionDate: number;
}

export interface MemoryStoreStats {
  coreLearnings: number;
  corrections: number;
  preferences: number;
  patterns: number;
  dailyLogEntries: number;
  inboxCount: number;
}

export interface MemoryStoreAddParams {
  kind: MemoryKind;
  content: string;
  confidence: number;
  source: 'session' | 'correction' | 'explicit' | 'inference';
  tags: string[];
  stability: 'volatile' | 'semi_stable' | 'stable';
}

export const DEFAULT_CONFIG: MemoryConfig = {
  enabled: true,
  minConfidence: 0.8,
  maxCoreItems: 10,
  maxDailyItems: 50,
  injectionMaxChars: 8000,
  extractionModel: 'Qwen3.6-35B-A3B-MTP-GGUF-Q8_0',
  autoApplyHighConfidence: true,
  projectLocal: true,
};

export const MEMORY_STORE_DIR = join(homedir(), '.pi', 'agent', 'memory');
export const CORE_FILE = 'core.jsonl';
export const CORRECTIONS_FILE = 'corrections.jsonl';
export const PREFERENCES_FILE = 'preferences.jsonl';
export const PATTERNS_FILE = 'patterns.jsonl';
export const INDEX_FILE = 'index.json';
export const INBOX_FILE = 'inbox.jsonl';
