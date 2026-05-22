import { runCommitWorkflow } from './commit.ts';
import { parseCommitFlags } from './flags.ts';
import { runPrecommitWorkflow } from './precommit.ts';
import type { CommitWorkflowResult, PrecommitWorkflowResult } from './types.ts';
export { changedFilesList, detectChangedScopes, resolveScope } from './scope.ts';
export type { CommitWorkflowOptions, CommitWorkflowResult, PrecommitWorkflowResult } from './types.ts';
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
