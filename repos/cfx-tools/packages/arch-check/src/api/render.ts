/**
 * Renders the deterministic API.md markdown skeleton for a package.
 */
import type { ExtractedExport } from './extract.js';

type SubpathSection = {
  subpath: string;
  exports: ExtractedExport[];
};

export function renderApiMd(
  packageName: string,
  description: string,
  sections: SubpathSection[],
): string {
  const lines: string[] = [];
  lines.push(`# \`${packageName}\` — Public API`);
  lines.push('');
  if (description) {
    lines.push(`> ${description}`);
    lines.push('');
  }

  // Sub-paths table
  if (sections.length > 0) {
    lines.push('## Sub-paths');
    lines.push('');
    lines.push('| Sub-path | Exports |');
    lines.push('|----------|---------|');
    for (const s of sections) {
      const count = s.exports.length;
      lines.push(`| \`${s.subpath}\` | ${count} symbol${count !== 1 ? 's' : ''} |`);
    }
    lines.push('');
  }

  // Per-subpath sections
  for (const s of sections) {
    lines.push(`---`);
    lines.push('');
    lines.push(`## \`${s.subpath}\``);
    lines.push('');
    if (s.exports.length === 0) {
      lines.push('*(no named exports detected)*');
      lines.push('');
      continue;
    }

    // Group by kind
    const byKind = new Map<string, ExtractedExport[]>();
    for (const e of s.exports) {
      const k = e.kind === 'other' ? 'other' : e.kind;
      if (!byKind.has(k)) byKind.set(k, []);
      byKind.get(k)?.push(e);
    }

    lines.push('```ts');
    for (const [, exps] of byKind) {
      for (const e of exps) {
        if (e.signature) {
          lines.push(e.signature);
        } else {
          lines.push(`export { ${e.name} }`);
        }
      }
    }
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}
