import { describe, expect, it } from 'vitest';
import { SafetyGuard } from './safety.js';
import { dcaJob, limitOrderJob } from './test-helpers.js';

describe('SafetyGuard', () => {
  it('allows active jobs within limits', () => {
    const guard = new SafetyGuard();
    const result = guard.check(limitOrderJob(), { nowSec: 1, estimatedSwapUsd: 100 });
    expect(result.ok).toBe(true);
  });

  it('records pause and limit violations', () => {
    const guard = new SafetyGuard({ globalPause: true, maxSwapUsd: 10 });
    const result = guard.check(limitOrderJob(), { nowSec: 1, estimatedSwapUsd: 11 });
    expect(result.ok).toBe(false);
    expect(result.violations.map((violation) => violation.rule)).toContain('global_pause');
    expect(result.violations.map((violation) => violation.rule)).toContain('swap_size');
    expect(guard.getViolations()).toHaveLength(2);
  });

  it('checks DCA interval rules', () => {
    const guard = new SafetyGuard({ minExecutionIntervalSeconds: 60 });
    const result = guard.check(
      dcaJob({ params: { ...dcaJob().params, intervalSeconds: 30, nextExecution: 10_000 } }),
      { nowSec: 1 },
    );
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'min_interval',
      'dca_interval',
    ]);
  });

  it('updates pause config', () => {
    const guard = new SafetyGuard();
    expect(guard.pauseAll().globalPause).toBe(true);
    expect(guard.resumeAll().globalPause).toBe(false);
  });
});
