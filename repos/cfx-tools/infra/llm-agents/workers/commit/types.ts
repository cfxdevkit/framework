import type {
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from '../shared/execution-context.js';
import type { generateChangesetPlan } from './changeset.js';
import type { GateFailureAnalysis } from './failure-analysis.js';
import type { GateReport, runQualityGates, runRepositoryPolicyGates } from './gates/index.js';
import type { detectChangedScopes } from './scope.js';

export interface PrecommitWorkflowResult {
  readonly command: 'precommit';
  readonly status: 'passed' | 'forced' | 'blocked';
  readonly phase: 'repository-policy-gates' | 'quality-gates' | 'completed';
  readonly executionContext: ReturnType<typeof toExecutionContextRuntimePayload>;
  readonly scopes: Awaited<ReturnType<typeof detectChangedScopes>>;
  readonly repositoryPolicies: Awaited<ReturnType<typeof runRepositoryPolicyGates>>;
  readonly qualityGates: Awaited<ReturnType<typeof runQualityGates>>;
  readonly failureAnalysis: GateFailureAnalysis | null;
  readonly blockedBy?: 'repository-policy' | 'quality-gates';
}

export interface CommitWorkflowResult {
  readonly command: 'commit';
  readonly status: 'blocked' | 'approval-required' | 'aborted' | 'dry-run' | 'committed';
  readonly phase:
    | 'repository-policy-gates'
    | 'quality-gates'
    | 'preflight'
    | 'scope-detection'
    | 'release-intent'
    | 'message-generation'
    | 'approval'
    | 'post-checks'
    | 'completed';
  readonly executionContext: ReturnType<typeof toExecutionContextRuntimePayload>;
  readonly scopes: Awaited<ReturnType<typeof detectChangedScopes>>;
  readonly repositoryPolicies: Awaited<ReturnType<typeof runRepositoryPolicyGates>>;
  readonly qualityGates: Awaited<ReturnType<typeof runQualityGates>>;
  readonly changesetPlan?: Awaited<ReturnType<typeof generateChangesetPlan>>;
  readonly postGenerationQualityGates?: GateReport;
  readonly commitPreview?: {
    readonly subject: string;
    readonly body: string;
  };
  readonly approval: {
    readonly required: boolean;
    readonly approved: boolean;
    readonly declined: boolean;
  };
  readonly failureAnalysis: GateFailureAnalysis | null;
  readonly blockedBy?: 'repository-policy' | 'quality-gates' | 'post-checks';
  readonly generatedFiles?: readonly string[];
  readonly dryRun?: boolean;
  readonly sha?: string;
}

export interface CommitWorkflowOptions {
  readonly approvalMode?: 'defer' | 'prompt' | 'auto-approve';
  readonly modelPolicies?: {
    readonly messageGenerationModel?: string | null;
    readonly failureAnalysisModel?: string | null;
  };
  readonly stdout?: NodeJS.WriteStream;
  readonly stderr?: NodeJS.WriteStream;
  // Per-call TUI confirm callback. When set, confirmPrompt() uses this
  // instead of readline, enabling single-pass approval in TUI mode.
  readonly tuiConfirm?: ((question: string) => Promise<boolean>) | null;
  // Progress callback invoked at major workflow steps.
  readonly onProgress?: (phase: string, detail?: string) => void;
  // Abort callback invoked when the workflow is aborted.
  readonly onAbort?: () => void;
  // Abort signal for cancellation support. When aborted, the workflow will
  // stop at the next major step and return null.
  readonly signal?: AbortSignal;
}

export type ExecutionContextLike = Awaited<ReturnType<typeof resolveExecutionContext>>;
