import { afterEach, describe, expect, it, vi } from 'vitest';
import { docsToolingNamespace } from '@cfxdevkit/docs-pipeline';
import { llmToolingNamespace } from '@cfxdevkit/llm-tools';
import { rootDocsToolingNamespace } from './docs-namespace.js';

describe('rootDocsToolingNamespace', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('prints enrichment patterns in docs help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['help']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enrichment patterns:'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('enrich [all|api|readme|packages|structure|content] [args]'),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('probe api [args]'));
  });

  it('runs enrich all as deterministic sync plus ordered docs enrichments', async () => {
    const docsRunSpy = vi.spyOn(docsToolingNamespace, 'run').mockResolvedValue(undefined);
    const llmRunSpy = vi.spyOn(llmToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['enrich', 'all', '--quick']);

    expect(docsRunSpy).toHaveBeenCalledWith(['sync', 'all']);
    expect(llmRunSpy).toHaveBeenNthCalledWith(1, ['docs-api', '--quick']);
    expect(llmRunSpy).toHaveBeenNthCalledWith(2, ['readme-upkeep', '--quick']);
    expect(llmRunSpy).toHaveBeenNthCalledWith(3, ['structure-upkeep', '--quick']);
    expect(llmRunSpy).toHaveBeenNthCalledWith(4, ['package-pages', '--quick']);
    expect(llmRunSpy).toHaveBeenNthCalledWith(5, ['docs-upkeep', '--quick']);
  });

  it('routes docs enrich api through llm-tools', async () => {
    const runSpy = vi.spyOn(llmToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['enrich', 'api', '--quick']);

    expect(runSpy).toHaveBeenCalledWith(['docs-api', '--quick']);
  });

  it('routes docs probe api through llm-tools', async () => {
    const runSpy = vi.spyOn(llmToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['probe', 'api', '--package', '@cfxdevkit/executor']);

    expect(runSpy).toHaveBeenCalledWith(['docs-api-probe', '--package', '@cfxdevkit/executor']);
  });

  it('shows help instead of running enrichment when help is requested', async () => {
    const docsRunSpy = vi.spyOn(docsToolingNamespace, 'run').mockResolvedValue(undefined);
    const runSpy = vi.spyOn(llmToolingNamespace, 'run').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['enrich', 'api', '--help']);

    expect(docsRunSpy).not.toHaveBeenCalled();
    expect(runSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enrichment patterns:'));
  });

  it('shows help instead of running enrich all when help is requested', async () => {
    const docsRunSpy = vi.spyOn(docsToolingNamespace, 'run').mockResolvedValue(undefined);
    const runSpy = vi.spyOn(llmToolingNamespace, 'run').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['enrich', 'all', '--help']);

    expect(docsRunSpy).not.toHaveBeenCalled();
    expect(runSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enrichment patterns:'));
  });

  it('routes docs review through llm docs-pipeline review', async () => {
    const runSpy = vi.spyOn(llmToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['review']);

    expect(runSpy).toHaveBeenCalledWith(['docs-pipeline']);
  });

  it('shows help instead of running review when help is requested', async () => {
    const runSpy = vi.spyOn(llmToolingNamespace, 'run').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['review', '--help']);

    expect(runSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enrichment patterns:'));
  });
});
