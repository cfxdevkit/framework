export { runAll } from '../workers/agents/all.js';
export { runAgentCheck } from '../workers/agents/check.js';
export { runReviewAgent } from '../workers/agents/review.js';
export { runAgentSmoke } from '../workers/agents/smoke.js';
export type { RepoActionExecutionResult } from '../workers/commands.js';
export {
  configure,
  executeAction,
  getActionDefinitions,
  listActions,
  listModels,
  runAction,
  validateModels,
} from '../workers/commands.js';
export type {
  CommitWorkflowOptions,
  CommitWorkflowResult,
  PrecommitWorkflowResult,
} from '../workers/commit/index.js';
export {
  parseCommitFlags,
  runCommit,
  runCommitWorkflow,
  runPrecommit,
  runPrecommitWorkflow,
} from '../workers/commit/index.js';
export type { ActionConfig } from '../workers/completion/resolve-action.js';
export { resolveActionConfig } from '../workers/completion/resolve-action.js';
export {
  runDocsApi,
  runDocsApiProbe,
  runDocsPackagePages,
  runDocsReadme,
  runStructureUpkeep,
  runWikiGenerate,
} from '../workers/docs/index.js';
export type {
  RepoActionDefinition,
  RepoActionMode,
  RepoActionName,
} from '../workers/shared/repo-actions.js';
export {
  getRepoAction,
  listRepoActions,
  repoActions,
} from '../workers/shared/repo-actions.js';
export { runTestUpkeep } from '../workers/tests/index.js';

// TUI confirm callback setter — allows the PI tool to inject a TUI-native
// confirm dialog into the commit workflow's confirmPrompt(), avoiding the
// two-pass approval dance.

export { setTuiConfirm } from '../workers/commit/message.js';
