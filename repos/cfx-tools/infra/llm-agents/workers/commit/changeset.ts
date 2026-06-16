import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { completeCommitAgent, git } from '../completion/index.ts';
import { root } from '../shared/index.ts';

const VALID_BUMPS = new Set(['patch', 'minor', 'major']);

export async function generateChangesetPlan(scopes, flags) {
  const publishablePackages = await collectPublishablePackages();
  const changedPackages = detectChangedPackages(scopes, publishablePackages);
  const changedChangesets = scopes.flatMap((scope) =>
    scope.files.filter((file) => file.startsWith('.changeset/') && file.endsWith('.md')),
  );

  if (changedPackages.length === 0) {
    return {
      ok: true,
      releaseRelevant: false,
      summary: 'No publishable package changes detected; no changeset needed.',
      packages: [],
      changesets: [],
      changedChangesets,
      risks: [],
    };
  }

  if (changedChangesets.length > 0) {
    return {
      ok: true,
      releaseRelevant: true,
      summary: `Existing changeset file(s) cover this commit: ${changedChangesets.join(', ')}.`,
      packages: changedPackages,
      changesets: [],
      changedChangesets,
      risks: [],
    };
  }

  if (flags.changesetBump === 'none' || flags.skipChangeset) {
    return {
      ok: true,
      releaseRelevant: true,
      summary: 'Publishable package changes detected, but changeset creation was skipped.',
      packages: changedPackages,
      changesets: [],
      changedChangesets,
      risks: ['Release-relevant package changes are being committed without a changeset.'],
    };
  }

  const suggestion = await generateChangesetSuggestion(changedPackages, flags);
  return {
    ok: true,
    releaseRelevant: true,
    summary: suggestion.summary,
    packages: changedPackages,
    changesets: suggestion.changesets,
    changedChangesets,
    risks: suggestion.risks,
  };
}

export async function writeChangesetFile(plan) {
  if (!plan.releaseRelevant || plan.changedChangesets.length > 0 || plan.changesets.length === 0) {
    return [];
  }
  const changesetDir = join(root, '.changeset');
  await mkdir(changesetDir, { recursive: true });
  const pkgNames = plan.changesets.map((entry) => entry.packageName);
  const slug = slugify(pkgNames.join('-'));
  const safeSlug = slug.length > 100 ? `multi-package-${pkgNames.length}-changeset` : slug;
  const filename = `${safeSlug}.md`;
  const relPath = `.changeset/${filename}`;
  const path = join(root, relPath);
  const uniquePath = await nextAvailablePath(path);
  const uniqueRelPath = relative(root, uniquePath);
  await writeFile(uniquePath, renderChangeset(plan.changesets), 'utf8');
  return [uniqueRelPath];
}

async function generateChangesetSuggestion(changedPackages, flags) {
  const diffs = [];
  for (const pkg of changedPackages) {
    const diff = await git(['diff', 'HEAD', '--', pkg.dir]).catch(() => '');
    diffs.push(
      `## ${pkg.name}\n${diff.slice(0, flags.quick ? 3000 : 8000) || '(no tracked diff)'}`,
    );
  }
  const forcedBump = VALID_BUMPS.has(flags.changesetBump) ? flags.changesetBump : null;
  const systemPrompt = [
    'You write npm Changesets for a TypeScript monorepo.',
    'Return strict JSON only, with no markdown fence and no explanatory text.',
    'Schema: {"summary":"one sentence","changesets":[{"packageName":"@scope/name","bump":"patch|minor|major","summary":"release note sentence"}],"risks":["risk or empty"]}.',
    forcedBump
      ? `Use bump "${forcedBump}" for every package unless the diff is clearly non-release metadata.`
      : 'Choose patch for fixes/tooling/internal behavior, minor for new public API, major only for breaking public API.',
    'Do not mention commits, CI job ids, or implementation process. Write end-user package release notes.',
  ].join(' ');
  const userPrompt = [
    `Changed publishable packages: ${changedPackages.map((pkg) => pkg.name).join(', ')}`,
    '',
    'Diff excerpts:',
    diffs.join('\n\n'),
    '',
    'Generate the changeset JSON.',
  ].join('\n');
  const response = await completeCommitAgent({
    action: 'changeset',
    flags,
    systemPrompt,
    userPrompt,
    // maxTokens omitted — resolveMaxTokens uses tokenBudget from config
  });
  try {
    return normalizeChangesetJson(JSON.parse(response.content), changedPackages, forcedBump);
  } catch {
    return fallbackChangesetSuggestion(changedPackages, forcedBump);
  }
}

function normalizeChangesetJson(value, changedPackages, forcedBump) {
  const packageNames = new Set(changedPackages.map((pkg) => pkg.name));
  const changesets = (Array.isArray(value.changesets) ? value.changesets : [])
    .filter((entry) => packageNames.has(entry.packageName))
    .map((entry) => ({
      packageName: entry.packageName,
      bump: forcedBump ?? (VALID_BUMPS.has(entry.bump) ? entry.bump : 'patch'),
      summary: String(entry.summary ?? '').trim() || `Update ${entry.packageName}.`,
    }));
  if (changesets.length === 0) return fallbackChangesetSuggestion(changedPackages, forcedBump);
  return {
    summary:
      String(value.summary ?? '').trim() ||
      `Prepared ${changesets.length} changeset entr${changesets.length === 1 ? 'y' : 'ies'}.`,
    changesets,
    risks: Array.isArray(value.risks) ? value.risks.filter(Boolean).map(String) : [],
  };
}

function fallbackChangesetSuggestion(changedPackages, forcedBump) {
  return {
    summary: `Prepared fallback changesets for ${changedPackages.length} publishable package(s).`,
    changesets: changedPackages.map((pkg) => ({
      packageName: pkg.name,
      bump: forcedBump ?? 'patch',
      summary: `Update ${pkg.name}.`,
    })),
    risks: ['Fallback changeset text used after local LLM returned invalid JSON.'],
  };
}

export async function collectPublishablePackages() {
  const ignored = await readChangesetIgnoredPackages();
  const reposDir = join(root, 'repos');
  const packages = [];
  for (const repoName of await safeReaddir(reposDir)) {
    if (!repoName.startsWith('cfx-')) continue;
    const packagesDir = join(reposDir, repoName, 'packages');
    for (const packageDirName of await safeReaddir(packagesDir)) {
      const dir = `repos/${repoName}/packages/${packageDirName}`;
      const packageJsonPath = join(root, dir, 'package.json');
      if (!existsSync(packageJsonPath)) continue;
      const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
      if (!pkg.name || pkg.private || ignored.has(pkg.name)) continue;
      packages.push({ name: pkg.name, dir });
    }
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

function detectChangedPackages(scopes, packages) {
  const changedFiles = scopes.flatMap((scope) => scope.files);
  return packages.filter((pkg) =>
    changedFiles.some((file) => file === pkg.dir || file.startsWith(`${pkg.dir}/`)),
  );
}

async function readChangesetIgnoredPackages() {
  try {
    const config = JSON.parse(await readFile(join(root, '.changeset', 'config.json'), 'utf8'));
    return new Set(config.ignore ?? []);
  } catch {
    return new Set();
  }
}

async function safeReaddir(path) {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}

function renderChangeset(changesets) {
  return [
    '---',
    ...changesets.map((entry) => `"${entry.packageName}": ${entry.bump}`),
    '---',
    '',
    ...changesets.map((entry) => entry.summary),
    '',
  ].join('\n');
}

function slugify(value) {
  const slug = value
    .replace(/^@/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${slug || 'package-update'}-changeset`;
}

async function nextAvailablePath(path) {
  if (!existsSync(path)) return path;
  const ext = '.md';
  const base = path.slice(0, -ext.length);
  for (let index = 2; index < 100; index++) {
    const candidate = `${base}-${index}${ext}`;
    if (!existsSync(candidate)) return candidate;
  }
  throw new Error(`Unable to allocate changeset path near ${path}`);
}
