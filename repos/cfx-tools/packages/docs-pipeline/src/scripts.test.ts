import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  syncPackages: vi.fn(),
  syncWiki: vi.fn(),
  syncArchitecturePage: vi.fn(),
  syncCoveragePage: vi.fn(),
  validateGeneratedContent: vi.fn(),
  validateWikiMermaid: vi.fn(),
  updateWiki: vi.fn(),
}));

vi.mock('./package/pages.js', () => ({ syncPackages: mocks.syncPackages }));
vi.mock('./wiki/sync.js', () => ({ syncWiki: mocks.syncWiki }));
vi.mock('./sync/architecture.js', () => ({ syncArchitecturePage: mocks.syncArchitecturePage }));
vi.mock('./sync/coverage.js', () => ({ syncCoveragePage: mocks.syncCoveragePage }));
vi.mock('./validate-content.js', () => ({
  validateGeneratedContent: mocks.validateGeneratedContent,
}));
vi.mock('./wiki/validate.js', () => ({ validateWikiMermaid: mocks.validateWikiMermaid }));
vi.mock('./wiki/update.js', () => ({ updateWiki: mocks.updateWiki }));

import { runCommand } from './scripts.js';

describe('runCommand', () => {
  beforeEach(() => {
    process.exitCode = undefined;
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.validateGeneratedContent.mockResolvedValue({ checkedFiles: 1, errors: [] });
  });

  it('runs sync:all in the expected order', async () => {
    const calls: string[] = [];
    mocks.syncPackages.mockImplementation(async () => {
      calls.push('packages');
      return { packageCount: 1, created: 0, updated: 0 };
    });
    mocks.syncWiki.mockImplementation(async () => {
      calls.push('wiki');
      return 1;
    });
    mocks.syncArchitecturePage.mockImplementation(async () => {
      calls.push('architecture');
    });
    mocks.syncCoveragePage.mockImplementation(async () => {
      calls.push('coverage');
    });

    await runCommand('sync:all');

    expect(calls).toEqual(['wiki', 'packages', 'architecture', 'coverage']);
  });

  it('routes validate:wiki-fix through the wiki validator with fix enabled', async () => {
    await runCommand('validate:wiki-fix');

    expect(mocks.validateWikiMermaid).toHaveBeenCalledWith({ fix: true });
  });

  it('sets process.exitCode when content validation finds errors', async () => {
    mocks.validateGeneratedContent.mockResolvedValue({
      checkedFiles: 1,
      errors: [{ rel: 'content/example.mdx', message: 'bad mdx' }],
    });

    await runCommand('validate:content');

    expect(process.exitCode).toBe(1);
  });
});
