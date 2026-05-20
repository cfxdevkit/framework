import { describe, expect, it } from 'vitest';
import * as moduleUnderTest from './source.js';

describe('templates/erc20/source', () => {
  it('loads its public runtime surface', () => {
    expect(moduleUnderTest).toBeDefined();
    expect(Object.keys(moduleUnderTest).length).toBeGreaterThan(0);
  });
});
