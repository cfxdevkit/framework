import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { artifactsRoot, root } from '../shared/index.ts';
import { commandBlock, git } from './runner.ts';

export async function buildActionContext(spec, opts: { quick?: boolean } = {}) {
  const files = [];
  for (const file of spec.context ?? []) {
    files.push(await readContextFile(file));
  }
  if (spec.includeChangedFiles) files.push(await changedFilesBlock());
  if (spec.includeGitDiff) files.push(await gitDiffBlock());
  if (spec.includeCommitPreflight) files.push(await commitPreflightBlock());
  files.push(await buildBaseContext(opts));
  return files
    .filter(Boolean)
    .join('\n\n')
    .slice(0, opts.quick ? 12000 : 60000);
}

export async function buildBaseContext(opts: { quick?: boolean } = {}) {
  const files = await Promise.all([
    readContextFile('README.md'),
    readContextFile('ARCHITECTURE.md'),
    readContextFile('docs/llm-automation-agents.md'),
    readContextFile('artifacts/llm/corpus/manifest.json'),
  ]);
  return files
    .filter(Boolean)
    .join('\n\n')
    .slice(0, opts.quick ? 8000 : 30000);
}

export async function readContextFile(path) {
  try {
    const content = await readFile(join(root, path), 'utf8');
    return `--- ${path} ---\n${content.slice(0, 12000)}`;
  } catch {
    return '';
  }
}

export async function changedFilesBlock() {
  const files = await git(['diff', '--name-only']);
  const staged = await git(['diff', '--cached', '--name-only']);
  const untracked = await git(['ls-files', '--others', '--exclude-standard']);
  return `--- changed files ---\n${[files, staged, untracked].join('\n').trim()}`;
}

export async function gitDiffBlock() {
  const stat = await git(['diff', '--stat']);
  const names = await changedFilesBlock();
  const diff = await git(['diff', '--', ':!pnpm-lock.yaml']);
  return `--- git diff stat ---\n${stat}\n\n${names}\n\n--- git diff excerpt ---\n${diff.slice(0, 30000)}`;
}

export async function commitPreflightBlock() {
  const gitnexusEnsure = await commandBlock('gitnexus ensure', 'pnpm', ['run', 'gitnexus:ensure']);
  const blocks = await Promise.all([
    commandBlock('git status --short --branch', 'git', ['status', '--short', '--branch']),
    commandBlock('git diff --stat', 'git', ['diff', '--stat']),
    commandBlock('git diff --cached --stat', 'git', ['diff', '--cached', '--stat']),
    commandBlock('git diff excerpt', 'git', ['diff', '--', ':!pnpm-lock.yaml'], {
      maxChars: 30000,
    }),
    commandBlock(
      'git diff --cached excerpt',
      'git',
      ['diff', '--cached', '--', ':!pnpm-lock.yaml'],
      { maxChars: 18000 },
    ),
    commandBlock(
      'code hotspot scan',
      'pnpm',
      ['exec', 'tsx', join(root, 'repos/cfx-tools/packages/arch-check/src/bin/check-hotspots.ts')],
      { maxChars: 12000 },
    ),
    commandBlock(
      'kebab filename groups',
      'pnpm',
      [
        'exec',
        'tsx',
        join(root, 'repos/cfx-tools/packages/arch-check/src/bin/check-kebab-groups.ts'),
      ],
      { maxChars: 12000 },
    ),
    commandBlock('deterministic repo review', 'pnpm', ['run', 'repo:review'], { maxChars: 12000 }),
    commandBlock(
      'gitnexus detect-changes',
      'pnpm',
      ['exec', 'gitnexus', 'detect-changes', '--repo', 'root'],
      {
        maxChars: 12000,
      },
    ),
    commandBlock(
      'moon changed files',
      'pnpm',
      ['exec', 'moon', 'query', 'changed-files', '--local'],
      { maxChars: 12000 },
    ),
  ]);
  return `--- commit preflight ---\n${[gitnexusEnsure, ...blocks].join('\n\n')}`;
}

export async function writeLlmReport(action, response) {
  const path = join(artifactsRoot, 'reports', `llm-${action}.md`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    [
      `# LLM ${action}`,
      '',
      `Generated: ${response.generatedAt}`,
      `Model: ${response.model}`,
      `Base URL: ${response.baseUrl}`,
      '',
      response.content,
    ].join('\n'),
    'utf8',
  );
}
