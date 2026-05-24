/**
 * Thin re-export of @cfxdevkit/cdk-repo-check with a compatibility wrapper for
 * renderRepoResult. Static imports replace the previous dynamic loadRepoCheckModule
 * pattern — cdk-repo-check:build is a declared build dependency so the dist is
 * always available before tooling-cli runs.
 */
import {
  runRepoCheck as _runRepoCheck,
  runRepoCommand as _runRepoCommand,
  defaultRenderer,
} from '@cfxdevkit/cdk-repo-check';

// Re-export all types consumers need
export type {
  RepoCheckHotspotsResult,
  RepoCheckKebabGroupsResult,
  RepoCheckTarget,
  RepoCheckUnitConfigsResult,
  RepoCommandResult,
  RepoCommandTarget,
  RepoResultRenderer,
  RepoStructuredResult,
} from '@cfxdevkit/cdk-repo-check';

// Re-export execution functions directly
export { _runRepoCheck as runRepoCheck, _runRepoCommand as runRepoCommand, defaultRenderer };

/** Render a repo result in the requested format. Synchronous wrapper over defaultRenderer. */
export async function renderRepoResult(
  result: import('@cfxdevkit/cdk-repo-check').RepoStructuredResult,
  format: 'text' | 'json' | 'compact' = 'text',
): Promise<string> {
  if (format === 'json') return defaultRenderer.renderJson(result);
  if (format === 'compact') return defaultRenderer.renderCompact(result);
  return defaultRenderer.renderText(result);
}
