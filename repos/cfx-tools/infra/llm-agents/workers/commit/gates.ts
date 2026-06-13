import {
  defaultRenderer,
  type RepoCommandTarget,
  runRepoCheck,
  runRepoCommand,
} from '@cfxdevkit/cdk-repo-check';
import { QUALITY_GATE_SPECS } from '../shared/index.ts';
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

export async function runRepositoryPolicyGates(hooks?: GateRunHooks) {
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

export async function runQualityGates(flags, hooks?: GateRunHooks) {
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
    let structuredResult;
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

// ─── Scope detection ──────────────────────────────────────────────────────────
