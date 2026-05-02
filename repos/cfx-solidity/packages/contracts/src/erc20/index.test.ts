import { describe, expect, it } from 'vitest';
import * as moduleUnderTest from './index.js';

describe('@cfxdevkit/contracts/erc20/index', () => {
  it('loads its public runtime surface', () => {
    expect(moduleUnderTest).toBeDefined();
    expect(Object.keys(moduleUnderTest).length).toBeGreaterThan(0);
  });
});
