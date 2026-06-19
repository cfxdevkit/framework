import { docsToolingNamespace } from '@cfxdevkit/docs-pipeline';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rootDocsToolingNamespace } from './namespace.js';

describe('rootDocsToolingNamespace', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints deterministic commands in docs help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['help']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Deterministic commands:'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generation (deterministic, idempotent):'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('generate [all|api|readme|structure|packages]'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('validate [content|packages|wiki|all] [args]'),
    );
  });

  it('delegates validate commands to docs-pipeline', async () => {
    const docsRunSpy = vi.spyOn(docsToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['validate', 'wiki']);

    expect(docsRunSpy).toHaveBeenCalledWith(['validate', 'wiki']);
  });

  it('delegates unknown commands to docs-pipeline', async () => {
    const docsRunSpy = vi.spyOn(docsToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['sync', 'packages']);

    expect(docsRunSpy).toHaveBeenCalledWith(['sync', 'packages']);
  });
});
