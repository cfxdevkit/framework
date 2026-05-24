import fs from 'node:fs/promises';
import path from 'node:path';

import { getDocsSitePaths } from './workspace.js';

const VALID_TYPES = new Set([
  'flowchart',
  'graph',
  'sequencediagram',
  'classdiagram',
  'statediagram',
  'statediagram-v2',
  'erdiagram',
  'gantt',
  'pie',
  'gitgraph',
  'mindmap',
  'timeline',
  'sankey-beta',
  'xychart-beta',
  'block-beta',
  'requirement',
  'c4context',
  'c4container',
  'c4component',
  'c4dynamic',
  'c4deployment',
  'journey',
  'quadrantchart',
  'zenuml',
]);

const DIRECTION_TYPES = new Set(['flowchart', 'graph']);
const VALID_DIRECTIONS = new Set(['td', 'lr', 'bt', 'rl', 'tb']);

type MermaidBlock = {
  diagram: string;
  start: number;
  end: number;
  jsx: boolean;
};

type ValidationIssue = {
  block: MermaidBlock;
  reason: string;
};

let mermaidParserState: 'available' | 'unavailable' | undefined;

function heuristicCheck(diagram: string): string | null {
  const lines = diagram
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return 'Empty diagram';

  const firstToken = lines[0]?.split(/\s+/)[0]?.toLowerCase() ?? '';
  if (!VALID_TYPES.has(firstToken)) {
    return `Unknown diagram type "${firstToken}"`;
  }

  if (DIRECTION_TYPES.has(firstToken)) {
    const dir = lines[0]?.split(/\s+/)[1]?.toLowerCase();
    if (!dir || !VALID_DIRECTIONS.has(dir)) {
      return `"${firstToken}" missing or invalid direction (got "${dir ?? ''}", expected TD/LR/BT/RL)`;
    }
  }

  for (const line of lines) {
    if (/\[@[^\]"]+\]/.test(line)) {
      return `Unquoted @ in node label (use ["@pkg"] instead of [@pkg]): ${line.slice(0, 60)}`;
    }
  }

  let depth = 0;
  for (const line of lines) {
    if (/^subgraph\b/.test(line)) depth++;
    else if (/^end\b/.test(line)) depth--;
    if (depth < 0) return 'Extra "end" without matching "subgraph"';
  }
  if (depth > 0) return `${depth} unclosed "subgraph" block(s)`;

  for (const line of lines) {
    if (!line.includes('[') && !line.includes('(') && !line.includes('{')) continue;
    if (/-->|---|==>|~~~|-\.->|-\.-/.test(line)) continue;
    const opens = [...line].filter((char) => '([{'.includes(char)).length;
    const closes = [...line].filter((char) => ')]}'.includes(char)).length;
    if (opens !== closes) {
      return `Unbalanced brackets in: ${line.slice(0, 60)}`;
    }
  }

  return null;
}

async function mermaidParse(diagram: string): Promise<boolean | null> {
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

    if (mermaidParserState === undefined) {
      try {
        await mermaid.parse('graph TD\n  A[start] --> B[end]', { suppressErrors: false });
        mermaidParserState = 'available';
      } catch {
        mermaidParserState = 'unavailable';
      }
    }

    if (mermaidParserState === 'unavailable') return null;
    const result = await mermaid.parse(diagram, { suppressErrors: true });
    return result !== false;
  } catch {
    mermaidParserState = 'unavailable';
    return null;
  }
}

function extractBlocks(text: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = [];

  const jsxRe = /<Mermaid\s+chart=\{`([\s\S]*?)`\}\s*\/>/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard RegExp.exec loop idiom
  while ((match = jsxRe.exec(text)) !== null) {
    const diagram = (match[1] ?? '').replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
    blocks.push({
      diagram,
      start: match.index,
      end: match.index + match[0].length,
      jsx: true,
    });
  }

  const fenceRe = /```mermaid\n([\s\S]*?)```/g;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard RegExp.exec loop idiom
  while ((match = fenceRe.exec(text)) !== null) {
    blocks.push({
      diagram: match[1] ?? '',
      start: match.index,
      end: match.index + match[0].length,
      jsx: false,
    });
  }

  return blocks.sort((left, right) => left.start - right.start);
}

function downgradeToPre(text: string, block: MermaidBlock): string {
  const replacement =
    '> ⚠️ *Diagram syntax error — rendering skipped. Raw source:*\n\n' +
    '```text\n' +
    block.diagram +
    '```';
  return text.slice(0, block.start) + replacement + text.slice(block.end);
}

export async function validateWikiMermaid(options: { fix?: boolean } = {}): Promise<{
  totalBlocks: number;
  brokenBlocks: number;
  fixedBlocks: number;
}> {
  const fix = options.fix === true;
  const { wikiContentDir } = getDocsSitePaths();

  let files: string[];
  try {
    files = (await fs.readdir(wikiContentDir)).filter((file) => file.endsWith('.mdx'));
  } catch {
    console.log('Wiki content directory not found — nothing to validate.');
    return { totalBlocks: 0, brokenBlocks: 0, fixedBlocks: 0 };
  }

  let totalBlocks = 0;
  let brokenBlocks = 0;
  let fixedBlocks = 0;

  for (const file of files.sort()) {
    const filePath = path.join(wikiContentDir, file);
    let content = await fs.readFile(filePath, 'utf8');
    const blocks = extractBlocks(content);
    if (blocks.length === 0) continue;

    totalBlocks += blocks.length;
    const errors: ValidationIssue[] = [];

    for (const block of blocks) {
      const hint = heuristicCheck(block.diagram);
      const parseOk = await mermaidParse(block.diagram);
      const broken = hint !== null || parseOk === false;
      if (broken) {
        brokenBlocks++;
        errors.push({ block, reason: hint ?? 'mermaid.parse() returned false' });
      }
    }

    if (errors.length === 0) {
      console.log(`  ✓  ${file} (${blocks.length} diagram${blocks.length > 1 ? 's' : ''})`);
      continue;
    }

    console.log(`  ✗  ${file}`);
    for (const { block, reason } of errors) {
      const preview = block.diagram.split('\n')[0]?.trim().slice(0, 50) ?? '';
      console.log(`       error: ${reason}`);
      console.log(`       block: ${preview}…`);
    }

    if (fix) {
      const reversed = [...errors].sort((left, right) => right.block.start - left.block.start);
      for (const { block } of reversed) {
        content = downgradeToPre(content, block);
        fixedBlocks++;
      }
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`       → sanitized ${errors.length} block(s) in ${file}`);
    }
  }

  console.log(`\nSummary: ${totalBlocks} diagram(s) in ${files.length} file(s) checked.`);
  if (mermaidParserState === 'unavailable') {
    console.log(
      'Note: mermaid.parse() unavailable headlessly (DOMPurify requires browser) — heuristic validation only.',
    );
  }
  if (brokenBlocks === 0) {
    console.log('All diagrams passed validation.');
  } else {
    console.log(`${brokenBlocks} broken diagram(s) found.`);
    if (fix) console.log(`${fixedBlocks} block(s) sanitized (downgraded to plain text fences).`);
    else console.log('Re-run with --fix to sanitize broken blocks.');
  }

  return { totalBlocks, brokenBlocks, fixedBlocks };
}
