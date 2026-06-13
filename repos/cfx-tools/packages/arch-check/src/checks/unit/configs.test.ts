import { describe, expect, it } from 'vitest';
import { buildMonorepoUnitConfig, listMonorepoUnits } from '../monorepo-units.js';
import { parseUnitConfigFlags } from './configs.js';

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
    const deliveryUnit = listMonorepoUnits().find((unit) => unit.name === 'delivery');
    if (!deliveryUnit) {
      throw new Error('Expected delivery preset to be registered');
    }
    expect(buildMonorepoUnitConfig(deliveryUnit)).toMatchObject({
      unit: {
        name: 'delivery',
        aliases: ['docs', 'openspec', 'plan'],
        rootDir: 'openspec',
      },
      harness: {
        defaultMode: 'deterministic',
        providerStrategy: 'auto',
      },
    });
  });
});
