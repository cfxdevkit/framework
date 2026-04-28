import { describe, expect, it } from 'vitest';
import { __packageName } from './index.js';

describe('@cfxdevkit/automation', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/automation');
  });
});
