import { describe, expect, it } from 'vitest';
import * as moduleUnderTest from './errors.js';

describe('errors', () => {
  it('loads its public runtime surface', () => {
    expect(moduleUnderTest).toBeDefined();
    expect(Object.keys(moduleUnderTest).length).toBeGreaterThan(0);
  });
});
