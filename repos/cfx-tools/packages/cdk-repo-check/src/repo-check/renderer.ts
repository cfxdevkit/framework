import type {
  RepoCheckHotspotsResult,
  RepoCheckKebabGroupsResult,
  RepoCheckUnitConfigsResult,
  RepoCheckValidationResult,
  RepoCommandResult,
  RepoStructuredResult,
} from './types.js';

export interface RepoResultRenderer {
  /** Human-readable multi-line string for CLI stdout. */
  renderText(result: RepoStructuredResult): string;
  /** Pretty-printed JSON for `--json` output and programmatic consumers. */
  renderJson(result: RepoStructuredResult): string;
  /** Single-line summary for agent context injection. */
  renderCompact(result: RepoStructuredResult): string;
}

// ─── Type guards ─────────────────────────────────────────────────────────────

function isCommandResult(r: RepoStructuredResult): r is RepoCommandResult {
  return r.command.action === 'command';
}

function isHotspotsResult(r: RepoStructuredResult): r is RepoCheckHotspotsResult {
  return r.command.action === 'check' && r.command.target === 'hotspots';
}

function isKebabGroupsResult(r: RepoStructuredResult): r is RepoCheckKebabGroupsResult {
  return r.command.action === 'check' && r.command.target === 'kebab-groups';
}

function isUnitConfigsResult(r: RepoStructuredResult): r is RepoCheckUnitConfigsResult {
  return r.command.action === 'check' && r.command.target === 'unit-configs';
}

function isValidationResult(r: RepoStructuredResult): r is RepoCheckValidationResult {
  return r.command.action === 'check' && r.command.target === 'validation';
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function statusBadge(status: 'ok' | 'warning' | 'error' | 'skipped'): string {
  if (status === 'ok') return '✓';
  if (status === 'warning') return '⚠';
  if (status === 'skipped') return '–';
  return '✗';
}

// ─── Compact (single-line) ────────────────────────────────────────────────────

function compactSummary(result: RepoStructuredResult): string {
  if (isCommandResult(result)) {
    const ms = result.summary.durationMs;
    const signal = result.result.stdoutTail[0] ?? result.result.stderrTail[0] ?? result.status;
    return `${result.command.target} ${result.status} (${ms}ms): ${signal}`;
  }
  if (isHotspotsResult(result)) {
    return `hotspots ${result.status}: hard ${result.summary.hardViolations}, soft ${result.summary.softWarnings}`;
  }
  if (isKebabGroupsResult(result)) {
    return `kebab-groups ${result.status}: ${result.summary.groups} groups, ${result.summary.groupedFiles} files`;
  }
  if (isUnitConfigsResult(result)) {
    return `unit-configs ${result.status}: ${result.summary.configured}/${result.summary.units} configured`;
  }
  if (isValidationResult(result)) {
    return `validation ${result.status}: ${result.summary.passed} ok, ${result.summary.warnings} warn, ${result.summary.errors} err`;
  }
  return `${(result as RepoStructuredResult).command.target} ${(result as RepoStructuredResult).status}  exit ${(result as RepoStructuredResult).exitCode}`;
}

// ─── Text (multi-line) ────────────────────────────────────────────────────────

function textSummary(result: RepoStructuredResult): string {
  const badge = statusBadge(result.status);
  const lines: string[] = [];

  if (isCommandResult(result)) {
    const ms = result.summary.durationMs;
    lines.push(`${badge} ${result.command.target}  exit ${result.exitCode}  (${ms}ms)`);
    const signals = [...result.result.stdoutTail, ...result.result.stderrTail].slice(0, 8);
    for (const line of signals) lines.push(`  ${line}`);
    return lines.join('\n');
  }

  if (isHotspotsResult(result)) {
    lines.push(`${badge} hotspots  ${result.status}`);
    lines.push(
      `  scanned: ${result.summary.scannedFiles}  hard: ${result.summary.hardViolations}  soft: ${result.summary.softWarnings}`,
    );
    for (const v of result.report.hardViolations.slice(0, 5)) {
      lines.push(`  ! ${v.path} (${v.lines} lines)`);
    }
    return lines.join('\n');
  }

  if (isKebabGroupsResult(result)) {
    lines.push(`${badge} kebab-groups  ${result.status}`);
    lines.push(
      `  scanned: ${result.summary.scannedFiles}  groups: ${result.summary.groups}  files: ${result.summary.groupedFiles}`,
    );
    return lines.join('\n');
  }

  if (isUnitConfigsResult(result)) {
    lines.push(`${badge} unit-configs  ${result.status}`);
    lines.push(
      `  units: ${result.summary.units}  configured: ${result.summary.configured}  missing: ${result.summary.missing}  drifted: ${result.summary.drifted}`,
    );
    for (const u of result.report.units.filter((u) => u.status !== 'ok').slice(0, 5)) {
      lines.push(`  ${u.status === 'missing' ? '?' : '!'} ${u.unit}: ${u.findings.join('; ')}`);
    }
    return lines.join('\n');
  }

  if (isValidationResult(result)) {
    lines.push(`${badge} validation  ${result.status}`);
    for (const step of result.report.steps) {
      const sb = statusBadge(step.status);
      lines.push(`  ${sb} ${step.label.padEnd(18)} ${step.durationMs}ms`);
    }
    return lines.join('\n');
  }

  const r = result as RepoStructuredResult;
  return `${badge} ${r.command.target}  ${r.status}  exit ${r.exitCode}`;
}

// ─── Default renderer ─────────────────────────────────────────────────────────

export const defaultRenderer: RepoResultRenderer = {
  renderText: textSummary,
  renderJson: (result) => JSON.stringify(result, null, 2),
  renderCompact: compactSummary,
};
