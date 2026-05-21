import { beforeEach, describe, expect, it, vi } from 'vitest';

const runCommandMock = vi.hoisted(() => vi.fn());

vi.mock('./scripts.js', () => ({ runCommand: runCommandMock }));

import { runCli } from './run.js';

describe('runCli', () => {
  beforeEach(() => {
    runCommandMock.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('maps sync subcommands to docs commands', async () => {
    await runCli(['sync', 'wiki']);

    expect(runCommandMock).toHaveBeenCalledWith('sync:wiki');
  });

  it('maps validation subcommands to docs commands', async () => {
    await runCli(['validate', 'wiki-fix']);

    expect(runCommandMock).toHaveBeenCalledWith('validate:wiki-fix');
  });

  it('passes extra args through to wiki regeneration', async () => {
    await runCli(['wiki', '--review']);

    expect(runCommandMock).toHaveBeenCalledWith('update-wiki', ['--review']);
  });
});
