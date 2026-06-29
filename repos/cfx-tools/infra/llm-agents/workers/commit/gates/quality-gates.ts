import type { RepoStructuredResult, RepoCommandTarget } from '@cfxdevkit/cdk-repo-check';
import { defaultRenderer, runRepoCommand } from '@cfxdevkit/cdk-repo-check';
import { QUALITY_GATE_SPECS } from '../../shared/index.js';
import { collectOutput } from '../gate/output.js';
import { createGateResult } from '../gate/results.js';
import type { GateRunHooks, GateReport, GateResult } from './types';

export async function runQualityGates(
  flags: {
    skipChecks?: boolean;
    withTests?: boolean;
    withBuild?: boolean;
  },
  hooks?: GateRunHooks,
): Promise<GateReport> {
  if (flags.skipChecks) {
    const report: GateReport = {
      kind: 'quality',
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
    gates: gates.map((gate) => ({
      id: gate.id,
      label: gate.label,
      required: gate.required,
    })),
  });

  for (const gate of gates) {
    results.push(await runQualityGate(gate, hooks));
  }

  const report: GateReport = {
    kind: 'quality',
    label: 'Incremental validation gates',
    passed: results.every((result) => result.status !== 'error' || !result.required),
    skipped: false,
    results,
  };

  hooks?.onGroupFinish?.(report);

  return report;
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
    const structuredResult: RepoStructuredResult = await runRepoCommand(
      gate.target as RepoCommandTarget,
      [],
    );

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
