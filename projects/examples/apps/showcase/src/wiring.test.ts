import { generateMnemonic, listChains, validateMnemonic } from '@cfxdevkit/core';
import { describe, expect, it } from 'vitest';

/**
 * The showcase is a UI app and intentionally has no React component tests
 * (the components are exercised by hand). These smoke tests ensure the
 * `@cfxdevkit/core` API the panels rely on is reachable and behaves as
 * expected when the package is consumed from this workspace.
 */
describe('showcase wiring', () => {
  it('imports generateMnemonic and produces a 12-word phrase', () => {
    const m = generateMnemonic(128);
    expect(m.split(' ')).toHaveLength(12);
    expect(validateMnemonic(m)).toBe(true);
  });

  it('imports listChains and exposes both core and espace', () => {
    const chains = listChains();
    expect(chains.some((c) => c.family === 'core')).toBe(true);
    expect(chains.some((c) => c.family === 'espace')).toBe(true);
  });
});
