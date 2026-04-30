import { describe, expect, it } from 'vitest';
import { api } from './lib/api.js';
import { GROUPS, PANELS } from './panels/registry.js';

describe('panel registry', () => {
  it('all panels reference valid groups', () => {
    const groupIds = new Set(GROUPS.map((g) => g.id));
    for (const p of PANELS) {
      expect(groupIds.has(p.group), `panel ${p.id} references unknown group ${p.group}`).toBe(true);
    }
  });

  it('panel ids are unique', () => {
    const ids = PANELS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('api client', () => {
  it('has baseUrl defined', () => {
    expect(typeof api.baseUrl).toBe('string');
  });

  it('exposes all endpoint methods', () => {
    expect(typeof api.health).toBe('function');
    expect(typeof api.authNonce).toBe('function');
    expect(typeof api.sessionKeyIssue).toBe('function');
    expect(typeof api.devnodeStart).toBe('function');
    expect(typeof api.compile).toBe('function');
  });
});
