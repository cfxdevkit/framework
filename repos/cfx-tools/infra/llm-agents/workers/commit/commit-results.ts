import type { CommitWorkflowResult } from './types.ts';

interface Ctx {
  executionContext: CommitWorkflowResult['executionContext'];
  scopes: CommitWorkflowResult['scopes'];
  qualityGates: CommitWorkflowResult['qualityGates'];
  repositoryPolicies: CommitWorkflowResult['repositoryPolicies'];
  failureAnalysis: CommitWorkflowResult['failureAnalysis'];
  changesetPlan?: CommitWorkflowResult['changesetPlan'];
  subject: string;
  body: string;
}

function ctx(c: Ctx, extra: Record<string, unknown> = {}): CommitWorkflowResult {
  return {
    command: 'commit',
    ...extra,
    executionContext: c.executionContext,
    scopes: c.scopes,
    qualityGates: c.qualityGates,
    repositoryPolicies: c.repositoryPolicies,
    failureAnalysis: c.failureAnalysis,
    changesetPlan: c.changesetPlan,
    commitPreview: c.changesetPlan ? { subject: c.subject, body: c.body } : undefined,
  } as CommitWorkflowResult;
}

export function buildQualityBlocked(c: Ctx): CommitWorkflowResult {
  return ctx(c, {
    status: 'blocked',
    phase: 'quality-gates',
    repositoryPolicies: {
      kind: 'repository-policy',
      label: 'Repository policy follow-up gates',
      passed: false,
      skipped: true,
      results: [],
    },
    approval: { required: false, approved: false, declined: false },
    blockedBy: 'quality-gates',
  });
}

export function buildPolicyBlocked(c: Ctx): CommitWorkflowResult {
  return ctx(c, {
    status: 'blocked',
    phase: 'repository-policy-gates',
    approval: { required: false, approved: false, declined: false },
    blockedBy: 'repository-policy',
  });
}

export function buildDryRun(c: Ctx): CommitWorkflowResult {
  return ctx(c, {
    status: 'dry-run',
    phase: 'approval',
    approval: { required: false, approved: false, declined: false },
    dryRun: true,
  });
}

export function buildApprovalRequired(c: Ctx): CommitWorkflowResult {
  return ctx(c, {
    status: 'approval-required',
    phase: 'approval',
    approval: { required: true, approved: false, declined: false },
  });
}

export function buildAborted(c: Ctx): CommitWorkflowResult {
  return ctx(c, {
    status: 'aborted',
    phase: 'approval',
    approval: { required: true, approved: false, declined: true },
  });
}

export function buildPostChecksBlocked(
  c: Ctx,
  postCheckReport: CommitWorkflowResult['postGenerationQualityGates'],
  generatedFiles: string[],
): CommitWorkflowResult {
  return ctx(c, {
    status: 'blocked',
    phase: 'post-checks',
    postGenerationQualityGates: postCheckReport,
    approval: { required: true, approved: true, declined: false },
    blockedBy: 'post-checks',
    generatedFiles,
  });
}

export function buildCommitted(
  c: Ctx,
  sha: string,
  generatedFiles: string[],
  yes: boolean,
): CommitWorkflowResult {
  return ctx(c, {
    status: 'committed',
    phase: 'completed',
    approval: { required: !yes, approved: true, declined: false },
    generatedFiles,
    sha,
  });
}
