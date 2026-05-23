import { buildDeterministicHints, extractSignalLines } from './gate-output.ts';
import type { GateResult } from './gates.ts';

export function extractGateSummary(output: string): string {
  const moonMatch = output.match(/Tasks:\s+\d+\s+completed[^\n]*/);
  if (moonMatch) return moonMatch[0].trim();
  const biomeMatch = output.match(/Checked \d+ files[^\n]*/);
  if (biomeMatch) return biomeMatch[0].trim();
  return '';
}

export function extractHotspotSummary(output: string): string {
  const match = output.match(/Scanned \d+ source files;[^\n]*/);
  return match ? `  ${match[0].trim()}` : '';
}

export function extractKebabGroupSummary(output: string): string {
  const match = output.match(
    /Scanned \d+ source files; found \d+ grouped kebab-case prefix\(es\) covering \d+ file\(s\)\./,
  );
  return match ? `  ${match[0].trim()}` : '';
}

export function extractUnitConfigSummary(output: string): string {
  const match = output.match(
    /Checked \d+ unit config\(s\); \d+ missing, \d+ drifted, \d+ written\./,
  );
  return match ? `  ${match[0].trim()}` : '';
}

export function extractKebabGroupStatus(output: string): 'ok' | 'warning' | 'error' {
  const match = output.match(/Kebab filename groups:\s+(ok|warning|error)/);
  return (match?.[1] as 'ok' | 'warning' | 'error' | undefined) ?? 'ok';
}

export function createGateResult(params: {
  kind: 'repository-policy' | 'quality';
  id: string;
  label: string;
  command: string;
  required: boolean;
  status: GateResult['status'];
  elapsedMs: number;
  output: string;
  summary: string;
}): GateResult {
  const output = params.output.trim();
  const signalLines = extractSignalLines(output);
  return {
    ...params,
    output,
    summary: params.summary || signalLines[0] || '',
    signalLines,
    hints: buildDeterministicHints({ id: params.id, command: params.command, output }),
  };
}
