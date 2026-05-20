import { spawn } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './run.js';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

const spawnMock = vi.mocked(spawn);

describe('runCli', () => {
  beforeEach(() => {
    spawnMock.mockReset();
    spawnMock.mockReturnValue({
      on(event: string, callback: (code?: number) => void) {
        if (event === 'exit') callback(0);
        return this;
      },
    } as never);
    process.exitCode = undefined;
  });

  it('forwards root script separator and command flags to the worker', async () => {
    await runCli(['--', 'commit', '--', '--dry-run']);

    expect(spawnMock).toHaveBeenCalledWith(
      'pnpm',
      expect.arrayContaining([
        'exec',
        'tsx',
        expect.stringContaining('workers/lemonade/cli.ts'),
        'commit',
        '--',
        '--dry-run',
      ]),
      expect.objectContaining({ cwd: expect.any(String) }),
    );
    expect(process.exitCode).toBe(0);
  });

  it('forwards direct command flags to the worker', async () => {
    await runCli(['commit', '--dry-run']);

    expect(spawnMock).toHaveBeenCalledWith(
      'pnpm',
      expect.arrayContaining([
        'exec',
        'tsx',
        expect.stringContaining('workers/lemonade/cli.ts'),
        'commit',
        '--dry-run',
      ]),
      expect.any(Object),
    );
    expect(process.exitCode).toBe(0);
  });
});
