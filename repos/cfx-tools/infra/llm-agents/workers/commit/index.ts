import { runCommitWorkflow } from './commit.js';
import { parseCommitFlags } from './flags.js';
import { runPrecommitWorkflow } from './precommit.js';
import type { CommitWorkflowResult, PrecommitWorkflowResult } from './types.js';

export { changedFilesList, detectChangedScopes, resolveScope } from './scope.js';
export type {
  CommitWorkflowOptions,
  CommitWorkflowResult,
  PrecommitWorkflowResult,
} from './types.js';
export { parseCommitFlags, runCommitWorkflow, runPrecommitWorkflow };

export async function runPrecommit(args): Promise<PrecommitWorkflowResult> {
  const result = await runPrecommitWorkflow(args);
  if (result.status === 'blocked') {
    process.exitCode = 1;
  }
  return result;
}

export async function runCommit(args): Promise<CommitWorkflowResult | null> {
  const result = await runCommitWorkflow(args, { approvalMode: 'prompt' });
  if (result?.status === 'blocked' || result?.status === 'aborted') {
    process.exitCode = 1;
  }
  return result;
}
