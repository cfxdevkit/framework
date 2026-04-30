import { describe, expect, it } from 'vitest';
import { __packageName } from './index.js';

describe('@cfxdevkit/codegen-contracts', () => {
  it('exposes its package name marker', () => {
    expect(__packageName).toBe('@cfxdevkit/codegen-contracts');
  });
});
