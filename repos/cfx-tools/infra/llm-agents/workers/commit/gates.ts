import type { RepoStructuredResult, RepoValidationStepResult } from '@cfxdevkit/cdk-repo-check';
import {
  defaultRenderer,
  type RepoCommandTarget,
  runRepoCheck,
  runRepoCommand,
} from '@cfxdevkit/cdk-repo-check';
import { QUALITY_GATE_SPECS } from '../shared/index.js';
import { collectOutput } from './gate/output';
import { createGateResult } from './gate/results';

type RepositoryPolicyStatus = 'ok' | 'warning' | 'error';
export type GateStatus = RepositoryPolicyStatus | 'skipped';

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

export type GateReport = {
  kind: 'repository-policy' | 'quality';
  label: string;
  passed: boolean;
  skipped: boolean;
  results: GateResult[];
};

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

type RepositoryPolicySpec = {
  id: string;
  label: string;
  timeoutMs: number;
  required: boolean;
};

const REPOSITORY_POLICY_SPECS: readonly RepositoryPolicySpec[] = [
  { id: 'hotspots', label: 'Code hotspots', timeoutMs: 120000, required: true },
  { id: 'kebab-groups', label: 'Kebab file groups', timeoutMs: 120000, required: false },
  { id: 'check', label: 'Repo check', timeoutMs: 300000, required: true },
];

export async function runRepositoryPolicyGates(hooks?: GateRunHooks): Promise<GateReport> {
  const results: GateResult[] = [];

  hooks?.onGroupStart?.({
    kind: 'repository-policy',
    label: 'Repository policy follow-up gates',
    gates: REPOSITORY_POLICY_SPECS.map((gate) => ({
      id: gate.id,
      label: gate.label,
      required: gate.required,
    })),
  });

  for (const gate of REPOSITORY_POLICY_SPECS) {
    results.push(await runRepositoryPolicyGate(gate, hooks));
  }

  const report = {
    kind: 'repository-policy' as const,
    label: 'Repository policy follow-up gates',
    passed: results.every((result) => result.status !== 'error' || !result.required),
    skipped: false,
    results,
  };

  hooks?.onGroupFinish?.(report);

  return report;
}

export async function runQualityGates(flags, hooks?: GateRunHooks): Promise<GateReport> {
  if (flags.skipChecks) {
    const report = {
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: true,
      skipped: true,
      results: [],
    };

    hooks?.onGroupFinish?.(report);

    return report;
  }

  const gates = QUALITY_GATE_SPECS.filter((g) => {
    if (g.id === 'test') return flags.withTests;
    if (g.id === 'build') return flags.withBuild;
    return true;
  });

  const results: GateResult[] = [];
  hooks?.onGroupStart?.({
    kind: 'quality',
    label: 'Incremental validation gates',
    gates: gates.map((gate) => ({ id: gate.id, label: gate.label, required: gate.required })),
  });
  for (const gate of gates) {
    results.push(await runQualityGate(gate, hooks));
  }

  const report = {
    kind: 'quality' as const,
    label: 'Incremental validation gates',
    passed: results.every((result) => result.status !== 'error' || !result.required),
    skipped: false,
    results,
  };

  hooks?.onGroupFinish?.(report);

  return report;
}

async function runRepositoryPolicyGate(
  gate: RepositoryPolicySpec,
  hooks?: GateRunHooks,
): Promise<GateResult> {
  const start = Date.now();
  hooks?.onGateStart?.({
    kind: 'repository-policy',
    id: gate.id,
    label: gate.label,
    required: gate.required,
  });

  try {
    let structuredResult: RepoStructuredResult;
    let displayCommand: string;
    if (gate.id === 'hotspots') {
      structuredResult = await runRepoCheck('hotspots', ['--fail-on-hard']);
      displayCommand = 'pnpm cdk repo check hotspots -- --fail-on-hard';
    } else if (gate.id === 'kebab-groups') {
      structuredResult = await runRepoCheck('kebab-groups', []);
      displayCommand = 'pnpm cdk repo check kebab-groups';
    } else {
      structuredResult = await runRepoCommand('check' as RepoCommandTarget, []);
      displayCommand = 'pnpm run check';
    }
    const status: GateStatus =
      structuredResult.status === 'ok'
        ? 'ok'
        : structuredResult.status === 'warning'
          ? 'warning'
          : 'error';
    const result = createGateResult({
      kind: 'repository-policy',
      id: gate.id,
      label: gate.label,
      command: displayCommand,
      required: gate.required,
      status,
      elapsedMs: Date.now() - start,
      output: defaultRenderer.renderText(structuredResult),
      summary: defaultRenderer.renderCompact(structuredResult),
    });
    hooks?.onGateFinish?.(result);
    return result;
  } catch (error) {
    const result = createGateResult({
      kind: 'repository-policy',
      id: gate.id,
      label: gate.label,
      command: gate.id,
      required: gate.required,
      status: 'error',
      elapsedMs: Date.now() - start,
      output: collectOutput(error),
      summary: '',
    });
    hooks?.onGateFinish?.(result);
    return result;
  }
}

async function runQualityGate(
  gate: (typeof QUALITY_GATE_SPECS)[number],
  hooks?: GateRunHooks,
): Promise<GateResult> {
  const start = Date.now();
  hooks?.onGateStart?.({
    kind: 'quality',
    id: gate.id,
    label: gate.label,
    required: gate.required,
  });

  try {
    const structuredResult = await runRepoCommand(gate.target as RepoCommandTarget, []);
    const result = createGateResult({
      kind: 'quality',
      id: gate.id,
      label: gate.label,
      command: `pnpm run ${structuredResult.command.script}`,
      required: gate.required,
      status: structuredResult.status === 'ok' ? 'ok' : 'error',
      elapsedMs: structuredResult.summary.durationMs,
      output: [...structuredResult.result.stdoutTail, ...structuredResult.result.stderrTail].join(
        '\n',
      ),
      summary: defaultRenderer.renderCompact(structuredResult),
    });
    hooks?.onGateFinish?.(result);
    return result;
  } catch (error) {
    const result = createGateResult({
      kind: 'quality',
      id: gate.id,
      label: gate.label,
      command: `pnpm run ${gate.target}`,
      required: gate.required,
      status: 'error',
      elapsedMs: Date.now() - start,
      output: collectOutput(error),
      summary: '',
    });
    hooks?.onGateFinish?.(result);
    return result;
  }
}

// ─── Unified validation check (delegates to cdk-repo-check) ──────────────────

/**
 * Run the full validation sequence via `cdk-repo-check validation` and map
 * its step results into gate-compatible results.  This replaces the old
 * pattern of running format → lint → typecheck → test → build individually
 * which duplicated logic and caused TUI cursor issues.
 *
 * Steps: gitnexus-analyze → format → lint → typecheck → test → build
 *         → hotspots → kebab-groups → check
 */
export async function runValidationCheck(
  flags: { skipChecks?: boolean; withTests?: boolean; withBuild?: boolean } = {},
  hooks?: GateRunHooks,
): Promise<GateReport & { kind: 'quality' }> {
  if (flags.skipChecks) {
    const report = {
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: true,
      skipped: true,
      results: [],
    };
    hooks?.onGroupFinish?.(report);
    return report;
  }

  try {
    const raw = await runRepoCheck('validation', []);
    // The validation check always returns a result with .report.steps.
    // Cast to access the steps array for gate mapping.
    const steps: RepoValidationStepResult[] = (
      (raw as Record<string, unknown>).report as Record<string, unknown> | undefined
    )?.steps as RepoValidationStepResult[] | undefined;
    if (!steps) {
      throw new Error('Validation check returned unexpected result structure');
    }

    const results: GateResult[] = steps
      .filter((step) => {
        // Skip steps disabled by flags
        if (step.id === 'test' && flags.withTests === false) return false;
        if (step.id === 'build' && flags.withBuild === false) return false;
        return true;
      })
      .map((step) => {
        const status: GateStatus =
          step.status === 'ok' ? 'ok' : step.status === 'warning' ? 'warning' : 'error';
        return createGateResult({
          kind: 'quality',
          id: step.id,
          label: step.label,
          command: step.command,
          required: step.required,
          status,
          elapsedMs: step.durationMs,
          output: step.summary || '',
          summary: step.summary || `exit ${step.exitCode}`,
        });
      });

    const report: GateReport = {
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: results.every((r) => r.status !== 'error' || !r.required),
      skipped: false,
      results,
    };

    hooks?.onGroupFinish?.(report);
    return report as GateReport & { kind: 'quality' };
  } catch (error) {
    const report: GateReport & { kind: 'quality' } = {
      kind: 'quality' as const,
      label: 'Incremental validation gates',
      passed: false,
      skipped: false,
      results: [
        createGateResult({
          kind: 'quality',
          id: 'validation',
          label: 'Validation sequence',
          command: 'pnpm run repo-check:validation',
          required: true,
          status: 'error',
          elapsedMs: 0,
          output: collectOutput(error),
          summary: '',
        }),
      ],
    };
    hooks?.onGroupFinish?.(report);
    return report;
  }
}

// ─── Scope detection ──────────────────────────────────────────────────────────
