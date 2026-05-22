import { spawn } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './run.js';

const piAgent = vi.hoisted(() => ({
  runPiInteractive: vi.fn(async () => undefined),
  runPiPrint: vi.fn(async () => undefined),
  runPiRpc: vi.fn(async () => undefined),
}));

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('../../pi-agent/src/index.js', () => piAgent);

const spawnMock = vi.mocked(spawn);

describe('runCli', () => {
  beforeEach(() => {
    spawnMock.mockReset();
    piAgent.runPiInteractive.mockClear();
    piAgent.runPiPrint.mockClear();
    piAgent.runPiRpc.mockClear();
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

  it('routes interactive mode through the pi-agent compatibility runtime', async () => {
    await runCli(['interactive', 'review']);

    expect(piAgent.runPiInteractive).toHaveBeenCalledWith({ promptArgs: ['review'] });
    expect(spawnMock).not.toHaveBeenCalled();
  });
});
