// @ts-nocheck
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
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

const flags = parseFlags(process.argv.slice(2));
const report = await buildHotspotReport(flags);
await writeReports(report);

if (flags.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(renderConsoleReport(report));
}

if (flags.failOnHard && report.hardViolations.length > 0) {
  process.exitCode = 1;
}

function parseFlags(args) {
  const parsed = {
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
    else if (arg === '--since') parsed.since = args[++index];
    else if (arg === '--fail-on-hard') parsed.failOnHard = true;
    else if (arg === '--json') parsed.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm run quality:hotspots -- [--json] [--fail-on-hard] [--soft-limit n] [--hard-limit n] [--since date]',
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

async function buildHotspotReport(options) {
  const files = await collectSourceFiles(root);
  const churnByPath = await readRecentChurn(options.since);
  const records = [];

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

async function collectSourceFiles(dir) {
  const files = [];
  await walk(dir, files);
  return files.sort((left, right) => toRel(left).localeCompare(toRel(right)));
}

async function walk(dir, files) {
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

async function readRecentChurn(since) {
  const churn = new Map();
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', `--since=${since}`, '--numstat', '--pretty=format:commit %H', '--'],
      { cwd: root, maxBuffer: 1024 * 1024 * 20 },
    );
    let currentCommit = null;
    const seenInCommit = new Set();
    for (const line of stdout.split('\n')) {
      if (line.startsWith('commit ')) {
        currentCommit = line.slice('commit '.length);
        seenInCommit.clear();
        continue;
      }
      const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
      if (!match) continue;
      const path = match[3];
      if (!sourceExtensions.has(extname(path)) || isGeneratedPath(path)) continue;
      const current = churn.get(path) ?? { added: 0, deleted: 0, commits: 0 };
      current.added += Number(match[1]);
      current.deleted += Number(match[2]);
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

async function writeReports(report) {
  await mkdir(artifactsRoot, { recursive: true });
  await writeFile(
    join(artifactsRoot, 'code-hotspots.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(join(artifactsRoot, 'code-hotspots.md'), renderMarkdownReport(report));
}

function renderConsoleReport(report) {
  const lines = [
    `Code hotspots: ${report.status}`,
    `Scanned ${report.totals.scannedFiles} source files; ${report.totals.hardViolations} hard violation(s), ${report.totals.softWarnings} soft warning(s).`,
  ];
  if (report.hardViolations.length) {
    lines.push('', 'Hard violations:');
    for (const file of report.hardViolations.slice(0, 20)) {
      lines.push(`- ${file.path}: ${file.lines} lines`);
    }
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

function renderMarkdownReport(report) {
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
  lines.push(...renderFileRows(report.hardViolations));
  lines.push('', '## Soft Warnings', '');
  lines.push(...renderFileRows(report.softWarnings));
  lines.push('', '## Top Hotspots', '');
  lines.push(...renderFileRows(report.hotspots));
  return `${lines.join('\n')}\n`;
}

function renderFileRows(files) {
  if (!files.length) return ['No findings.'];
  return files.map(
    (file) =>
      `- ${file.path}: ${file.lines} lines, ${file.commits} commit(s), +${file.addedLines}/-${file.deletedLines}, score ${file.hotspotScore}`,
  );
}

function isGeneratedPath(path) {
  const parts = path.split('/');
  const basename = parts.at(-1) ?? '';
  return (
    parts.some((part) => generatedDirs.has(part)) ||
    generatedFileNames.has(basename) ||
    basename.endsWith('.generated.ts') ||
    basename.endsWith('.generated.js')
  );
}

function toRel(path) {
  return relative(root, path).split('\\').join('/');
}
