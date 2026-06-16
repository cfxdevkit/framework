export type DocsCommandName =
  | 'sync:wiki'
  | 'sync:all'
  | 'sync:packages'
  | 'sync:architecture'
  | 'sync:coverage'
  | 'sync:releases'
  | 'sync:guides'
  | 'sync:api-reference'
  | 'validate:content'
  | 'validate:wiki'
  | 'validate:wiki-fix';

export async function runCommand(command: DocsCommandName, _extraArgs: readonly string[] = []) {
  if (command === 'sync:all') {
    await runCommand('sync:wiki');
    await runCommand('sync:packages');
    await runCommand('sync:architecture');
    await runCommand('sync:coverage');
    await runCommand('sync:releases');
    await runCommand('sync:guides');
    await runCommand('sync:api-reference');
    return;
  }

  if (command === 'sync:packages') {
    const { syncPackages } = await import('./package/pages.js');
    await syncPackages();
    return;
  }

  if (command === 'validate:content') {
    const { validateGeneratedContent } = await import('./validate-content.js');
    const result = await validateGeneratedContent();
    if (result.errors.length > 0) process.exitCode = 1;
    return;
  }

  if (command === 'sync:wiki') {
    const { syncWiki } = await import('./wiki/sync.js');
    await syncWiki();
    return;
  }

  if (command === 'sync:architecture') {
    const { syncArchitecturePage } = await import('./sync/architecture.js');
    await syncArchitecturePage();
    return;
  }

  if (command === 'sync:coverage') {
    const { syncCoveragePage } = await import('./sync/coverage.js');
    await syncCoveragePage();
    return;
  }

  if (command === 'sync:releases') {
    const { syncReleases } = await import('./sync/releases.js');
    await syncReleases();
    return;
  }

  if (command === 'sync:guides') {
    const { syncGuides } = await import('./sync/guides.js');
    await syncGuides();
    return;
  }

  if (command === 'sync:api-reference') {
    const { syncApiReference } = await import('./sync/api-reference.js');
    await syncApiReference();
    return;
  }

  if (command === 'validate:wiki') {
    const { validateWikiMermaid } = await import('./wiki/validate.js');
    await validateWikiMermaid();
    return;
  }

  if (command === 'validate:wiki-fix') {
    const { validateWikiMermaid } = await import('./wiki/validate.js');
    await validateWikiMermaid({ fix: true });
    return;
  }
}
