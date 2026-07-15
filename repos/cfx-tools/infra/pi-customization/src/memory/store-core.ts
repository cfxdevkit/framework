import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  appendInbox,
  CORE_FILE,
  CORRECTIONS_FILE,
  getStorePath,
  INDEX_FILE,
  loadJSONL,
  PATTERNS_FILE,
  PREFERENCES_FILE,
  readInbox,
  saveIndex,
  saveJSONL,
} from './store-io.js';
import type {
  DailyLogEntry,
  MemoryConfig,
  MemoryKind,
  MemoryRecord,
  MemoryState,
  MemoryStoreStats,
} from './types.js';

export interface MemoryStoreAddParams {
  kind: MemoryKind;
  content: string;
  confidence: number;
  source: 'session' | 'correction' | 'explicit' | 'inference';
  tags: string[];
  stability: 'volatile' | 'semi_stable' | 'stable';
}

export class MemoryStore {
  private config: MemoryConfig;
  private state: MemoryState;
  private storePath: string;

  constructor(config: MemoryConfig, projectRoot?: string) {
    this.config = config;
    this.storePath = getStorePath(projectRoot);
    this.state = this.initializeState();
  }

  private initializeState(): MemoryState {
    return {
      coreLearnings: [],
      corrections: [],
      preferences: [],
      patterns: [],
      dailyLog: [],
      currentSessionMessages: [],
      currentSessionId: '',
      reflectionCount: 0,
      lastReflectionDate: 0,
    };
  }

  // --- Loading ---

  async load(): Promise<void> {
    await loadJSONL(this.storePath, CORE_FILE, (r) => this.state.coreLearnings.push(r));
    await loadJSONL(this.storePath, CORRECTIONS_FILE, (r) => this.state.corrections.push(r));
    await loadJSONL(this.storePath, PREFERENCES_FILE, (r) => this.state.preferences.push(r));
    await loadJSONL(this.storePath, PATTERNS_FILE, (r) => this.state.patterns.push(r));
    await this.loadIndex();
  }

  private async loadIndex(): Promise<void> {
    try {
      const content = await readFile(join(this.storePath, INDEX_FILE), 'utf-8');
      const index = JSON.parse(content);
      this.state.currentSessionId = index.currentSessionId || '';
      this.state.dailyLog = index.dailyLog || [];
    } catch {
      // No index file
    }
  }

  // --- Saving ---

  async save(): Promise<void> {
    await saveJSONL(this.storePath, CORE_FILE, this.state.coreLearnings);
    await saveJSONL(this.storePath, CORRECTIONS_FILE, this.state.corrections);
    await saveJSONL(this.storePath, PREFERENCES_FILE, this.state.preferences);
    await saveJSONL(this.storePath, PATTERNS_FILE, this.state.patterns);
    await saveIndex(this.storePath, this.state, this.config);
  }

  // --- Memory Operations ---

  async addMemory(record: MemoryStoreAddParams): Promise<MemoryRecord> {
    const memory: MemoryRecord = {
      ...record,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      created: Date.now(),
      updated: Date.now(),
    };

    if (this.hasDuplicate(memory)) return memory;

    switch (record.kind) {
      case 'correction':
        this.state.corrections.push(memory);
        break;
      case 'preference':
        this.state.preferences.push(memory);
        break;
      case 'lesson':
      case 'pattern':
        this.state.patterns.push(memory);
        break;
      default:
        this.state.coreLearnings.push(memory);
    }

    if (record.confidence >= 0.9 && record.stability === 'stable') {
      this.state.coreLearnings.push(memory);
      if (this.state.coreLearnings.length > this.config.maxCoreItems) {
        this.state.coreLearnings = this.state.coreLearnings.slice(-this.config.maxCoreItems);
      }
    }

    return memory;
  }

  async addDailyLog(content: string, messageCount: number): Promise<void> {
    const entry: DailyLogEntry = { timestamp: Date.now(), content, messageCount };
    this.state.dailyLog.push(entry);
    if (this.state.dailyLog.length > this.config.maxDailyItems) {
      this.state.dailyLog = this.state.dailyLog.slice(-this.config.maxDailyItems);
    }
  }

  async searchMemory(query: string, limit: number = 5): Promise<MemoryRecord[]> {
    const terms = query
      .toLowerCase()
      .split(' ')
      .filter((t) => t.length > 2);
    if (terms.length === 0) return [];

    const all = [
      ...this.state.coreLearnings,
      ...this.state.corrections,
      ...this.state.preferences,
      ...this.state.patterns,
    ];

    const results = all.filter((r) => terms.some((t) => r.content.toLowerCase().includes(t)));
    results.sort((a, b) => b.confidence - a.confidence || b.created - a.created);
    return results.slice(0, limit);
  }

  async getInbox(): Promise<MemoryRecord[]> {
    return readInbox(this.storePath);
  }

  async addToInbox(record: MemoryRecord): Promise<void> {
    return appendInbox(this.storePath, record);
  }

  async getMemoryForInjection(): Promise<string> {
    const all = [
      ...this.state.coreLearnings,
      ...this.state.corrections,
      ...this.state.preferences,
      ...this.state.patterns,
    ];

    const formatted = all.map((r) => `[${r.kind.toUpperCase()}] ${r.content}`);
    let result = formatted.join('\n');
    if (result.length > this.config.injectionMaxChars) {
      result = result.slice(0, this.config.injectionMaxChars);
    }
    return result || 'No memories stored yet.';
  }

  private hasDuplicate(record: MemoryRecord): boolean {
    const all = [
      ...this.state.coreLearnings,
      ...this.state.corrections,
      ...this.state.preferences,
      ...this.state.patterns,
    ];
    return all.some(
      (existing) =>
        existing.content === record.content ||
        this.computeJaccard(existing.content, record.content) >= 0.7,
    );
  }

  private computeJaccard(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    let intersection = 0;
    for (const w of setA) if (setB.has(w)) intersection++;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  // --- Stats ---

  getStats(): MemoryStoreStats {
    return {
      coreLearnings: this.state.coreLearnings.length,
      corrections: this.state.corrections.length,
      preferences: this.state.preferences.length,
      patterns: this.state.patterns.length,
      dailyLogEntries: this.state.dailyLog.length,
      inboxCount: 0,
    };
  }

  // Getters
  get stateValue(): MemoryState {
    return this.state;
  }
  get configValue(): MemoryConfig {
    return this.config;
  }
}
