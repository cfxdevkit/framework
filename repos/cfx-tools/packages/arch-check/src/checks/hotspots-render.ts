import type { HotspotRecord, HotspotReport } from './hotspots.js';

export function renderMarkdownReport(report: HotspotReport): string {
  const lines = [
    '# Code Hotspots',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `Policy: ${report.policy.source} file budget (${report.policy.softFileLineLimit} soft, ${report.policy.hardFileLineLimit} hard).`,
    `Churn window: ${report.policy.churnWindow}.`,
    '',
    '## Summary',
    '',
    `- Scanned source files: ${report.totals.scannedFiles}`,
    `- Hard violations: ${report.totals.hardViolations}`,
    `- Soft warnings: ${report.totals.softWarnings}`,
    '',
    '## Hard Violations',
    '',
  ];
  lines.push(...renderFileRows(report.hardViolations), '', '## Soft Warnings', '');
  lines.push(...renderFileRows(report.softWarnings), '', '## Top Hotspots', '');
  lines.push(...renderFileRows(report.hotspots));

  const scoreChart = renderMermaidScoreChart(report.hotspots);
  const lineChart = renderMermaidLineChart(report.hotspots);
  if (scoreChart) {
    lines.push('', '## Charts', '', '### Hotspot Score (top 10)', '', scoreChart);
  }
  if (lineChart) {
    lines.push('', '### Line Count (top 10)', '', lineChart);
  }

  return `${lines.join('\n')}\n`;
}

function mermaidLabel(path: string): string {
  const label = path.split('/').slice(-2).join('/');
  return `"${label.replaceAll('"', '')}"`;
}

function renderMermaidScoreChart(records: readonly HotspotRecord[]): string {
  const top = records.slice(0, 10);
  if (!top.length) return '';
  const labels = top.map((r) => mermaidLabel(r.path));
  const scores = top.map((r) => r.hotspotScore);
  return [
    '```mermaid',
    'xychart-beta horizontal',
    '    title "Top 10 Hotspot Scores (lines + churn)"',
    `    x-axis [${labels.join(', ')}]`,
    '    y-axis "Score"',
    `    bar [${scores.join(', ')}]`,
    '```',
  ].join('\n');
}

function renderMermaidLineChart(records: readonly HotspotRecord[]): string {
  const top = [...records]
    .sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path))
    .slice(0, 10);
  if (!top.length) return '';
  const labels = top.map((r) => mermaidLabel(r.path));
  const lineCounts = top.map((r) => r.lines);
  return [
    '```mermaid',
    'xychart-beta horizontal',
    '    title "Top 10 Files by Line Count"',
    `    x-axis [${labels.join(', ')}]`,
    '    y-axis "Lines"',
    `    bar [${lineCounts.join(', ')}]`,
    '```',
  ].join('\n');
}

function renderFileRows(files: readonly HotspotRecord[]): string[] {
  if (!files.length) return ['No findings.'];
  return files.map(
    (file) =>
      `- ${file.path}: ${file.lines} lines, ${file.commits} commit(s), +${file.addedLines}/-${file.deletedLines}, score ${file.hotspotScore}`,
  );
}
