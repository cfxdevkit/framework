import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { AuditEntry, AuditLogger } from './index.js';

export interface AppendOnlyAuditLoggerOptions {
  path: string;
  onError?: (error: unknown) => void;
}

interface StoredAuditEntry extends AuditEntry {
  sequence: number;
  previousHash: string;
  entryHash: string;
}

const EMPTY_HASH = '0'.repeat(64);

export function createAppendOnlyAuditLogger(opts: AppendOnlyAuditLoggerOptions): AuditLogger {
  let pending = Promise.resolve({ sequence: 0, hash: EMPTY_HASH });

  return {
    record(entry: AuditEntry): void {
      pending = pending
        .then((state) => appendAuditEntry(opts.path, entry, state))
        .catch((error: unknown) => {
          opts.onError?.(error);
          return { sequence: 0, hash: EMPTY_HASH };
        });
    },
  };
}

async function appendAuditEntry(
  path: string,
  entry: AuditEntry,
  state: { sequence: number; hash: string },
): Promise<{ sequence: number; hash: string }> {
  await fs.mkdir(dirname(path), { recursive: true });

  const current = state.sequence === 0 ? await readLastAuditState(path) : state;
  const sequence = current.sequence + 1;
  const unsigned = {
    ...entry,
    sequence,
    previousHash: current.hash,
  };
  const entryHash = hashJson(unsigned);
  const stored: StoredAuditEntry = { ...unsigned, entryHash };

  const handle = await fs.open(path, 'a', 0o600);
  try {
    await handle.appendFile(`${JSON.stringify(stored)}\n`, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }

  return { sequence, hash: entryHash };
}

async function readLastAuditState(path: string): Promise<{ sequence: number; hash: string }> {
  let content: string;
  try {
    content = await fs.readFile(path, 'utf8');
  } catch (error) {
    if (isNotFound(error)) return { sequence: 0, hash: EMPTY_HASH };
    throw error;
  }

  const lastLine = content.trimEnd().split('\n').filter(Boolean).at(-1);
  if (!lastLine) return { sequence: 0, hash: EMPTY_HASH };

  const entry = JSON.parse(lastLine) as Partial<StoredAuditEntry>;
  if (typeof entry.sequence !== 'number' || typeof entry.entryHash !== 'string') {
    throw new Error(`invalid audit log tail in ${path}`);
  }
  return { sequence: entry.sequence, hash: entry.entryHash };
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
