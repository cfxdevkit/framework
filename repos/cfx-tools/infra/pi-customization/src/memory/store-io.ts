import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MemoryConfig, MemoryRecord, MemoryState } from './types.js';
import { INBOX_FILE, INDEX_FILE, MEMORY_STORE_DIR } from './types.js';

export {
  CORE_FILE,
  CORRECTIONS_FILE,
  INBOX_FILE,
  INDEX_FILE,
  PATTERNS_FILE,
  PREFERENCES_FILE,
} from './types.js';

export function getStorePath(projectRoot?: string): string {
  return projectRoot ? join(projectRoot, '.pi', 'agent', 'memory') : MEMORY_STORE_DIR;
}

export function getIndexFilePath(storePath: string): string {
  return join(storePath, INDEX_FILE);
}

// --- JSONL I/O ---

export async function loadJSONL(
  storePath: string,
  filename: string,
  push: (record: MemoryRecord) => void,
): Promise<void> {
  const filePath = join(storePath, filename);
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      try {
        push(JSON.parse(line));
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // File doesn't exist yet
  }
}

export async function saveJSONL(
  storePath: string,
  filename: string,
  records: MemoryRecord[],
): Promise<void> {
  await mkdir(storePath, { recursive: true });
  const filePath = join(storePath, filename);
  const content = `${records.map((record) => JSON.stringify(record)).join('\n')}\n`;
  await writeFile(filePath, content, 'utf-8');
}

export async function saveIndex(
  storePath: string,
  state: MemoryState,
  config: MemoryConfig,
): Promise<void> {
  await mkdir(storePath, { recursive: true });
  const index = {
    currentSessionId: state.currentSessionId,
    dailyLog: state.dailyLog.slice(-config.maxDailyItems),
  };
  const filePath = join(storePath, INDEX_FILE);
  await writeFile(filePath, JSON.stringify(index, null, 2), 'utf-8');
}

// --- Inbox I/O ---

export async function readInbox(storePath: string): Promise<MemoryRecord[]> {
  try {
    const content = await readFile(join(storePath, INBOX_FILE), 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());
    return lines.map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export async function appendInbox(storePath: string, record: MemoryRecord): Promise<void> {
  const filePath = join(storePath, INBOX_FILE);
  await mkdir(storePath, { recursive: true });
  await appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf-8');
}
