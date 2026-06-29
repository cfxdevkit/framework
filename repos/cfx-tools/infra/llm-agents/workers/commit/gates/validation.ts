import type { RepoValidationStepResult } from '@cfxdevkit/cdk-repo-check';
import { runRepoCheck } from '@cfxdevkit/cdk-repo-check';
import { collectOutput } from '../gate/output.js';
import { createGateResult } from '../gate/results.js';
import type { GateRunHooks, GateReport } from './types';

/**
 * Unified validation check — delegates to `cdk-repo-check validation`.
 *
 * Runs the full sequence: gitnexus-analyze → format → lint → typecheck → test
 * → build → hotspots → kebab-groups → check.
 *
 * Maps structured step results into gate-compatible results so consumers
 * can display them through the existing gate UI.
 */
export async function runValidationCheck(
  flags: {
    skipChecks?: boolean;
    withTests?: boolean;
    withBuild?: boolean;
  } = {},
  hooks?: GateRunHooks,
): Promise<GateReport & { kind: 'quality' }> {
  if (flags.skipChecks) {
    const report: GateReport & { kind: 'quality' } = {
      kind: 'quality',
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

    // Cast: cdk-repo-check always returns { report: { steps: [...] } } for validation target
    const steps = (raw as { report?: { steps?: RepoValidationStepResult[] } }).report?.steps;

    if (!steps) {
      throw new Error('Validation check returned unexpected result structure');
    }

    const results: GateReport['results'] = steps
      .filter((step) => {
        // Skip steps disabled by flags
        if (step.id === 'test' && flags.withTests === false) return false;
        if (step.id === 'build' && flags.withBuild === false) return false;
        return true;
      })
      .map((step) => {
        const status: GateReport['results'][number]['status'] =
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

    const report: GateReport & { kind: 'quality' } = {
      kind: 'quality',
      label: 'Incremental validation gates',
      passed: results.every((r) => r.status !== 'error' || !r.required),
      skipped: false,
      results,
    };

    hooks?.onGroupFinish?.(report);
    return report;
  } catch (error) {
    const report: GateReport & { kind: 'quality' } = {
      kind: 'quality',
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
