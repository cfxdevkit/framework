import { describe, expect, it } from 'vitest';
import { GROUPS, getPanel, PANELS } from './panels/registry.js';

describe('panel registry', () => {
  it('registers at least one panel', () => {
    expect(PANELS.length).toBeGreaterThan(0);
  });

  it('every panel id is unique and resolvable', () => {
    const ids = new Set<string>();
    for (const p of PANELS) {
      expect(ids.has(p.id), `duplicate id ${p.id}`).toBe(false);
      ids.add(p.id);
      expect(getPanel(p.id)?.id).toBe(p.id);
    }
  });

  it('every panel belongs to a known group', () => {
    const groupIds = new Set(GROUPS.map((g) => g.id));
    for (const p of PANELS) expect(groupIds.has(p.group)).toBe(true);
  });

  it('every panel has non-empty label / blurb / stack', () => {
    for (const p of PANELS) {
      expect(p.label.trim().length).toBeGreaterThan(0);
      expect(p.blurb.trim().length).toBeGreaterThan(0);
      expect(['wagmi', 'use-wallet-react', 'window', 'core']).toContain(p.stack);
    }
  });
});
