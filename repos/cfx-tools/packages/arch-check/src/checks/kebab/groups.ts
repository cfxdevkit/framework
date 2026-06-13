import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { root, toRel } from '../../runtime.js';
import { collectRepoSourceFiles } from '../source-files.js';

const artifactsRoot = join(root, 'artifacts', 'llm', 'reports');

export type KebabGroupOptions = {
  json: boolean;
  failOnGroups: boolean;
  minGroupSize: number;
};

export type KebabGroupRecord = {
  directory: string;
  prefix: string;
  extension: string;
  files: string[];
  count: number;
};

export type KebabGroupReport = {
  generatedAt: string;
  status: 'ok' | 'warning' | 'error';
  policy: {
    source: string;
    minGroupSize: number;
  };
  totals: {
    scannedFiles: number;
    groups: number;
    groupedFiles: number;
  };
  groups: KebabGroupRecord[];
};

export function parseKebabGroupFlags(args: readonly string[]): KebabGroupOptions {
  const parsed: KebabGroupOptions = {
    json: false,
    failOnGroups: false,
    minGroupSize: 2,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--json') parsed.json = true;
    else if (arg === '--fail-on-groups') parsed.failOnGroups = true;
    else if (arg === '--min-group-size') parsed.minGroupSize = Number(args[++index]);
    else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm run check:kebab-groups -- [--json] [--fail-on-groups] [--min-group-size n]',
      );
      process.exit(0);
    }
  }

  if (!Number.isFinite(parsed.minGroupSize) || parsed.minGroupSize < 2) {
    throw new Error('--min-group-size must be a number greater than or equal to 2');
  }

  return parsed;
}

export async function runKebabGroupsCheck(options: KebabGroupOptions): Promise<KebabGroupReport> {
  const files = await collectRepoSourceFiles();
  const relPaths = files.map((file) => toRel(file));
  const groups = findKebabGroupRecords(relPaths, options.minGroupSize);
  const groupedFiles = groups.reduce((total, group) => total + group.count, 0);

  const report: KebabGroupReport = {
    generatedAt: new Date().toISOString(),
    status: groups.length === 0 ? 'ok' : options.failOnGroups ? 'error' : 'warning',
    policy: {
      source: 'repository-policy/kebab-case-sibling-groups',
      minGroupSize: options.minGroupSize,
    },
    totals: {
      scannedFiles: relPaths.length,
      groups: groups.length,
      groupedFiles,
    },
    groups,
  };

  await writeReports(report);
  return report;
}

export function findKebabGroupRecords(
  relPaths: readonly string[],
  minGroupSize = 2,
): KebabGroupRecord[] {
  const groups = new Map<string, KebabGroupRecord>();

  for (const relPath of relPaths) {
    const slash = relPath.lastIndexOf('/');
    const directory = slash >= 0 ? relPath.slice(0, slash) : '.';
    const fileName = slash >= 0 ? relPath.slice(slash + 1) : relPath;
    const extension = extname(fileName);
    const stem = extension ? fileName.slice(0, -extension.length) : fileName;
    const cut = stem.lastIndexOf('-');
    if (cut <= 0 || cut === stem.length - 1) continue;

    const prefix = stem.slice(0, cut);
    const key = `${directory}\u0000${prefix}\u0000${extension}`;
    const current = groups.get(key) ?? {
      directory,
      prefix,
      extension,
      files: [],
      count: 0,
    };
    current.files.push(fileName);
    current.count += 1;
    groups.set(key, current);
  }

  return [...groups.values()]
    .filter((group) => group.count >= minGroupSize)
    .map((group) => ({
      ...group,
      files: [...group.files].sort((left, right) => left.localeCompare(right)),
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.directory.localeCompare(right.directory) ||
        left.prefix.localeCompare(right.prefix),
    );
}

export function renderKebabGroupConsoleReport(report: KebabGroupReport): string {
  const lines = [
    `Kebab filename groups: ${report.status}`,
    `Scanned ${report.totals.scannedFiles} source files; found ${report.totals.groups} grouped kebab-case prefix(es) covering ${report.totals.groupedFiles} file(s).`,
  ];

  if (report.groups.length) {
    lines.push('', 'Grouped siblings:');
    for (const group of report.groups.slice(0, 20)) {
      lines.push(
        `- ${group.directory}: ${group.prefix}*${group.extension} -> ${group.files.join(', ')}`,
      );
    }
  }

  lines.push('', 'Reports: artifacts/llm/reports/kebab-groups.{md,json}');
  return lines.join('\n');
}

async function writeReports(report: KebabGroupReport): Promise<void> {
  await mkdir(artifactsRoot, { recursive: true });
  await writeFile(join(artifactsRoot, 'kebab-groups.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(join(artifactsRoot, 'kebab-groups.md'), renderKebabGroupMarkdownReport(report));
}

function renderKebabGroupMarkdownReport(report: KebabGroupReport): string {
  const lines = [
    '# Kebab Filename Groups',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    '## Summary',
    '',
    `- Scanned files: ${report.totals.scannedFiles}`,
    `- Grouped prefixes: ${report.totals.groups}`,
    `- Grouped files: ${report.totals.groupedFiles}`,
    `- Minimum group size: ${report.policy.minGroupSize}`,
  ];

  if (report.groups.length) {
    lines.push('', '## Grouped Siblings', '');
    for (const group of report.groups) {
      lines.push(
        `- ${group.directory}: ${group.prefix}*${group.extension} (${group.count}) -> ${group.files.join(', ')}`,
      );
    }
  } else {
    lines.push('', 'No grouped kebab-case sibling files detected.');
  }

  return `${lines.join('\n')}\n`;
}
