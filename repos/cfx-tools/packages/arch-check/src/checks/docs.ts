import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import {
  type AgentSummary,
  collectCorpusFiles,
  docExtensions,
  type Finding,
  findFiles,
  inlineCodePattern,
  markdownLinkPattern,
  printSummary,
  renderFindings,
  root,
  toRel,
  writeJsonReport,
  writeMarkdownReport,
} from '../runtime.js';

export async function runDocsCheck(opts: { silent?: boolean } = {}): Promise<AgentSummary> {
  const markdownFiles = (await collectCorpusFiles()).filter((file) =>
    docExtensions.has(extname(file)),
  );
  const findings: Finding[] = [];
  for (const filePath of markdownFiles) {
    const rel = toRel(filePath);
    const content = await readFile(filePath, 'utf8');
    findings.push(...(await findBrokenPathRefs(rel, content)));
    findings.push(...findCurrentPlannedDrift(rel, content));
  }

  findings.push(...(await checkMoonRegistration()));
  findings.push(...(await checkPackageExports()));

  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    findings,
  };
  await writeJsonReport('reports/docs-alignment.json', report);
  await writeMarkdownReport(
    'reports/docs-alignment.md',
    renderFindings('Documentation Alignment', findings),
  );
  if (!opts.silent) printSummary('check:docs', [report]);
  return { agent: 'docs', status: report.status, findings: findings.length };
}

async function checkMoonRegistration(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const workspace = await readFile(join(root, '.moon', 'workspace.yml'), 'utf8');
  const registered = new Set(
    workspace
      .split('\n')
      .map((line) => line.match(/^\s*-\s+'([^']+)'/)?.[1])
      .filter((path): path is string => Boolean(path)),
  );
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (rel === '.' || (rel.startsWith('repos/cfx-') && rel.split('/').length === 2)) continue;
    if (rel.startsWith('tools/codegen')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8')) as {
      name?: string;
      private?: boolean;
    };
    if (!pkg.name || (pkg.private === true && rel.startsWith('repos/'))) continue;
    try {
      await stat(join(root, rel, 'moon.yml'));
    } catch {
      continue;
    }
    if (!registered.has(rel)) {
      findings.push({
        severity: 'warning',
        file: '.moon/workspace.yml',
        issue: `Moon project missing package path: ${rel}`,
      });
    }
  }
  return findings;
}

async function checkPackageExports(): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (!rel.startsWith('repos/') && !rel.startsWith('projects/examples/packages/')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8')) as {
      exports?: Record<string, unknown>;
    };
    if (!pkg.exports || typeof pkg.exports !== 'object') continue;
    let vite = '';
    try {
      vite = await readFile(join(root, rel, 'vite.config.ts'), 'utf8');
    } catch {
      findings.push({
        severity: 'warning',
        file: rel,
        issue: 'Package has exports but no vite.config.ts found.',
      });
      continue;
    }
    for (const [exportPath, target] of Object.entries(pkg.exports)) {
      const importPath =
        typeof target === 'object' && target ? (target as { import?: unknown }).import : undefined;
      if (typeof importPath !== 'string') continue;
      const entryName = exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '');
      if (
        !vite.includes(entryName) &&
        !vite.includes(importPath.replace(/^\.\/dist\//, '').replace(/\.js$/, ''))
      ) {
        findings.push({
          severity: 'warning',
          file: `${rel}/package.json`,
          issue: `Export ${exportPath} may not be represented in vite lib entries.`,
        });
      }
    }
  }
  return findings;
}

async function findBrokenPathRefs(path: string, content: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const { raw, source } of extractPathRefs(content)) {
    const ref = raw.split('#')[0] ?? '';
    if (!looksLikeLocalPath(ref, source)) continue;
    const candidates = resolveDocRefCandidates(path, ref);
    if (candidates.some((candidate) => !candidate.startsWith(root))) {
      findings.push({
        severity: 'error',
        file: path,
        issue: `Path reference escapes repository: ${raw}`,
      });
      continue;
    }
    let found = false;
    for (const candidate of candidates) {
      try {
        await stat(candidate);
        found = true;
        break;
      } catch {
        // try next candidate
      }
    }
    if (!found)
      findings.push({
        severity: 'warning',
        file: path,
        issue: `Referenced path does not exist: ${raw}`,
      });
  }
  return findings;
}

function extractPathRefs(content: string): { raw: string; source: 'link' | 'code' }[] {
  const refs: { raw: string; source: 'link' | 'code' }[] = [];
  const withoutFencedBlocks = content.replace(/```[\s\S]*?```/g, '');
  for (const match of withoutFencedBlocks.matchAll(markdownLinkPattern))
    refs.push({ raw: (match[1] ?? '').trim(), source: 'link' });
  for (const match of withoutFencedBlocks.matchAll(inlineCodePattern))
    refs.push({ raw: (match[1] ?? '').trim(), source: 'code' });
  return refs;
}

function findCurrentPlannedDrift(path: string, content: string): Finding[] {
  if (
    /planned|target state|future/i.test(content) &&
    !/current|checked-in|present/i.test(content) &&
    path.endsWith('STRUCTURE.md')
  ) {
    return [
      {
        severity: 'warning',
        file: path,
        issue: 'Planned structure language appears without an explicit current-state marker.',
        recommendation: 'Label planned topology separately from checked-in structure.',
      },
    ];
  }
  return [];
}

function looksLikeLocalPath(ref: string, source: 'link' | 'code'): boolean {
  if (!ref || ref.startsWith('http:') || ref.startsWith('https:') || ref.startsWith('mailto:'))
    return false;
  if (ref.startsWith('#') || ref.startsWith('/') || ref.startsWith('@') || ref.includes('@'))
    return false;
  if (ref.includes('*') || /[<>{}\s]/.test(ref)) return false;
  if (source === 'code') {
    return /^(\.\.?\/|\.github\/|\.moon\/|docs\/|infrastructure\/|projects\/|repos\/|scripts\/|README\.md|ARCHITECTURE\.md|CONTRIBUTING\.md|MIGRATION\.md|SECURITY\.md|package\.json|pnpm-workspace\.yaml|biome\.json)/.test(
      ref,
    );
  }
  return /[/.]/.test(ref);
}

function resolveDocRefCandidates(docPath: string, ref: string): string[] {
  const local = resolve(dirname(join(root, docPath)), ref);
  if (ref.startsWith('./') || ref.startsWith('../')) return [local];
  return [local, resolve(root, ref)];
}
