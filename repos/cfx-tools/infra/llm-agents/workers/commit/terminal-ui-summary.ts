import type { GateFailureAnalysis } from './failure-analysis.ts';
import type { GateReport, GateResult } from './gates.ts';

export function summarizeGateFailures(report: GateReport): string[] {
  return report.results
    .filter((result) => result.status === 'error')
    .flatMap((result) => {
      const summary = pickGateSummary(result);
      const lines = [`blocked: ${result.label} - ${summary}`];
      const detail = pickDistinctDetail(result, summary);
      const reproduce = result.hints.find((hint) => hint.startsWith('Reproduce with: '));
      if (detail) lines.push(`detail: ${truncate(detail, 104)}`);
      if (reproduce) lines.push(`next: ${reproduce.slice('Reproduce with: '.length)}`);
      return lines;
    })
    .slice(0, 6);
}

export function summarizeFailureAnalysis(analysis: GateFailureAnalysis | null): string[] {
  if (!analysis || analysis.status === 'not-needed') return [];
  if (analysis.status === 'unavailable') {
    return [
      'analysis: unavailable',
      ...(analysis.error ? [`reason: ${truncate(analysis.error, 108)}`] : []),
    ];
  }
  if (analysis.status === 'failed') {
    return [
      'analysis: failed',
      ...(analysis.error ? [`reason: ${truncate(analysis.error, 108)}`] : []),
    ];
  }
  if (!analysis.content) return ['analysis: no content returned'];

  const sections = new Map<string, string[]>();
  let currentSection = '';
  for (const rawLine of analysis.content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line === '```') continue;
    const heading = line.replace(/^#+\s*/, '').replace(/:$/, '').toLowerCase();
    if (
      heading === 'summary' ||
      heading === 'root causes' ||
      heading === 'minimal fixes' ||
      heading === 'next commands'
    ) {
      currentSection = heading;
      if (!sections.has(currentSection)) sections.set(currentSection, []);
      continue;
    }
    if (!currentSection) continue;
    sections.get(currentSection)?.push(stripBullet(line));
  }

  const lines = [
    ...takeSection(sections, 'summary', 'summary', 1),
    ...takeSection(sections, 'root causes', 'cause', 1),
    ...takeSection(sections, 'minimal fixes', 'fix', 2),
    ...takeSection(sections, 'next commands', 'next', 2),
  ];
  if (lines.length > 0) return lines;

  return analysis.content
    .split(/\r?\n/)
    .map((line) => stripBullet(line.trim()))
    .filter(Boolean)
    .slice(0, 4)
    .map((line, index) => `${index === 0 ? 'analysis' : 'detail'}: ${truncate(line, 104)}`);
}

export function summarizeCommitPreview(subject: string, body: string): string[] {
  const bodyLines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);
  return [`commit: ${truncate(subject, 108)}`, ...bodyLines.map((line) => `body: ${truncate(line, 108)}`)];
}

function pickGateSummary(result: GateResult): string {
  return truncate(result.summary || result.signalLines[0] || 'completed', 76);
}

function pickDistinctDetail(result: GateResult, summary: string): string | null {
  const normalizedSummary = normalizeComparisonText(summary);
  for (const signalLine of result.signalLines) {
    if (normalizeComparisonText(signalLine) !== normalizedSummary) {
      return signalLine;
    }
  }
  return null;
}

function takeSection(
  sections: Map<string, string[]>,
  name: string,
  prefix: string,
  limit: number,
): string[] {
  return (sections.get(name) ?? []).slice(0, limit).map((line) => `${prefix}: ${truncate(line, 104)}`);
}

function stripBullet(line: string): string {
  return line.replace(/^[-*]\s+/, '').trim();
}

function normalizeComparisonText(line: string): string {
  return line.trim().replace(/\s+/g, ' ').toLowerCase();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}