// ─── Status Types ───────────────────────────────────────────────────────────

type RepositoryPolicyStatus = 'ok' | 'warning' | 'error';
export type GateStatus = RepositoryPolicyStatus | 'skipped';

// ─── Gate Result ────────────────────────────────────────────────────────────

export type GateResult = {
  kind: 'repository-policy' | 'quality';
  id: string;
  label: string;
  command: string;
  required: boolean;
  status: GateStatus;
  elapsedMs: number;
  summary: string;
  output: string;
  signalLines: string[];
  hints: string[];
};

// ─── Gate Report ────────────────────────────────────────────────────────────

export type GateReport = {
  kind: 'repository-policy' | 'quality';
  label: string;
  passed: boolean;
  skipped: boolean;
  results: GateResult[];
};

// ─── Gate Hooks ─────────────────────────────────────────────────────────────

export type GateRunHooks = {
  onGroupStart?: (group: {
    kind: 'repository-policy' | 'quality';
    label: string;
    gates: readonly { id: string; label: string; required: boolean }[];
  }) => void;
  onGateStart?: (gate: {
    kind: 'repository-policy' | 'quality';
    id: string;
    label: string;
    required: boolean;
  }) => void;
  onGateFinish?: (result: GateResult) => void;
  onGroupFinish?: (report: GateReport) => void;
};

// ─── Policy Spec ────────────────────────────────────────────────────────────

export type RepositoryPolicySpec = {
  id: string;
  label: string;
  timeoutMs: number;
  required: boolean;
};

// ─── Validation Step ────────────────────────────────────────────────────────

export type ValidationStep = {
  id: string;
  label: string;
  command: string;
  required: boolean;
  status: 'ok' | 'warning' | 'error';
  durationMs: number;
  summary: string;
  exitCode: number;
};

// ─── Re-export ──────────────────────────────────────────────────────────────

export type { RepoValidationStepResult } from '@cfxdevkit/cdk-repo-check';
