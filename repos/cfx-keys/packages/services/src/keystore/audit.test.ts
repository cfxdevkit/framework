import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createAppendOnlyAuditLogger } from './audit.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('createAppendOnlyAuditLogger', () => {
  it('writes sequenced hash-chained audit events', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cfx-audit-'));
    const path = join(dir, 'audit.log');

    try {
      const logger = createAppendOnlyAuditLogger({ path });
      logger.record({ at: 1, provider: 'file', action: 'list', ok: true });
      logger.record({ at: 2, provider: 'file', action: 'put', ok: true });
      await waitForLines(path, 2);

      const [first, second] = (await readFile(path, 'utf8'))
        .trim()
        .split('\n')
        .map(
          (line) =>
            JSON.parse(line) as { sequence: number; previousHash: string; entryHash: string },
        );

      expect(first?.sequence).toBe(1);
      expect(first?.previousHash).toBe('0'.repeat(64));
      expect(second?.sequence).toBe(2);
      expect(second?.previousHash).toBe(first?.entryHash);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

async function waitForLines(path: string, lineCount: number): Promise<void> {
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      const lines = (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean);
      if (lines.length >= lineCount) return;
    } catch {
      // keep polling below
    }
    await tick();
  }
  throw new Error(`timed out waiting for ${lineCount} audit log lines in ${path}`);
}
