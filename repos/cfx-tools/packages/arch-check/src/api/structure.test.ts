import { describe, expect, it } from 'vitest';
import {
  computeStructureTreeHash,
  detectLegacyStructureAlias,
  embedStructureMetadata,
  readEmbeddedStructureHash,
  renderStructureSkeleton,
  stripStructureMetadata,
  structureIdentityTokens,
  structureNeedsEnrichment,
} from './structure.js';

describe('structure helpers', () => {
  it('renders a deterministic structure skeleton with canonical identity', () => {
    const rendered = renderStructureSkeleton(
      {
        name: '@cfxdevkit/cdk',
        rel: 'repos/cfx-core/packages/cdk',
        description: 'Core SDK package.',
        subpaths: { '.': 'index.d.ts', './client': 'client/index.d.ts' },
      },
      ['package.json', 'src', '  index.ts'],
    );

    expect(rendered).toContain('# `@cfxdevkit/cdk` — Structure');
    expect(rendered).toContain('Workspace path: `repos/cfx-core/packages/cdk`');
    expect(rendered).toContain('`@cfxdevkit/cdk/client` → `client/index.d.ts`');
  });

  it('embeds and reads structure metadata', () => {
    const hash = computeStructureTreeHash(['src', '  index.ts']);
    const content = embedStructureMetadata('# Example', hash, { needsEnrichment: true });

    expect(readEmbeddedStructureHash(content)).toBe(hash);
    expect(structureNeedsEnrichment(content)).toBe(true);
    expect(stripStructureMetadata(content)).toBe('# Example');
  });

  it('detects legacy tier aliases in structure titles', () => {
    expect(detectLegacyStructureAlias('# framework/core — Detailed Structure')).toBe(
      'framework/core',
    );
    expect(detectLegacyStructureAlias('# `@cfxdevkit/cdk` — Structure')).toBeNull();
  });

  it('provides identity tokens for package structure validation', () => {
    expect(
      structureIdentityTokens({ name: '@cfxdevkit/cdk', rel: 'repos/cfx-core/packages/cdk' }),
    ).toEqual(['@cfxdevkit/cdk', 'repos/cfx-core/packages/cdk', 'cdk']);
  });
});
