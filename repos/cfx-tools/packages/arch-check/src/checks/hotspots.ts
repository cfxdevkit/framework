import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { promisify } from 'node:util';
import { root } from '../runtime.js';

const execFileAsync = promisify(execFile);
const artifactsRoot = join(root, 'artifacts', 'llm', 'reports');
const defaultSoftLimit = 250;
const defaultHardLimit = 300;
const defaultSince = '90 days ago';
const generatedDirs = new Set(
  '.git .gitnexus .moon .pnpm-store .tmp .vite .vitest .cfxdevkit artifacts build coverage dist node_modules out'.split(
    ' ',
  ),
);
const generatedFileNames = new Set('generated.ts generated.js'.split(' '));
const sourceExtensions = new Set('.cjs .css .js .jsx .mjs .mts .sol .ts .tsx'.split(' '));

export type HotspotOptions = {
  softLimit: number;
  hardLimit: number;
  since: string;
  failOnHard: boolean;
  json: boolean;
};

type Churn = { added: number; deleted: number; commits: number };
export type HotspotRecord = Churn & {
  path: string;
  lines: number;
  addedLines: number;
  deletedLines: number;
  hotspotScore: number;
  overSoftLimit: boolean;
  overHardLimit: boolean;
};

export type HotspotReport = {
  generatedAt: string;
  status: 'ok' | 'error';
  policy: {
    source: string;
    softFileLineLimit: number;
    hardFileLineLimit: number;
    churnWindow: string;
  };
  totals: { scannedFiles: number; softWarnings: number; hardViolations: number };
  hardViolations: HotspotRecord[];
  softWarnings: HotspotRecord[];
  hotspots: HotspotRecord[];
};

export function parseHotspotFlags(args: readonly string[]): HotspotOptions {
  const parsed: HotspotOptions = {
    softLimit: defaultSoftLimit,
    hardLimit: defaultHardLimit,
    since: defaultSince,
    failOnHard: false,
    json: false,
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--soft-limit') parsed.softLimit = Number(args[++index]);
    else if (arg === '--hard-limit') parsed.hardLimit = Number(args[++index]);
    else if (arg === '--since') parsed.since = String(args[++index]);
    else if (arg === '--fail-on-hard') parsed.failOnHard = true;
    else if (arg === '--json') parsed.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm run check:hotspots -- [--json] [--fail-on-hard] [--soft-limit n] [--hard-limit n] [--since date]',
      );
      process.exit(0);
    }
  }
  if (!Number.isFinite(parsed.softLimit) || parsed.softLimit <= 0) {
    throw new Error('--soft-limit must be a positive number');
  }
  if (!Number.isFinite(parsed.hardLimit) || parsed.hardLimit <= 0) {
    throw new Error('--hard-limit must be a positive number');
  }
  if (parsed.softLimit > parsed.hardLimit) {
    throw new Error('--soft-limit must be less than or equal to --hard-limit');
  }
  return parsed;
}

export async function runHotspotsCheck(options: HotspotOptions): Promise<HotspotReport> {
  const report = await buildHotspotReport(options);
  await writeReports(report);
  return report;
}

async function buildHotspotReport(options: HotspotOptions): Promise<HotspotReport> {
  const files = await collectSourceFiles(root);
  const churnByPath = await readRecentChurn(options.since);
  const records: HotspotRecord[] = [];

  for (const filePath of files) {
    const rel = toRel(filePath);
    const content = await readFile(filePath, 'utf8');
    const lineCount = content ? content.split('\n').length - (content.endsWith('\n') ? 1 : 0) : 0;
    const churn = churnByPath.get(rel) ?? { added: 0, deleted: 0, commits: 0 };
    const churnLines = churn.added + churn.deleted;
    const score = lineCount + churnLines * 2 + churn.commits * 25;
    records.push({
      path: rel,
      lines: lineCount,
      added: churn.added,
      deleted: churn.deleted,
      addedLines: churn.added,
      deletedLines: churn.deleted,
      commits: churn.commits,
      hotspotScore: score,
      overSoftLimit: lineCount > options.softLimit,
      overHardLimit: lineCount > options.hardLimit,
    });
  }

  records.sort(
    (left, right) => right.hotspotScore - left.hotspotScore || left.path.localeCompare(right.path),
  );
  const hardViolations = records.filter((record) => record.overHardLimit);
  const softWarnings = records.filter((record) => record.overSoftLimit && !record.overHardLimit);
  return {
    generatedAt: new Date().toISOString(),
    status: hardViolations.length ? 'error' : 'ok',
    policy: {
      source: 'docs/architecture/framework-design-principles.md',
      softFileLineLimit: options.softLimit,
      hardFileLineLimit: options.hardLimit,
      churnWindow: options.since,
    },
    totals: {
      scannedFiles: records.length,
      softWarnings: softWarnings.length,
      hardViolations: hardViolations.length,
    },
    hardViolations,
    softWarnings,
    hotspots: records.slice(0, 25),
  };
}

async function collectSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  await walk(dir, files);
  return files.sort((left, right) => toRel(left).localeCompare(toRel(right)));
}

async function walk(dir: string, files: string[]): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.github' && entry.name !== '.moon') continue;
    if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, files);
      continue;
    }
    if (
      entry.isFile() &&
      sourceExtensions.has(extname(entry.name)) &&
      !isGeneratedPath(toRel(path))
    ) {
      files.push(path);
    }
  }
}

async function readRecentChurn(since: string): Promise<Map<string, Churn>> {
  const churn = new Map<string, Churn>();
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', `--since=${since}`, '--numstat', '--pretty=format:commit %H', '--'],
      { cwd: root, maxBuffer: 1024 * 1024 * 20 },
    );
    let currentCommit: string | null = null;
    const seenInCommit = new Set<string>();
    for (const line of stdout.split('\n')) {
      if (line.startsWith('commit ')) {
        currentCommit = line.slice('commit '.length);
        seenInCommit.clear();
        continue;
      }
      const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
      if (!match) continue;
      const path = match[3] ?? '';
      if (!sourceExtensions.has(extname(path)) || isGeneratedPath(path)) continue;
      const current = churn.get(path) ?? { added: 0, deleted: 0, commits: 0 };
      current.added += Number(match[1] ?? 0);
      current.deleted += Number(match[2] ?? 0);
      const key = `${currentCommit}:${path}`;
      if (!seenInCommit.has(key)) {
        current.commits += 1;
        seenInCommit.add(key);
      }
      churn.set(path, current);
    }
  } catch {
    return churn;
  }
  return churn;
}

async function writeReports(report: HotspotReport): Promise<void> {
  await mkdir(artifactsRoot, { recursive: true });
  await writeFile(
    join(artifactsRoot, 'code-hotspots.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(join(artifactsRoot, 'code-hotspots.md'), renderMarkdownReport(report));
}

export function renderConsoleReport(report: HotspotReport): string {
  const lines = [
    `Code hotspots: ${report.status}`,
    `Scanned ${report.totals.scannedFiles} source files; ${report.totals.hardViolations} hard violation(s), ${report.totals.softWarnings} soft warning(s).`,
  ];
  if (report.hardViolations.length) {
    lines.push('', 'Hard violations:');
    for (const file of report.hardViolations.slice(0, 20))
      lines.push(`- ${file.path}: ${file.lines} lines`);
  }
  lines.push('', 'Top hotspots:');
  for (const file of report.hotspots.slice(0, 10)) {
    lines.push(
      `- ${file.path}: ${file.lines} lines, ${file.commits} commit(s), +${file.addedLines}/-${file.deletedLines}, score ${file.hotspotScore}`,
    );
  }
  lines.push('', 'Reports: artifacts/llm/reports/code-hotspots.{md,json}');
  return lines.join('\n');
}

function renderMarkdownReport(report: HotspotReport): string {
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
  return `${lines.join('\n')}\n`;
}

function renderFileRows(files: readonly HotspotRecord[]): string[] {
  if (!files.length) return ['No findings.'];
  return files.map(
    (file) =>
      `- ${file.path}: ${file.lines} lines, ${file.commits} commit(s), +${file.addedLines}/-${file.deletedLines}, score ${file.hotspotScore}`,
  );
}

function isGeneratedPath(path: string): boolean {
  const parts = path.split('/');
  const basename = parts.at(-1) ?? '';
  return (
    parts.some((part) => generatedDirs.has(part)) ||
    generatedFileNames.has(basename) ||
    basename.endsWith('.generated.ts') ||
    basename.endsWith('.generated.js')
  );
}

function toRel(path: string): string {
  return relative(root, path).split('\\').join('/');
}
