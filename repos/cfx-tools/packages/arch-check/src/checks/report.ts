import { type AgentSummary, writeJsonReport, writeMarkdownReport } from '../runtime.js';
import { type ArchCheckResult, runArchCheck } from './arch.js';
import { runCiCheck } from './ci.js';
import { runCorpusCheck } from './corpus.js';
import { runDocsCheck } from './docs.js';
import { type HotspotRecord, runHotspotsCheck } from './hotspots.js';
import { type KebabGroupRecord, runKebabGroupsCheck } from './kebab/groups.js';
import { runSecretsCheck, type SecretScanResult } from './secrets.js';
import { runUnitConfigsCheck, type UnitConfigRecord } from './unit/configs.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckRow = {
  id: string;
  label: string;
  status: 'ok' | 'error';
  findings: number;
  notes: string;
};

export type FullReport = {
  generatedAt: string;
  status: 'ok' | 'error';
  checks: CheckRow[];
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const defaultHotspotOptions = {
  softLimit: 250,
  hardLimit: 300,
  since: '90 days ago',
  failOnHard: false,
  json: false,
} as const;

export async function runFullReport(): Promise<FullReport> {
  const [arch, secrets, hotspots, kebabGroups, unitConfigs, docs, ci, corpus] = await Promise.all([
    runArchCheck(),
    runSecretsCheck(),
    runHotspotsCheck(defaultHotspotOptions),
    runKebabGroupsCheck({ json: false, failOnGroups: false, minGroupSize: 2 }),
    runUnitConfigsCheck({ json: false, write: false, failOnDrift: false }),
    runDocsCheck({ silent: true }),
    runCiCheck({ silent: true }),
    runCorpusCheck({ silent: true }),
  ]);

  const checks: CheckRow[] = [
    buildArchRow(arch),
    buildSecretsRow(secrets),
    {
      id: 'check-hotspots',
      label: 'Hotspots',
      status: hotspots.status,
      findings: hotspots.totals.hardViolations + hotspots.totals.softWarnings,
      notes: `${hotspots.totals.scannedFiles} files — ${hotspots.totals.hardViolations} hard, ${hotspots.totals.softWarnings} soft`,
    },
    {
      id: 'check-kebab-groups',
      label: 'Kebab groups',
      status: kebabGroups.status === 'error' ? 'error' : 'ok',
      findings: kebabGroups.totals.groups,
      notes:
        kebabGroups.totals.groups === 0
          ? 'clean'
          : `${kebabGroups.totals.groups} group(s) across ${kebabGroups.totals.groupedFiles} file(s)`,
    },
    {
      id: 'check-unit-configs',
      label: 'Unit configs',
      status: unitConfigs.status,
      findings: unitConfigs.totals.missing + unitConfigs.totals.drifted,
      notes:
        unitConfigs.status === 'ok'
          ? 'all units configured'
          : `${unitConfigs.totals.missing} missing, ${unitConfigs.totals.drifted} drifted`,
    },
    buildAgentRow('check-docs', 'Docs alignment', docs),
    buildAgentRow('check-ci', 'CI readiness', ci),
    buildCorpusRow(corpus),
  ];

  const status: 'ok' | 'error' = checks.some((c) => c.status === 'error') ? 'error' : 'ok';
  const report: FullReport = { generatedAt: new Date().toISOString(), status, checks };

  const md = renderFullReportMd(
    report,
    arch,
    secrets,
    hotspots.hotspots,
    kebabGroups.groups,
    unitConfigs.units,
  );
  await writeJsonReport('reports/arch-check-report.json', report);
  await writeMarkdownReport('reports/arch-check-report.md', md);

  return report;
}

// ---------------------------------------------------------------------------
// Row builders
// ---------------------------------------------------------------------------

function buildArchRow(result: ArchCheckResult): CheckRow {
  return {
    id: 'arch-check',
    label: 'Architecture',
    status: result.status,
    findings: result.findings.length,
    notes: `${result.packageCount} packages (lifecycle: ${result.lifecycle})`,
  };
}

function buildSecretsRow(result: SecretScanResult): CheckRow {
  return {
    id: 'check-secrets',
    label: 'Secret scan',
    status: result.status,
    findings: result.findings.length,
    notes: result.findings.length === 0 ? 'clean' : `${result.findings.length} finding(s)`,
  };
}

function buildAgentRow(id: string, label: string, result: AgentSummary): CheckRow {
  const count = result.findings ?? 0;
  return {
    id,
    label,
    status: (result.status === 'error' ? 'error' : 'ok') as 'ok' | 'error',
    findings: count,
    notes: count === 0 ? 'clean' : `${count} finding(s) — see ${id}.md`,
  };
}

function buildCorpusRow(result: AgentSummary): CheckRow {
  const files = (result as Record<string, unknown>).files as number | undefined;
  const chunks = (result as Record<string, unknown>).chunks as number | undefined;
  return {
    id: 'check-corpus',
    label: 'Corpus',
    status: (result.status === 'error' ? 'error' : 'ok') as 'ok' | 'error',
    findings: 0,
    notes: `${files ?? 0} files, ${chunks ?? 0} chunks`,
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const statusIcon = (s: 'ok' | 'error'): string => (s === 'ok' ? '✅' : '❌');

function renderFullReportMd(
  report: FullReport,
  arch: ArchCheckResult,
  secrets: SecretScanResult,
  topHotspots: readonly HotspotRecord[],
  topKebabGroups: readonly KebabGroupRecord[],
  unitConfigs: readonly UnitConfigRecord[],
): string {
  const lines: string[] = [
    '# Arch-Check Status Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Overall: ${statusIcon(report.status)} **${report.status.toUpperCase()}**`,
    '',
    '## Check Overview',
    '',
    '| Check | Status | Findings | Notes |',
    '|-------|:------:|:--------:|-------|',
  ];

  for (const row of report.checks) {
    lines.push(
      `| ${row.label} | ${statusIcon(row.status)} | ${row.findings || '—'} | ${row.notes} |`,
    );
  }

  // Mermaid bar chart — findings per check
  const labels = report.checks.map((c) => `"${c.label}"`).join(', ');
  const values = report.checks.map((c) => c.findings).join(', ');

  lines.push(
    '',
    '## Findings by Check',
    '',
    '```mermaid',
    'xychart-beta',
    '    title "Findings by Check"',
    `    x-axis [${labels}]`,
    '    y-axis "Count"',
    `    bar [${values}]`,
    '```',
  );

  // Top arch findings
  const archErrors = arch.findings.filter((f) => f.severity === 'error');
  const archWarnings = arch.findings.filter((f) => f.severity !== 'error');
  if (archErrors.length || archWarnings.length) {
    lines.push('', '## Architecture Findings', '');
    for (const f of archErrors.slice(0, 10)) {
      lines.push(`- ❌ \`${f.file ?? ''}\` [${f.rule ?? 'arch'}] ${f.issue}`);
    }
    for (const f of archWarnings.slice(0, 5)) {
      lines.push(`- ⚠️ \`${f.file ?? ''}\` [${f.rule ?? 'arch'}] ${f.issue}`);
    }
    if (arch.findings.length > 15) {
      lines.push(`- … and ${arch.findings.length - 15} more`);
    }
  }

  // Top secret findings
  if (secrets.findings.length) {
    lines.push('', '## Secret Scan Findings', '');
    for (const f of secrets.findings.slice(0, 10)) {
      lines.push(
        `- ❌ \`${f.file ?? ''}:${f.line ?? ''}\` [${f.rule ?? ''}] ${f.message ?? f.issue}`,
      );
    }
  }

  // Top hotspots (score-ranked, max 10)
  if (topHotspots.length) {
    lines.push('', '## Top Hotspots', '');
    for (const h of topHotspots.slice(0, 10)) {
      const flag = h.overHardLimit ? '❌' : h.overSoftLimit ? '⚠️' : '  ';
      lines.push(
        `- ${flag} \`${h.path}\` — ${h.lines} lines, ${h.commits} commit(s), score ${h.hotspotScore}`,
      );
    }
  }

  if (topKebabGroups.length) {
    lines.push('', '## Kebab Filename Groups', '');
    for (const group of topKebabGroups.slice(0, 10)) {
      lines.push(
        `- ⚠️ \`${group.directory}\` — \`${group.prefix}*${group.extension}\` (${group.count}) → ${group.files.join(', ')}`,
      );
    }
  }

  const actionableUnitConfigs = unitConfigs.filter((unit) => unit.status !== 'ok');
  if (actionableUnitConfigs.length) {
    lines.push('', '## Monorepo Unit Configs', '');
    for (const unit of actionableUnitConfigs.slice(0, 20)) {
      lines.push(`- ❌ \`${unit.unit}\` — ${unit.findings.join('; ')} (${unit.configPath})`);
    }
  }

  lines.push('', '---', '');
  lines.push(
    '_Full per-check reports: `artifacts/llm/reports/docs-alignment.md`, `code-hotspots.md`, `kebab-groups.md`_',
  );

  return `${lines.join('\n')}\n`;
}
