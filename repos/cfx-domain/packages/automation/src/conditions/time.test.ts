import { describe, expect, it } from 'vitest';
import { dcaJob, limitOrderJob } from '../testHelpers.js';
import { isDCADue, isExpired } from './time.js';

describe('time conditions', () => {
  it('checks DCA due windows with a buffer', () => {
    const job = dcaJob({ params: { ...dcaJob().params, nextExecution: 100 } });
    expect(isDCADue(job.params, 84)).toBe(false);
    expect(isDCADue(job.params, 85)).toBe(true);
  });

  it('does not mark completed DCA jobs due', () => {
    const job = dcaJob({ params: { ...dcaJob().params, swapsCompleted: 3 } });
    expect(isDCADue(job.params, 10_000)).toBe(false);
  });

  it('checks job expiry in seconds', () => {
    expect(isExpired(limitOrderJob({ expiresAt: 2_000 }), 1)).toBe(false);
    expect(isExpired(limitOrderJob({ expiresAt: 2_000 }), 2)).toBe(true);
  });
});
