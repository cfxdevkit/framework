import { describe, expect, it } from 'vitest';
import { buildMonorepoUnitConfig, listMonorepoUnits } from './monorepo-units.js';
import { parseUnitConfigFlags } from './unit-configs.js';

describe('parseUnitConfigFlags', () => {
  it('parses write and fail-on-drift flags', () => {
    expect(parseUnitConfigFlags(['--write', '--fail-on-drift', '--json'])).toEqual({
      json: true,
      write: true,
      failOnDrift: true,
    });
  });
});

describe('buildMonorepoUnitConfig', () => {
  it('produces deterministic unit metadata for known monorepo units', () => {
    const docsUnit = listMonorepoUnits().find((unit) => unit.name === 'docs');
    if (!docsUnit) {
      throw new Error('Expected docs unit to be registered');
    }
    expect(buildMonorepoUnitConfig(docsUnit)).toMatchObject({
      unit: {
        name: 'docs',
        rootDir: 'docs',
      },
      harness: {
        defaultMode: 'deterministic',
        providerStrategy: 'auto',
      },
    });
  });
});
