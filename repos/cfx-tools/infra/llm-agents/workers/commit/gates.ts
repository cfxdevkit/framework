import { join } from 'node:path';
import { execFileAsync, QUALITY_GATES, root } from '../shared/index.ts';
import { buildDeterministicHints, collectOutput, extractSignalLines } from './gate-output.ts';

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
    id: 'unit-configs',
    label: 'Monorepo unit configs',
    args: [
      'exec',
      'tsx',
      join(root, 'repos/cfx-tools/packages/arch-check/src/bin/check-unit-configs.ts'),
      '--fail-on-drift',
    ],
    displayCommand: 'pnpm cdk repo check unit-configs',
    timeoutMs: 120000,
    required: true,
    summarize: extractUnitConfigSummary,
  },
];

export async function runRepositoryPolicyGates() {
  const results: GateResult[] = [];

  for (const gate of REPOSITORY_POLICY_GATES) {
    results.push(await runRepositoryPolicyGate(gate));
  }

  return {
    kind: 'repository-policy' as const,
    label: 'Repository policy gates',
    passed: results.every((result) => result.status !== 'error' || !result.required),
    skipped: false,
    results,
  };
}

export async function runQualityGates(flags) {
  if (flags.skipChecks) {
    return {
      kind: 'quality' as const,
      label: 'Quality gates',
      passed: true,
      skipped: true,
      results: [],
    };
  }

  const gates = QUALITY_GATES.filter((g) => {
    if (g.id === 'test') return flags.withTests;
    if (g.id === 'build') return flags.withBuild;
    return true; // lint + typecheck always run
  });

  const results: GateResult[] = [];
  for (const gate of gates) {
    results.push(await runQualityGate(gate));
  }

  return {
    kind: 'quality' as const,
    label: 'Quality gates',
    passed: results.every((result) => result.status !== 'error' || !result.required),
    skipped: false,
    results,
  };
}

async function runRepositoryPolicyGate(gate: RepositoryPolicyGate): Promise<GateResult> {
  const start = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync('pnpm', gate.args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 10,
      signal: AbortSignal.timeout(gate.timeoutMs),
      env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false', FORCE_COLOR: '0' },
    });
    const output = `${stdout}${stderr}`;
    const status = gate.detectSuccessStatus?.(output) ?? 'ok';
    return createGateResult({
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
  } catch (error) {
    return createGateResult({
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
  }
}

async function runQualityGate(gate): Promise<GateResult> {
  const start = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync(gate.cmd, gate.args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 10,
      signal: AbortSignal.timeout(gate.timeoutMs),
      env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false', FORCE_COLOR: '0' },
    });
    const output = `${stdout}${stderr}`;
    return createGateResult({
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
  } catch (error) {
    return createGateResult({
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
  }
}

export function extractGateSummary(output) {
  // Moon task summary line: "Tasks: N completed (N cached)"
  const moonMatch = output.match(/Tasks:\s+\d+\s+completed[^\n]*/);
  if (moonMatch) return moonMatch[0].trim();
  // Biome summary: "Checked N files"
  const biomeMatch = output.match(/Checked \d+ files[^\n]*/);
  if (biomeMatch) return biomeMatch[0].trim();
  return '';
}

export function extractHotspotSummary(output) {
  const match = output.match(/Scanned \d+ source files;[^\n]*/);
  return match ? `  ${match[0].trim()}` : '';
}

export function extractKebabGroupSummary(output) {
  const match = output.match(
    /Scanned \d+ source files; found \d+ grouped kebab-case prefix\(es\) covering \d+ file\(s\)\./,
  );
  return match ? `  ${match[0].trim()}` : '';
}

export function extractUnitConfigSummary(output) {
  const match = output.match(
    /Checked \d+ unit config\(s\); \d+ missing, \d+ drifted, \d+ written\./,
  );
  return match ? `  ${match[0].trim()}` : '';
}

function extractKebabGroupStatus(output: string): RepositoryPolicyStatus {
  const match = output.match(/Kebab filename groups:\s+(ok|warning|error)/);
  return (match?.[1] as RepositoryPolicyStatus | undefined) ?? 'ok';
}

function createGateResult(params: {
  kind: 'repository-policy' | 'quality';
  id: string;
  label: string;
  command: string;
  required: boolean;
  status: GateStatus;
  elapsedMs: number;
  output: string;
  summary: string;
}): GateResult {
  const output = params.output.trim();
  const signalLines = extractSignalLines(output);
  return {
    ...params,
    output,
    summary: params.summary || signalLines[0] || '',
    signalLines,
    hints: buildDeterministicHints({ id: params.id, command: params.command, output }),
  };
}

// ─── Scope detection ──────────────────────────────────────────────────────────
