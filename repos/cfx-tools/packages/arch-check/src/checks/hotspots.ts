import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { promisify } from 'node:util';
import { root } from '../runtime.js';
import { renderMarkdownReport } from './hotspots-render.js';
import {
  collectRepoSourceFiles,
  countFileLines,
  isGeneratedRepoSourcePath,
  repoSourceExtensions,
} from './source-files.js';

const execFileAsync = promisify(execFile);
const artifactsRoot = join(root, 'artifacts', 'llm', 'reports');
const defaultSoftLimit = 250;
const defaultHardLimit = 300;
const defaultSince = '90 days ago';

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
  const files = await collectRepoSourceFiles(root);
  const churnByPath = await readRecentChurn(options.since);
  const records: HotspotRecord[] = [];

  for (const filePath of files) {
    const rel = toRel(filePath);
    const content = await readFile(filePath, 'utf8');
    const lineCount = countFileLines(content);
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
      if (!repoSourceExtensions.has(extname(path)) || isGeneratedRepoSourcePath(path)) continue;
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
      `- ${file.path}: ${file.lines} lines, ${file.commits} commit(s), score ${file.hotspotScore}`,
    );
  }
  return lines.join('\n');
}

function toRel(path: string): string {
  return relative(root, path).split('\\').join('/');
}
