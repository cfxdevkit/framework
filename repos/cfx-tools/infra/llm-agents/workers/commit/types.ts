import type {
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from '../shared/execution-context.ts';
import type { GateFailureAnalysis } from './failure-analysis.ts';
import type { generateChangesetPlan } from './changeset.ts';
import type { GateReport, runQualityGates, runRepositoryPolicyGates } from './gates.ts';
import type { detectChangedScopes } from './scope.ts';

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
}

export type ExecutionContextLike = Awaited<ReturnType<typeof resolveExecutionContext>>;