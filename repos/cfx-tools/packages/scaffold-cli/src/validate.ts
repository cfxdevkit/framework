export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateName(name: string): ValidationResult {
  if (!name) return { valid: false, error: 'Project name is required' };
  if (/\s/.test(name)) return { valid: false, error: 'Project name must not contain spaces' };
  if (/[^a-zA-Z0-9_@/-]/.test(name)) {
    return {
      valid: false,
      error:
        'Project name must only contain letters, numbers, hyphens, underscores, and @scope/ prefix',
    };
  }
  if (name.includes('--')) {
    return { valid: false, error: 'Project name must not contain consecutive hyphens' };
  }
  const unscopedName = name.startsWith('@') ? (name.split('/')[1] ?? '') : name;
  if (/^\d/.test(unscopedName)) {
    return { valid: false, error: 'Project name must not start with a number' };
  }
  if (unscopedName.endsWith('-')) {
    return { valid: false, error: 'Project name must not end with a hyphen' };
  }
  return { valid: true };
}
