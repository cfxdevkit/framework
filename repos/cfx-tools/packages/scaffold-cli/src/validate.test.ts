import { describe, expect, it } from 'vitest';
import { validateName } from './validate.js';

describe('validateName', () => {
  it('accepts valid project names', () => {
    expect(validateName('my-project')).toEqual({ valid: true });
    expect(validateName('my_project')).toEqual({ valid: true });
    expect(validateName('my123project')).toEqual({ valid: true });
    expect(validateName('@scope/my-project')).toEqual({ valid: true });
  });
  it('rejects invalid project names', () => {
    expect(validateName('')).toEqual({ valid: false, error: 'Project name is required' });
    expect(validateName('my project')).toEqual({
      valid: false,
      error: 'Project name must not contain spaces',
    });
    expect(validateName('my!project')).toEqual({
      valid: false,
      error:
        'Project name must only contain letters, numbers, hyphens, underscores, and @scope/ prefix',
    });
    expect(validateName('my--project')).toEqual({
      valid: false,
      error: 'Project name must not contain consecutive hyphens',
    });
    expect(validateName('123project')).toEqual({
      valid: false,
      error: 'Project name must not start with a number',
    });
    expect(validateName('my-project-')).toEqual({
      valid: false,
      error: 'Project name must not end with a hyphen',
    });
  });
});
