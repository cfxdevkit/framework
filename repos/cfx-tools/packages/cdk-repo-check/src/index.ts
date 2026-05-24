// ─── Structured execution layer ──────────────────────────────────────────────

export type {
  HotspotOptions,
  HotspotRecord,
  HotspotReport,
} from '@cfxdevkit/arch-check';
// ─── arch-check re-exports (explicit — only symbols used by external consumers) ──
// Check algorithms
// Doc generation utilities (used by llm-agents doc workers)
// Workspace contract utilities
export {
  computeReadmeSkeletonHash,
  computeStructureTreeHash,
  detectLegacyStructureAlias,
  embedReadmeSkeletonHash,
  embedStructureMetadata,
  findKebabGroupRecords,
  getDocsRootDocumentRequirements,
  getProjectRootDocumentRequirements,
  getPublicPackageDocumentRequirements,
  getRepoRootDocumentRequirements,
  getWorkspaceRootDocumentRequirements,
  isDocumentationUpkeepPath,
  readEmbeddedReadmeSkeletonHash,
  readEmbeddedStructureHash,
  renderReadmeSkeleton,
  renderStructureSkeleton,
  rootToolingScriptRequirements,
  runArchCheck,
  runCiCheck,
  runCorpusCheck,
  runDocsCheck,
  runEvalCheck,
  runFullReport,
  runHotspotsCheck,
  runKebabGroupsCheck,
  runSecretsCheck,
  runServeCheck,
  runUnitConfigsCheck,
  stripReadmeSkeletonHash,
  stripStructureMetadata,
  structureIdentityTokens,
  structureNeedsEnrichment,
  validateDocumentContent,
  validateScriptRequirements,
  walkStructureTree,
} from '@cfxdevkit/arch-check';
export type {
  GitNexusRepositorySummary,
  GitNexusSnapshot,
  RepoCheckHotspotsResult,
  RepoCheckKebabGroupsResult,
  RepoCheckTarget,
  RepoCheckUnitConfigsResult,
  RepoCommandResult,
  RepoCommandTarget,
  RepoResultRenderer,
  RepoStructuredResult,
  RepoValidationStepId,
  RepoValidationStepResult,
} from './repo-check.js';
export { defaultRenderer, runRepoCheck, runRepoCommand } from './repo-check.js';
