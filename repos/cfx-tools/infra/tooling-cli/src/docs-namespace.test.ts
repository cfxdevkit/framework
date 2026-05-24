import { docsToolingNamespace } from '@cfxdevkit/docs-pipeline';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { agentToolingNamespace } from './agent-namespace.js';
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
    const agentRunSpy = vi.spyOn(agentToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['enrich', 'all', '--quick']);

    expect(docsRunSpy).toHaveBeenCalledWith(['sync', 'all']);
    expect(agentRunSpy).toHaveBeenNthCalledWith(1, ['deterministic', 'docs-api', '--quick']);
    expect(agentRunSpy).toHaveBeenNthCalledWith(2, ['deterministic', 'readme-upkeep', '--quick']);
    expect(agentRunSpy).toHaveBeenNthCalledWith(3, [
      'deterministic',
      'structure-upkeep',
      '--quick',
    ]);
    expect(agentRunSpy).toHaveBeenNthCalledWith(4, ['deterministic', 'package-pages', '--quick']);
    expect(agentRunSpy).toHaveBeenNthCalledWith(5, ['deterministic', 'docs-upkeep', '--quick']);
  });

  it('routes docs enrich api through agent deterministic', async () => {
    const agentRunSpy = vi.spyOn(agentToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['enrich', 'api', '--quick']);

    expect(agentRunSpy).toHaveBeenCalledWith(['deterministic', 'docs-api', '--quick']);
  });

  it('routes docs probe api through agent deterministic', async () => {
    const agentRunSpy = vi.spyOn(agentToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['probe', 'api', '--package', '@cfxdevkit/executor']);

    expect(agentRunSpy).toHaveBeenCalledWith([
      'deterministic',
      'docs-api-probe',
      '--package',
      '@cfxdevkit/executor',
    ]);
  });

  it('shows help instead of running enrichment when help is requested', async () => {
    const docsRunSpy = vi.spyOn(docsToolingNamespace, 'run').mockResolvedValue(undefined);
    const agentRunSpy = vi.spyOn(agentToolingNamespace, 'run').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['enrich', 'api', '--help']);

    expect(docsRunSpy).not.toHaveBeenCalled();
    expect(agentRunSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enrichment patterns:'));
  });

  it('shows help instead of running enrich all when help is requested', async () => {
    const docsRunSpy = vi.spyOn(docsToolingNamespace, 'run').mockResolvedValue(undefined);
    const agentRunSpy = vi.spyOn(agentToolingNamespace, 'run').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['enrich', 'all', '--help']);

    expect(docsRunSpy).not.toHaveBeenCalled();
    expect(agentRunSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enrichment patterns:'));
  });

  it('routes docs review through agent exploratory docs-pipeline', async () => {
    const agentRunSpy = vi.spyOn(agentToolingNamespace, 'run').mockResolvedValue(undefined);

    await rootDocsToolingNamespace.run(['review']);

    expect(agentRunSpy).toHaveBeenCalledWith(['exploratory', 'docs-pipeline']);
  });

  it('shows help instead of running review when help is requested', async () => {
    const agentRunSpy = vi.spyOn(agentToolingNamespace, 'run').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await rootDocsToolingNamespace.run(['review', '--help']);

    expect(agentRunSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enrichment patterns:'));
  });
});
