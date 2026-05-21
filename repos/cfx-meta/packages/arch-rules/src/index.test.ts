import { describe, expect, it } from 'vitest';
import { getLifecycle, getRulesFor, getTierFor } from './index.js';

describe('arch-rules', () => {
  it('resolves framework package paths', () => {
    expect(getTierFor('repos/cfx-core/packages/cdk/src/index.ts')).toEqual({
      id: 'framework',
      level: 0,
    });
  });

  it('resolves cross-cutting package paths', () => {
    expect(getTierFor('repos/cfx-meta/packages/arch-rules/src/index.ts')).toEqual({
      id: 'cross-cutting',
      level: -1,
      crossCutting: true,
    });
    expect(getTierFor('repos/cfx-config/packages/tsconfig/base.json')).toEqual({
      id: 'cross-cutting',
      level: -1,
      crossCutting: true,
    });
  });

  it('returns null for unknown paths', () => {
    expect(getTierFor('unknown/path')).toBeNull();
  });

  it('returns applicable framework rules', () => {
    expect(getRulesFor('framework').map((rule) => rule.id)).toContain('no-upward-imports');
  });

  it('exposes the current lifecycle', () => {
    expect(getLifecycle()).toBe('pre-release');
  });
});
