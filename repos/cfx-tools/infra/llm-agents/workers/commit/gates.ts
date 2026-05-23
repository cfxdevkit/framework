import { join } from 'node:path';
import { execFileAsync, QUALITY_GATES, root } from '../shared/index.ts';
import { collectOutput } from './gate-output.ts';
import {
  createGateResult,
  extractGateSummary,
  extractHotspotSummary,
  extractKebabGroupStatus,
  extractKebabGroupSummary,
} from './gate-results.ts';

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

type RepositoryPolicyGate = {
  id: string;
  label: string;
  args: string[];
  displayCommand: string;
  timeoutMs: number;
  required: boolean;
  summarize: (output: string) => string;
  detectSuccessStatus?: (output: string) => RepositoryPolicyStatus;
};

const REPOSITORY_POLICY_GATES: readonly RepositoryPolicyGate[] = [
  {
    id: 'hotspots',
    label: 'Code hotspots',
    args: [
      'exec',
      'tsx',
      join(root, 'repos/cfx-tools/packages/arch-check/src/bin/check-hotspots.ts'),
      '--fail-on-hard',
    ],
    displayCommand: 'pnpm cdk repo check hotspots -- --fail-on-hard',
    timeoutMs: 120000,
    required: true,
    summarize: extractHotspotSummary,
  },
  {
    id: 'kebab-groups',
    label: 'Kebab file groups',
    args: [
      'exec',
      'tsx',
      join(root, 'repos/cfx-tools/packages/arch-check/src/bin/check-kebab-groups.ts'),
    ],
    displayCommand: 'pnpm cdk repo check kebab-groups',
    timeoutMs: 120000,
    required: false,
    summarize: extractKebabGroupSummary,
    detectSuccessStatus: extractKebabGroupStatus,
  },
  {
    id: 'check',
    label: 'Repo check',
    args: ['run', 'check'],
    displayCommand: 'pnpm run check',
    timeoutMs: 300000,
    required: true,
    summarize: extractGateSummary,
  },
];

export async function runRepositoryPolicyGates(hooks?: GateRunHooks) {
  const results: GateResult[] = [];

  hooks?.onGroupStart?.({
    kind: 'repository-policy',
    label: 'Repository policy follow-up gates',
    gates: REPOSITORY_POLICY_GATES.map((gate) => ({
      id: gate.id,
      label: gate.label,
      required: gate.required,
    })),
  });

  for (const gate of REPOSITORY_POLICY_GATES) {
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

  const gates = QUALITY_GATES.filter((g) => {
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
  gate: RepositoryPolicyGate,
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
    const { stdout, stderr } = await execFileAsync('pnpm', gate.args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 10,
      signal: AbortSignal.timeout(gate.timeoutMs),
      env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false', FORCE_COLOR: '0' },
    });
    const output = `${stdout}${stderr}`;
    const status = gate.detectSuccessStatus?.(output) ?? 'ok';
    const result = createGateResult({
      kind: 'repository-policy',
      id: gate.id,
      label: gate.label,
      command: gate.displayCommand,
      required: gate.required,
      status,
      elapsedMs: Date.now() - start,
      output,
      summary: gate.summarize(output).trim(),
    });
    hooks?.onGateFinish?.(result);
    return result;
  } catch (error) {
    const result = createGateResult({
      kind: 'repository-policy',
      id: gate.id,
      label: gate.label,
      command: gate.displayCommand,
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

async function runQualityGate(gate, hooks?: GateRunHooks): Promise<GateResult> {
  const start = Date.now();
  hooks?.onGateStart?.({
    kind: 'quality',
    id: gate.id,
    label: gate.label,
    required: gate.required,
  });

  try {
    const { stdout, stderr } = await execFileAsync(gate.cmd, gate.args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 10,
      signal: AbortSignal.timeout(gate.timeoutMs),
      env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false', FORCE_COLOR: '0' },
    });
    const output = `${stdout}${stderr}`;
    const result = createGateResult({
      kind: 'quality',
      id: gate.id,
      label: gate.label,
      command: `${gate.cmd} ${gate.args.join(' ')}`,
      required: gate.required,
      status: 'ok',
      elapsedMs: Date.now() - start,
      output,
      summary: extractGateSummary(output),
    });
    hooks?.onGateFinish?.(result);
    return result;
  } catch (error) {
    const result = createGateResult({
      kind: 'quality',
      id: gate.id,
      label: gate.label,
      command: `${gate.cmd} ${gate.args.join(' ')}`,
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
