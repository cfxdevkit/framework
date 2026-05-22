import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { writeJsonReport, writeMarkdownReport } from '../runtime.js';
import { buildMonorepoUnitConfig, listMonorepoUnits, type MonorepoUnit } from './monorepo-units.js';

const validModes = new Set(['deterministic', 'exploratory']);
const validProviderStrategies = new Set(['auto', 'gateway', 'direct']);

export type UnitConfigOptions = {
  json: boolean;
  write: boolean;
  failOnDrift: boolean;
};

export type UnitConfigRecord = {
  unit: string;
  rootDir: string;
  configPath: string;
  status: 'ok' | 'missing' | 'drift';
  findings: string[];
};

export type UnitConfigReport = {
  generatedAt: string;
  status: 'ok' | 'error';
  policy: {
    source: string;
  };
  totals: {
    units: number;
    configured: number;
    missing: number;
    drifted: number;
    written: number;
  };
  units: UnitConfigRecord[];
};

export function parseUnitConfigFlags(args: readonly string[]): UnitConfigOptions {
  const parsed: UnitConfigOptions = {
    json: false,
    write: false,
    failOnDrift: false,
  };

  for (const arg of args) {
    if (arg === '--json') parsed.json = true;
    else if (arg === '--write') parsed.write = true;
    else if (arg === '--fail-on-drift') parsed.failOnDrift = true;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm run check:unit-configs -- [--json] [--write] [--fail-on-drift]');
      process.exit(0);
    }
  }

  return parsed;
}

export async function runUnitConfigsCheck(options: UnitConfigOptions): Promise<UnitConfigReport> {
  const units = listMonorepoUnits();
  const records: UnitConfigRecord[] = [];
  let configured = 0;
  let missing = 0;
  let drifted = 0;
  let written = 0;

  for (const unit of units) {
    const existing = await readUnitConfigIfExists(unit.configPath);
    const findings = validateUnitConfig(unit, existing);
    const currentStatus: UnitConfigRecord['status'] =
      existing === null ? 'missing' : findings.length > 0 ? 'drift' : 'ok';

    if (currentStatus === 'ok') configured += 1;
    if (currentStatus === 'missing') missing += 1;
    if (currentStatus === 'drift') drifted += 1;

    if (options.write && currentStatus !== 'ok') {
      await mkdir(dirname(unit.configPath), { recursive: true });
      await writeFile(
        unit.configPath,
        `${JSON.stringify(mergeUnitConfig(unit, existing), null, 2)}\n`,
        'utf8',
      );
      written += 1;
      configured += 1;
      if (currentStatus === 'missing') missing -= 1;
      if (currentStatus === 'drift') drifted -= 1;
      records.push({
        unit: unit.name,
        rootDir: unit.rootDir,
        configPath: unit.relativeConfigPath,
        status: 'ok',
        findings: [],
      });
      continue;
    }

    records.push({
      unit: unit.name,
      rootDir: unit.rootDir,
      configPath: unit.relativeConfigPath,
      status: currentStatus,
      findings,
    });
  }

  const report: UnitConfigReport = {
    generatedAt: new Date().toISOString(),
    status: missing > 0 || drifted > 0 ? 'error' : 'ok',
    policy: {
      source: 'repository-policy/monorepo-unit-configs',
    },
    totals: {
      units: units.length,
      configured,
      missing,
      drifted,
      written,
    },
    units: records,
  };

  await writeJsonReport('reports/unit-configs.json', report);
  await writeMarkdownReport('reports/unit-configs.md', renderUnitConfigMarkdownReport(report));

  return report;
}

export function renderUnitConfigConsoleReport(report: UnitConfigReport): string {
  const lines = [
    `Monorepo unit configs: ${report.status}`,
    `Checked ${report.totals.units} unit config(s); ${report.totals.missing} missing, ${report.totals.drifted} drifted, ${report.totals.written} written.`,
  ];

  const actionable = report.units.filter((unit) => unit.status !== 'ok');
  if (actionable.length > 0) {
    lines.push('', 'Actionable units:');
    for (const unit of actionable) {
      lines.push(`- ${unit.unit}: ${unit.findings.join('; ')}`);
    }
  }

  lines.push('', 'Reports: artifacts/llm/reports/unit-configs.{md,json}');
  return lines.join('\n');
}

function renderUnitConfigMarkdownReport(report: UnitConfigReport): string {
  const lines = [
    '# Monorepo Unit Configs',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    '## Summary',
    '',
    `- Units: ${report.totals.units}`,
    `- Configured: ${report.totals.configured}`,
    `- Missing: ${report.totals.missing}`,
    `- Drifted: ${report.totals.drifted}`,
    `- Written: ${report.totals.written}`,
  ];

  const actionable = report.units.filter((unit) => unit.status !== 'ok');
  if (actionable.length > 0) {
    lines.push('', '## Missing Or Drifted Units', '');
    for (const unit of actionable) {
      lines.push(
        `- ${unit.unit} (${unit.rootDir}) -> ${unit.configPath}: ${unit.findings.join('; ')}`,
      );
    }
  } else {
    lines.push('', 'All monorepo units have valid config overlays.');
  }

  return `${lines.join('\n')}\n`;
}

function validateUnitConfig(unit: MonorepoUnit, rawConfig: unknown): string[] {
  if (rawConfig === null) return ['config file missing'];
  if (!isRecord(rawConfig)) return ['config is not a JSON object'];

  const findings: string[] = [];
  const metadata = isRecord(rawConfig.unit) ? rawConfig.unit : null;
  if (!metadata) {
    findings.push('unit metadata missing');
  } else {
    if (metadata.name !== unit.name) findings.push(`unit.name should be ${unit.name}`);
    if (metadata.rootDir !== unit.rootDir) findings.push(`unit.rootDir should be ${unit.rootDir}`);
    if (metadata.description !== unit.description)
      findings.push('unit.description does not match registry');
    if (metadata.focus !== unit.focus) findings.push('unit.focus does not match registry');
  }

  const harness = isRecord(rawConfig.harness) ? rawConfig.harness : null;
  if (!harness) {
    findings.push('harness config missing');
    return findings;
  }
  if (!validModes.has(String(harness.defaultMode ?? ''))) {
    findings.push('harness.defaultMode must be deterministic or exploratory');
  }
  if (!validProviderStrategies.has(String(harness.providerStrategy ?? ''))) {
    findings.push('harness.providerStrategy must be auto, gateway, or direct');
  }

  return findings;
}

function mergeUnitConfig(unit: MonorepoUnit, rawConfig: unknown) {
  const expected = buildMonorepoUnitConfig(unit);
  const base = isRecord(rawConfig) ? rawConfig : {};
  const baseHarness = isRecord(base.harness) ? base.harness : {};

  return {
    ...base,
    unit: expected.unit,
    harness: {
      defaultMode: validModes.has(String(baseHarness.defaultMode ?? ''))
        ? baseHarness.defaultMode
        : expected.harness.defaultMode,
      providerStrategy: validProviderStrategies.has(String(baseHarness.providerStrategy ?? ''))
        ? baseHarness.providerStrategy
        : expected.harness.providerStrategy,
      ...baseHarness,
    },
  };
}

async function readUnitConfigIfExists(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
