import * as childProcessModule from 'node:child_process';
import * as fsModule from 'node:fs';
import * as pathModule from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scaffoldProject } from './scaffold.js';
import * as templatesModule from './templates.js';

vi.mock('node:fs');
vi.mock('node:path');
vi.mock('node:child_process');

describe('scaffoldProject', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
  it('creates project directory and template files', async () => {
    vi.spyOn(fsModule, 'existsSync').mockReturnValue(false);
    const mkdirSyncSpy = vi.spyOn(fsModule, 'mkdirSync');
    const writeFileSyncSpy = vi.spyOn(fsModule, 'writeFileSync');
    const resolveSpy = vi
      .spyOn(pathModule, 'resolve')
      .mockImplementation((...args) => `/workspaces/root/my-project/${args[args.length - 1]}`);
    vi.spyOn(templatesModule, 'getTemplate').mockReturnValue({
      name: 'basic',
      description: 'Basic template',
      files: ['package.json', 'README.md'],
    });
    const readFileSyncSpy = vi.spyOn(fsModule, 'readFileSync').mockReturnValue('Hello {{name}}');
    const spawnSyncSpy = vi.spyOn(childProcessModule, 'spawnSync').mockReturnValue({
      status: 0,
      signal: null,
      output: [],
      stdout: Buffer.from(''),
      stderr: Buffer.from(''),
    });
    await scaffoldProject('/workspaces/root/my-project', 'basic', { name: 'my-project' });
    expect(mkdirSyncSpy).toHaveBeenCalledWith('/workspaces/root/my-project', { recursive: true });
    expect(resolveSpy).toHaveBeenCalledWith('/workspaces/root/my-project', 'package.json');
    expect(resolveSpy).toHaveBeenCalledWith('/workspaces/root/my-project', 'README.md');
    expect(readFileSyncSpy).toHaveBeenCalledWith(
      '/workspaces/root/my-project/package.json',
      'utf8',
    );
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      '/workspaces/root/my-project/package.json',
      'Hello my-project',
    );
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      '/workspaces/root/my-project/README.md',
      'Hello my-project',
    );
    expect(spawnSyncSpy).toHaveBeenCalledWith('npm', ['install'], {
      stdio: 'inherit',
      cwd: '/workspaces/root/my-project',
    });
  });
  it('skips npm install when skipInstall is true', async () => {
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
