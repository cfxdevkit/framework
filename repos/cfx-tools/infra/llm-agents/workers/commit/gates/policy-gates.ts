import type { RepoStructuredResult } from '@cfxdevkit/cdk-repo-check';
import { defaultRenderer, runRepoCheck, runRepoCommand } from '@cfxdevkit/cdk-repo-check';
import { collectOutput } from '../gate/output.js';
import { createGateResult } from '../gate/results.js';
import type { GateRunHooks, GateReport, GateResult, RepositoryPolicySpec } from './types';

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

  const report: GateReport = {
    kind: 'repository-policy',
    label: 'Repository policy follow-up gates',
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
      structuredResult = await runRepoCommand('check', []);
      displayCommand = 'pnpm run check';
    }

    const status: GateResult['status'] =
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

export { REPOSITORY_POLICY_SPECS };
