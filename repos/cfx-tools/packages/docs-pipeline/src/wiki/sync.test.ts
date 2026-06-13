import { describe, expect, it } from 'vitest';
import { fixMermaidLabels, simplifyMermaidDiagram } from '../wiki/sync.js';

describe('fixMermaidLabels', () => {
  it('quotes @ package names in rectangular labels', () => {
    const input = 'Root --> Auto[@cfxdevkit/automation]';
    expect(fixMermaidLabels(input)).toBe('Root --> Auto["@cfxdevkit/automation"]');
  });

  it('quotes path labels with slashes', () => {
    const input = '    Types[types/index.ts]\n    Errors[errors/index.ts]';
    const result = fixMermaidLabels(input);
    expect(result).toContain('Types["types/index.ts"]');
    expect(result).toContain('Errors["errors/index.ts"]');
  });

  it('quotes labels with ampersand', () => {
    const input = '    Network[Network & Address]\n    Runtime[Runtime Checks & Models]';
    const result = fixMermaidLabels(input);
    expect(result).toContain('Network["Network & Address"]');
    expect(result).toContain('Runtime["Runtime Checks & Models"]');
  });

  it('quotes compound labels: @ and /', () => {
    const input = '    Lib[@cfxdevkit/contracts]';
    expect(fixMermaidLabels(input)).toBe('    Lib["@cfxdevkit/contracts"]');
  });

  it('does not double-quote already-quoted labels', () => {
    const input = '    Auto["@cfxdevkit/automation"]';
    expect(fixMermaidLabels(input)).toBe('    Auto["@cfxdevkit/automation"]');
  });

  it('leaves simple labels without special chars unchanged', () => {
    const input = '    Root --> Agents\n    Agents[Agent Workers]';
    expect(fixMermaidLabels(input)).toBe('    Root --> Agents\n    Agents[Agent Workers]');
  });

  it('handles multiple nodes on the same line', () => {
    const input = '    Theme[@cfxdevkit/theme] -->|Design Tokens| React[@cfxdevkit/react]';
    const result = fixMermaidLabels(input);
    expect(result).toContain('Theme["@cfxdevkit/theme"]');
    expect(result).toContain('React["@cfxdevkit/react"]');
  });

  it('quotes labels with @xcfx scope', () => {
    const input = '    Xcfx[@xcfx/node]';
    expect(fixMermaidLabels(input)).toBe('    Xcfx["@xcfx/node"]');
  });

  it('quotes round-paren labels with special chars', () => {
    const input = '    A(src/index.ts)';
    expect(fixMermaidLabels(input)).toBe('    A("src/index.ts")');
  });

  it('real wiki example: overview page', () => {
    const input = [
      'graph TD',
      '    Arch[Documentation & Architecture]',
      '    LLM[LLM Automation & Tooling]',
      '    CLI[CLI & Developer Tools]',
    ].join('\n');
    const result = fixMermaidLabels(input);
    expect(result).toContain('Arch["Documentation & Architecture"]');
    expect(result).toContain('LLM["LLM Automation & Tooling"]');
    expect(result).toContain('CLI["CLI & Developer Tools"]');
  });

  it('real wiki example: cfx-ui module', () => {
    const input =
      '    Theme[@cfxdevkit/theme] -->|Design Tokens| React[@cfxdevkit/react]\n    Theme -->|CSS Layer| DeFi[@cfxdevkit/defi-react]';
    const result = fixMermaidLabels(input);
    expect(result).toContain('Theme["@cfxdevkit/theme"]');
    expect(result).toContain('React["@cfxdevkit/react"]');
    expect(result).toContain('DeFi["@cfxdevkit/defi-react"]');
  });
});

describe('fixMermaidLabels — pipe normalization', () => {
  it('replaces | in node label with " / "', () => {
    const input = '    B --> C[CoreSpaceClient|EspaceClient]';
    expect(fixMermaidLabels(input)).toContain('["CoreSpaceClient / EspaceClient"]');
  });

  it('replaces | then quotes because result has /', () => {
    const input = '    A[sendWrite] --> B[sendEspaceWrite|sendCoreWrite]';
    const result = fixMermaidLabels(input);
    expect(result).toContain('["sendEspaceWrite / sendCoreWrite"]');
  });

  it('leaves edge label |text| untouched', () => {
    const input = '    A -->|calls| B';
    expect(fixMermaidLabels(input)).toBe('    A -->|calls| B');
  });
});

describe('simplifyMermaidDiagram', () => {
  it('returns diagram unchanged when under MERMAID_MAX_LINES', () => {
    const small = 'graph TD\n    A --> B\n    B --> C';
    expect(simplifyMermaidDiagram(small)).toBe(small);
  });

  it('simplifies diagram with more than 30 content lines', () => {
    const lines = ['graph TD'];
    for (let i = 0; i < 35; i++) lines.push(`    N${i} --> N${i + 1}`);
    const big = lines.join('\n');
    const result = simplifyMermaidDiagram(big);
    const resultLines = result.split('\n').filter((l) => l.trim());
    expect(resultLines.length).toBeLessThanOrEqual(31); // 30 + header
    expect(result).toContain('simplified');
  });
});
