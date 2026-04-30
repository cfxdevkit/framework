import { describe, expect, it } from 'vitest';
import { selectorsOf } from './artifacts.js';
import { __packageName } from './index.js';
import { compose, npmResolver, remappingResolver } from './resolver/index.js';
import { basicErc20, getTemplate, listTemplates } from './templates/index.js';

describe('@cfxdevkit/compiler', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/compiler');
  });
});

describe('compiler / templates', () => {
  it('lists the basic-erc20 template', () => {
    const all = listTemplates();
    expect(all.length).toBeGreaterThan(0);
    expect(all.find((t) => t.id === 'basic-erc20')).toBeDefined();
  });

  it('basicErc20 has its source inlined', () => {
    expect(basicErc20.sources.length).toBe(1);
    const first = basicErc20.sources[0];
    expect(first?.content.includes('contract BasicErc20')).toBe(true);
  });

  it('getTemplate throws for unknown ids', () => {
    expect(() => getTemplate('not-a-template')).toThrow(/unknown template id/);
  });
});

describe('compiler / resolver', () => {
  it('compose returns the first non-null hit', async () => {
    const a = { resolve: async () => null };
    const b = { resolve: async () => ({ path: 'x', content: 'y' }) };
    const r = compose([a, b]);
    expect(await r.resolve({ from: '', importPath: 'x' })).toEqual({ path: 'x', content: 'y' });
  });

  it('npmResolver skips relative paths', async () => {
    const r = npmResolver();
    expect(await r.resolve({ from: '', importPath: './foo.sol' })).toBeNull();
  });

  it('remappingResolver returns null when no prefix matches', async () => {
    const r = remappingResolver(['@nope/=node_modules/@nope/']);
    expect(await r.resolve({ from: '', importPath: 'unrelated/path.sol' })).toBeNull();
  });
});

describe('compiler / selectorsOf', () => {
  it('extracts function selectors only', () => {
    const sels = selectorsOf([
      {
        type: 'function',
        name: 'transfer',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
      },
      { type: 'event', name: 'Transfer', inputs: [], anonymous: false },
      { type: 'constructor', stateMutability: 'nonpayable', inputs: [] },
    ]);
    expect(sels.length).toBe(1);
    expect(sels[0]).toMatch(/^0x[0-9a-f]{8}$/);
  });
});
