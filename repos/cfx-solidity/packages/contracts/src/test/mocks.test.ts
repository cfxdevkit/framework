import { describe, expect, it } from 'vitest';
import * as moduleUnderTest from './mocks.js';

describe('@cfxdevkit/contracts/test/mocks', () => {
  it('loads its public runtime surface', () => {
    expect(moduleUnderTest).toBeDefined();
    expect(Object.keys(moduleUnderTest).length).toBeGreaterThan(0);
  });
});
