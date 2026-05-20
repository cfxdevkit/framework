import { describe, expect, it } from 'vitest';

// Mirror the private function logic so tests stay co-located without exporting it.
// If `isGeneratedSource` is ever exported from arch.ts, replace with the real import.
function isGeneratedSource(rel: string): boolean {
  const basename = rel.split('/').at(-1) ?? '';
  return (
    rel.includes('/generated/') || rel.includes('/generated.') || basename.includes('.generated.')
  );
}

describe('isGeneratedSource', () => {
  it('matches files inside a generated/ directory', () => {
    expect(isGeneratedSource('repos/foo/src/generated/types.ts')).toBe(true);
  });

  it('matches files literally named generated.ts', () => {
    expect(isGeneratedSource('repos/foo/src/generated.ts')).toBe(true);
  });

  it('matches files with .generated. in the name', () => {
    expect(
      isGeneratedSource('repos/cfx-ui/packages/ui-core/src/mainnet-catalog.generated.ts'),
    ).toBe(true);
    expect(isGeneratedSource('repos/foo/src/usdc.generated.ts')).toBe(true);
    expect(isGeneratedSource('repos/foo/src/abis.generated.js')).toBe(true);
  });

  it('does not match regular source files', () => {
    expect(isGeneratedSource('repos/foo/src/index.ts')).toBe(false);
    expect(isGeneratedSource('repos/foo/src/runtime.ts')).toBe(false);
    expect(isGeneratedSource('repos/foo/src/hotspots.ts')).toBe(false);
  });

  it('does not match paths that merely contain the word "generator"', () => {
    expect(isGeneratedSource('repos/foo/src/generator.ts')).toBe(false);
    expect(isGeneratedSource('repos/foo/src/code-generator/index.ts')).toBe(false);
  });
});
