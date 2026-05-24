import { runStructuredRepoCommand } from './repo-check/commands.js';
import { runStructuredHotspotsCheck } from './repo-check/hotspots.js';
import { runStructuredKebabGroupsCheck } from './repo-check/kebab-groups.js';
import type { RepoResultRenderer } from './repo-check/renderer.js';
import { defaultRenderer } from './repo-check/renderer.js';
import type {
  GitNexusRepositorySummary,
  GitNexusSnapshot,
  RepoCheckHotspotsResult,
  RepoCheckKebabGroupsResult,
  RepoCheckTarget,
  RepoCheckUnitConfigsResult,
  RepoCheckValidationResult,
  RepoCommandResult,
  RepoCommandTarget,
  RepoStructuredResult,
  RepoValidationStepId,
  RepoValidationStepResult,
} from './repo-check/types.js';
import { runStructuredUnitConfigsCheck } from './repo-check/unit-configs.js';
import { runStructuredValidationCheck } from './repo-check/validation.js';

export type {
  GitNexusRepositorySummary,
  GitNexusSnapshot,
  RepoCheckHotspotsResult,
  RepoCheckKebabGroupsResult,
  RepoCheckTarget,
  RepoCheckUnitConfigsResult,
  RepoCheckValidationResult,
  RepoCommandResult,
  RepoCommandTarget,
  RepoResultRenderer,
  RepoStructuredResult,
  RepoValidationStepId,
  RepoValidationStepResult,
};

export { defaultRenderer };

export async function runRepoCheck(
  target: RepoCheckTarget,
  args: readonly string[],
): Promise<
  | RepoCheckValidationResult
  | RepoCheckHotspotsResult
  | RepoCheckKebabGroupsResult
  | RepoCheckUnitConfigsResult
> {
  if (target === 'validation') {
    return await runStructuredValidationCheck(args);
  }

  if (target === 'hotspots') {
    return await runStructuredHotspotsCheck(args);
  }

  if (target === 'kebab-groups') {
    return await runStructuredKebabGroupsCheck(args);
  }

  if (target === 'unit-configs') {
    return await runStructuredUnitConfigsCheck(args);
  }

  throw new Error(`Unsupported structured repo check target: ${target}`);
}

export async function runRepoCommand(
  target: RepoCommandTarget,
  args: readonly string[],
): Promise<RepoCommandResult> {
  return await runStructuredRepoCommand(target, args);
}
