import * as childProcessModule from 'node:child_process';
import * as fsModule from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scaffoldProject } from './scaffold.js';
import * as templatesModule from './templates.js';

vi.mock('node:fs');
vi.mock('node:child_process');

describe('scaffoldProject', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('creates project directory and writes template files', async () => {
    vi.spyOn(fsModule, 'existsSync').mockReturnValue(false);
    const mkdirSyncSpy = vi.spyOn(fsModule, 'mkdirSync');
    const writeFileSyncSpy = vi.spyOn(fsModule, 'writeFileSync');
    vi.spyOn(templatesModule, 'getTemplate').mockReturnValue({
      name: 'basic',
      description: 'Basic template',
      files: [{ path: 'README.md', content: 'Hello {{name}}' }],
    });
    vi.spyOn(templatesModule, 'getTemplateFiles').mockReturnValue([
      { path: 'README.md', content: 'Hello {{name}}' },
    ]);
    const spawnSyncSpy = vi.spyOn(childProcessModule, 'spawnSync').mockReturnValue({
      status: 0,
      signal: null,
      output: [],
      stdout: Buffer.from(''),
      stderr: Buffer.from(''),
    });

    await scaffoldProject('/workspaces/root/my-project', 'basic', { name: 'my-project' });

    expect(mkdirSyncSpy).toHaveBeenCalledWith('/workspaces/root/my-project', { recursive: true });
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.stringContaining('README.md'),
      'Hello my-project',
      'utf8',
    );
    expect(spawnSyncSpy).toHaveBeenCalledWith('npm', ['install'], {
      stdio: 'inherit',
      cwd: '/workspaces/root/my-project',
    });
  });

  it('skips npm install when skipInstall is true', async () => {
    vi.spyOn(fsModule, 'existsSync').mockReturnValue(false);
    vi.spyOn(fsModule, 'mkdirSync');
    vi.spyOn(fsModule, 'writeFileSync');
    vi.spyOn(templatesModule, 'getTemplate').mockReturnValue({
      name: 'basic',
      description: 'Basic template',
      files: [],
    });
    vi.spyOn(templatesModule, 'getTemplateFiles').mockReturnValue([]);
    const spawnSyncSpy = vi.spyOn(childProcessModule, 'spawnSync').mockReturnValue({
      status: 0,
      signal: null,
      output: [],
      stdout: Buffer.from(''),
      stderr: Buffer.from(''),
    });
    await scaffoldProject('/workspaces/root/my-project', 'basic', {
      name: 'my-project',
      skipInstall: true,
    });
    expect(spawnSyncSpy).not.toHaveBeenCalled();
  });

  it('throws error if template is undefined', async () => {
    vi.spyOn(templatesModule, 'getTemplate').mockReturnValue(undefined);
    await expect(
      scaffoldProject('/workspaces/root/my-project', 'unknown', { name: 'my-project' }),
    ).rejects.toThrow('Template not found: unknown');
  });
});
