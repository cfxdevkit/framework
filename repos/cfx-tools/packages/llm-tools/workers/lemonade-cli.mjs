#!/usr/bin/env node
import { execFile, spawn } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const root = process.cwd();
const artifactsRoot = join(root, 'artifacts', 'llm');
const configPath = join(artifactsRoot, 'config', 'lemonade.json');
const defaultBaseUrls = [
  'http://localhost:13305/',
  'http://127.0.0.1:13305/',
  'http://host.docker.internal:13305/',
  'http://host.containers.internal:13305/',
  'http://127.0.0.1:8000/',
];
const modelPaths = ['/api/v1/models', '/v1/models', '/models'];
const chatPaths = ['/api/v1/chat/completions', '/v1/chat/completions', '/chat/completions'];
const repoActions = {
  'docs-upkeep': {
    title: 'Documentation Upkeep',
    defaultPrompt:
      'Review documentation alignment warnings and recommend the smallest repo doc updates. Keep findings first. Focus on docs that should live in the codebase, stale structure notes, missing API docs, and package README gaps.',
    context: [
      'artifacts/llm/reports/docs-alignment.md',
      'docs/README.md',
      'docs/llm-fine-tuning-plan.md',
    ],
  },
  'test-audit': {
    title: 'Test and Precheck Coverage Audit',
    defaultPrompt:
      'Assess whether the changed code has meaningful tests and prechecks. Recommend the smallest additional test, lint, typecheck, build, security, GitNexus, or Moon validation that would catch important regressions as the codebase grows. Do not invent coverage that is not visible in context.',
    context: [
      'package.json',
      '.moon/workspace.yml',
      '.moon/tasks/node.yml',
      'artifacts/llm/reports/review.md',
      'artifacts/llm/reports/eval.md',
      'CONTRIBUTING.md',
    ],
    includeChangedFiles: true,
    includeGitDiff: true,
  },
  'repo-health': {
    title: 'Repository Health',
    defaultPrompt:
      'Summarize repository health for a human maintainer. Focus on documentation drift, missing automation, validation blind spots, dependency or package-boundary risk, and which local LLM commands should be run next.',
    context: [
      'README.md',
      'ARCHITECTURE.md',
      'artifacts/llm/reports/docs-alignment.md',
      'artifacts/llm/reports/review.md',
      'artifacts/llm/reports/eval.md',
      'SECURITY-FINDINGS.md',
    ],
    includeChangedFiles: true,
  },
  review: {
    title: 'Code Review',
    defaultPrompt:
      'Review the current git changes. Prioritize bugs, security risks, missing validation, and regressions.',
    context: ['artifacts/llm/reports/review.md', 'SECURITY.md', 'CONTRIBUTING.md'],
    includeGitDiff: true,
  },
  plan: {
    title: 'Implementation Planning',
    defaultPrompt:
      'Create a repo-aware implementation plan. Respect current repos/cfx-* structure and avoid fine-tuning steps unless asked.',
    context: [
      'docs/llm-fine-tuning-plan.md',
      'docs/llm-automation-agents.md',
      'README.md',
      'ARCHITECTURE.md',
    ],
  },
  architecture: {
    title: 'Architecture Q&A',
    defaultPrompt:
      'Answer using the current repository architecture and package boundaries. Call out planned topology separately.',
    context: ['ARCHITECTURE.md', 'README.md', 'docs/architecture/package-layout.md'],
  },
  validation: {
    title: 'Validation Selection',
    defaultPrompt:
      'Given the changed files and repository scripts, choose the minimum useful validation commands and explain why.',
    context: ['package.json', 'artifacts/llm/reports/review.md'],
    includeChangedFiles: true,
  },
  commit: {
    title: 'Commit Preparation',
    defaultPrompt: [
      'Analyze the current repository state and prepare a clean commit summary.',
      'Return these sections: Commit message, Commit body, Change comment, Cleanliness checks, Risks, Recommended commands.',
      'Use imperative mood for the commit message, keep the subject under 72 characters, and do not claim a commit was created.',
      'Call out generated/artifact files, unrelated worktree changes, missing validation, GitNexus impact, and Moon changed-file signals.',
    ].join(' '),
    context: ['artifacts/llm/reports/review.md', 'CONTRIBUTING.md', 'SECURITY.md'],
    includeCommitPreflight: true,
  },
};

const QUALITY_GATES = [
  {
    id: 'lint',
    label: 'Lint',
    cmd: 'pnpm',
    args: ['run', 'lint'],
    required: true,
    timeoutMs: 120000,
  },
  {
    id: 'typecheck',
    label: 'Typecheck',
    cmd: 'pnpm',
    args: ['run', 'typecheck'],
    required: true,
    timeoutMs: 180000,
  },
  {
    id: 'build',
    label: 'Build',
    cmd: 'pnpm',
    args: ['exec', 'moon', 'run', ':build', '--concurrency', '4'],
    required: false,
    timeoutMs: 300000,
  },
  {
    id: 'test',
    label: 'Test',
    cmd: 'pnpm',
    args: ['exec', 'moon', 'run', ':test', '--concurrency', '4'],
    required: false,
    timeoutMs: 600000,
  },
];

const rawArgs = process.argv.slice(2);
if (rawArgs[0] === '--') rawArgs.shift();
const [command = 'help', ...args] = rawArgs;

try {
  if (command === 'models') await listModels();
  else if (command === 'config') await configure(args);
  else if (command === 'ask') await ask(args);
  else if (command === 'commit') await runCommit(args);
  else if (command === 'docs-upkeep') await runDocsUpkeep(args);
  else if (command === 'run') await runAction(args);
  else if (command === 'actions') listActions();
  else help();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

async function listModels() {
  const client = await createClient();
  const { models, attempts } = await discoverModels(client.baseUrls, { includeAttempts: true });
  const chosen = chooseModel(models, (await readConfig()).defaultModel);
  console.log(`Lemonade base URL: ${client.baseUrl}`);
  console.log(`Discovered models: ${models.length}`);
  if (!models.length) {
    console.log('Model discovery attempts:');
    for (const attempt of attempts) {
      const detail =
        attempt.error ??
        `HTTP ${attempt.status}${attempt.modelCount ? `, ${attempt.modelCount} model(s)` : ''}`;
      console.log(`- ${attempt.url}: ${detail}`);
    }
  }
  for (const model of models) {
    const marker = model.id === chosen?.id ? '*' : ' ';
    const labels = model.labels?.length ? ` [${model.labels.join(', ')}]` : '';
    const size = typeof model.size === 'number' ? ` ${model.size}GB` : '';
    console.log(`${marker} ${model.id ?? model.checkpoint}${size}${labels}`);
  }
}

async function configure(args) {
  const [subcommand, key, ...rest] = args;
  const config = await readConfig();
  if (!subcommand || subcommand === 'show') {
    console.log(JSON.stringify(config, null, 2));
    return;
  }
  if (subcommand === 'reset') {
    await writeConfig(defaultConfig());
    console.log(`Reset ${relativeConfigPath()}`);
    return;
  }
  if (subcommand !== 'set') {
    throw new Error('Usage: pnpm run llm:config -- set <base-url|default-model|action> ...');
  }
  if (key === 'base-url') {
    config.baseUrl = rest[0];
  } else if (key === 'default-model') {
    config.defaultModel = rest[0];
  } else if (key === 'action') {
    const [action, model] = rest;
    assertAction(action);
    config.actions[action] = model;
  } else {
    throw new Error('Config keys: base-url, default-model, action');
  }
  await writeConfig(config);
  console.log(`Updated ${relativeConfigPath()}`);
}

async function ask(args) {
  const { prompt, model, quick } = parsePromptAndFlags(args);
  if (!prompt) throw new Error('Usage: pnpm run llm:ask -- "your repo question"');
  const response = await complete({
    action: 'ask',
    modelOverride: model,
    userPrompt: prompt,
    context: await buildBaseContext({ quick }),
    quick,
  });
  await writeLlmReport('ask', response);
  console.log(response.content);
}

async function runAction(args) {
  if (args[0] === '--') args.shift();
  const [action, ...rest] = args;
  assertAction(action);
  const { prompt, model, quick } = parsePromptAndFlags(rest);
  const spec = repoActions[action];
  const context = await buildActionContext(spec, { quick });
  const response = await complete({
    action,
    modelOverride: model,
    userPrompt: prompt || spec.defaultPrompt,
    context,
    quick,
  });
  await writeLlmReport(action, response);
  console.log(response.content);
}

async function runDocsUpkeep(args) {
  if (args[0] === '--') args.shift();
  const flags = parseDocsUpkeepFlags(args);
  const total = 4;

  logStep(1, total, 'Deterministic docs scan');
  const docsScan = await commandBlock('deterministic docs alignment', 'pnpm', ['run', 'llm:docs'], {
    timeoutMs: 120000,
    maxChars: 20000,
  });
  logInfo('  ✓ docs alignment artifacts refreshed');

  logStep(2, total, 'Discovering documentation folders');
  const scopes = await discoverDocsUpkeepScopes(flags);
  if (scopes.length === 0) {
    logInfo('  No documentation folders matched.');
    return;
  }
  logInfo(`  ${scopes.length} folder scope(s): ${scopes.map((scope) => scope.label).join(', ')}`);

  logStep(3, total, 'Generating folder artifacts');
  const baseContext = await buildDocsUpkeepBaseContext(docsScan, flags);
  const results = [];
  for (const scope of scopes) {
    logInfo(`  → ${scope.label}  (${scope.files.length} file(s))`);
    try {
      const result = await generateDocsUpkeepArtifact(scope, baseContext, flags);
      await writeDocsUpkeepScopeArtifact(scope, result);
      logInfo(`    ✓ ${result.summary}`);
      results.push({ scope, ...result, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logInfo(`    ✗ ${message}`);
      results.push({ scope, summary: '', artifact: '', followups: [], ok: false, error: message });
    }
  }

  logStep(4, total, 'Writing docs upkeep index');
  const indexPath = await writeDocsUpkeepIndex(results, flags);
  logInfo(`  report: ${indexPath}`);
}

async function runCommit(args) {
  if (args[0] === '--') args.shift();
  const flags = parseCommitFlags(args);
  const total = 8;

  // ── Phase 1: Quality gates ────────────────────────────────────────────────
  logStep(1, total, 'Quality gates');
  const gatesPassed = await runQualityGates(flags);
  if (!gatesPassed && !flags.force) {
    logInfo('\n  Commit aborted due to quality gate failures. Use --force to bypass.');
    process.exit(1);
  }
  if (!gatesPassed && flags.force) {
    logInfo('  ⚠ --force: proceeding despite gate failures');
  }

  // ── Phase 2: Preflight ────────────────────────────────────────────────────
  logStep(2, total, 'Preflight checks');
  logInfo('  Ensuring GitNexus is registered...');
  await commandBlock('gitnexus ensure', 'pnpm', ['run', 'gitnexus:ensure'], { timeoutMs: 60000 });
  logInfo('  Collecting git status, diff, review, and analysis signals...');
  const preflightCtx = await commitPreflightBlock();
  logInfo('  ✓ preflight complete');

  // ── Phase 3: Detect changed scopes ───────────────────────────────────────
  logStep(3, total, 'Detecting changed scopes');
  const scopes = await detectChangedScopes();
  if (scopes.length === 0) {
    logInfo('  Nothing to commit (working tree clean).');
    return;
  }
  const initialFiles = unique(scopes.flatMap((scope) => scope.files));
  logInfo(`  ${scopes.length} scope(s): ${scopes.map((s) => s.label).join(', ')}`);

  // ── Phase 4: Per-scope changelog generation (serial) ─────────────────────
  logStep(
    4,
    total,
    `Generating changelog entries  [${flags.agent}, serial, ${scopes.length} scope(s)]`,
  );
  const changelogResults = [];
  for (const scope of scopes) {
    logInfo(`  → ${scope.label}  (${scope.files.length} file(s))`);
    try {
      const analysis = await generateChangelogEntry(scope, flags);
      logInfo(`    ✓ ${analysis.summary}`);
      changelogResults.push({ scope, ...analysis, ok: true });
    } catch (error) {
      logInfo(`    ✗ ${error.message}`);
      changelogResults.push({
        scope,
        entry: null,
        summary: '',
        risks: [],
        ok: false,
        error: String(error.message),
      });
    }
  }

  // ── Phase 5: Commit message ───────────────────────────────────────────────
  logStep(5, total, `Generating commit message  [${flags.agent}]`);
  const { response: commitResponse, commit } = await generateCommitMessage(
    preflightCtx,
    changelogResults,
    flags,
  );
  const { subject, body } = commit;
  logInfo(`  subject: ${subject}`);
  await writeCommitReport(commitResponse, changelogResults);
  logInfo('  report: artifacts/llm/reports/lemonade-commit.md');

  // ── Phase 6: Approval ─────────────────────────────────────────────────────
  logStep(6, total, 'Approval');
  printProposedCommit(subject, body);
  if (flags.dryRun) {
    logInfo('  --dry-run: skipping changelog writes, post-generation checks, staging, and commit');
    return;
  }
  if (!flags.yes) {
    const confirmed = await confirmPrompt('Write changelogs and commit? [Y/n] ');
    if (!confirmed) {
      logInfo('  Aborted.');
      return;
    }
  }

  // ── Phase 7: Write generated files and re-check ───────────────────────────
  logStep(7, total, 'Writing generated files and post-checks');
  const generatedFiles = [];
  for (const result of changelogResults.filter((item) => item.ok && item.entry)) {
    await appendToChangelog(result.scope, result.entry);
    generatedFiles.push(result.scope.changelogPath);
    logInfo(`  ✓ ${result.scope.changelogPath} updated`);
  }
  if (!flags.skipPostChecks) {
    const postChecksPassed = await runQualityGates({
      ...flags,
      withBuild: false,
      withTests: false,
    });
    if (!postChecksPassed && !flags.force) {
      logInfo('\n  Commit aborted due to post-generation check failures. Use --force to bypass.');
      process.exit(1);
    }
  } else {
    logInfo('  --skip-post-checks: skipping post-generation validation');
  }

  // ── Phase 8: Commit ───────────────────────────────────────────────────────
  logStep(8, total, 'Committing');
  const filesToStage = await resolveFilesToStage(initialFiles, generatedFiles, commit.filesToStage);
  await assertNoUnexpectedChanges(filesToStage);
  const sha = await executeCommit(subject, body, filesToStage);
  logInfo(`  ✓ Committed: ${sha}`);
}

function listActions() {
  for (const [name, spec] of Object.entries(repoActions)) {
    console.log(`${name}: ${spec.title}`);
  }
}

// ─── Docs upkeep pipeline ────────────────────────────────────────────────────

function parseDocsUpkeepFlags(args) {
  const promptParts = [];
  const scopes = [];
  let model = null;
  let quick = false;
  let includePackageDocs = false;
  let maxFolders = Number.POSITIVE_INFINITY;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') model = args[++index];
    else if (arg === '--quick') quick = true;
    else if (arg === '--include-package-docs') includePackageDocs = true;
    else if (arg === '--scope') scopes.push(args[++index]);
    else if (arg === '--max-folders') maxFolders = Number(args[++index]);
    else promptParts.push(arg);
  }
  return {
    prompt: promptParts.join(' ').trim(),
    model,
    quick,
    includePackageDocs,
    scopes: scopes.filter(Boolean),
    maxFolders:
      Number.isFinite(maxFolders) && maxFolders > 0 ? maxFolders : Number.POSITIVE_INFINITY,
  };
}

async function discoverDocsUpkeepScopes(flags) {
  const files = await collectDocsUpkeepFiles(flags.includePackageDocs);
  const scopeFilters = flags.scopes.map(normalizeScopeFilter);
  const groups = new Map();
  for (const file of files) {
    if (scopeFilters.length && !scopeFilters.some((scope) => file.startsWith(scope))) continue;
    const dir = dirname(file) === '.' ? 'root' : dirname(file);
    if (!groups.has(dir)) groups.set(dir, { label: dir, dir, files: [] });
    groups.get(dir).files.push(file);
  }
  return [...groups.values()]
    .map((scope) => ({ ...scope, files: scope.files.sort() }))
    .sort((left, right) => left.label.localeCompare(right.label))
    .slice(0, flags.maxFolders);
}

async function collectDocsUpkeepFiles(includePackageDocs) {
  const files = [];
  await walkDocsFiles(join(root, 'docs'), files, (file) => file.endsWith('.md'));
  if (includePackageDocs) {
    for (const base of ['.', 'infrastructure', 'projects', 'repos', 'tools']) {
      await walkDocsFiles(join(root, base), files, (file) =>
        /(^|\/)(README|API|STRUCTURE)\.md$/.test(file),
      );
    }
  }
  return unique(files.map((file) => file.replace(`${root}/`, ''))).filter(
    (file) => !file.startsWith('artifacts/') && !file.includes('/node_modules/'),
  );
}

async function walkDocsFiles(dir, files, predicate) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (['artifacts', 'dist', 'node_modules', 'coverage'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkDocsFiles(path, files, predicate);
    if (entry.isFile() && predicate(path)) files.push(path);
  }
}

function normalizeScopeFilter(scope) {
  return scope.replace(/^\.\//, '').replace(/\/$/, '');
}

async function buildDocsUpkeepBaseContext(docsScan, flags) {
  const files = await Promise.all([
    readContextFile('README.md'),
    readContextFile('ARCHITECTURE.md'),
    readContextFile('docs/README.md'),
    readContextFile('docs/STRUCTURE.md'),
    readContextFile('artifacts/llm/reports/docs-alignment.md'),
  ]);
  return [docsScan, ...files]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, flags.quick ? 8000 : 20000);
}

async function generateDocsUpkeepArtifact(scope, baseContext, flags) {
  const folderContext = await buildDocsFolderContext(scope, flags.quick ? 20000 : 36000);
  const retryFolderContext = await buildDocsFolderContext(scope, flags.quick ? 12000 : 24000);
  const prompt = [
    flags.prompt || repoActions['docs-upkeep'].defaultPrompt,
    '',
    `Folder scope: ${scope.label}`,
    `Files: ${scope.files.join(', ')}`,
    '',
    'Repository docs context:',
    baseContext,
    '',
    'Folder contents:',
    folderContext,
  ].join('\n');
  const response = await completeDocsUpkeepArtifact({
    flags,
    userPrompt: prompt,
    maxTokens: flags.quick ? 1600 : 2600,
  });
  try {
    return validateDocsUpkeepJson(response.content, scope.label);
  } catch {
    const retryPrompt = [
      flags.prompt || repoActions['docs-upkeep'].defaultPrompt,
      '',
      `Folder scope: ${scope.label}`,
      `Existing files: ${scope.files.join(', ')}`,
      '',
      'Write a concise artifact. Keep each artifactLines item short. Do not include nested JSON, markdown fences, or raw multiline strings.',
      '',
      'Repository docs context:',
      baseContext.slice(0, flags.quick ? 5000 : 12000),
      '',
      'Folder contents:',
      retryFolderContext,
    ].join('\n');
    const retryResponse = await completeDocsUpkeepArtifact({
      flags,
      userPrompt: retryPrompt,
      maxTokens: flags.quick ? 1200 : 2000,
    });
    return validateDocsUpkeepJson(retryResponse.content, scope.label);
  }
}

async function completeDocsUpkeepArtifact({ flags, userPrompt, maxTokens }) {
  return completeDirect({
    action: 'docs-upkeep',
    modelOverride: flags.model,
    systemPrompt: [
      'You are a documentation maintainer for a TypeScript monorepo.',
      'Return strict JSON only, with no markdown fence and no explanatory text.',
      'Use artifactLines and followups arrays so each markdown line or action item is a separate JSON string.',
      'The Files list is authoritative: do not recommend creating a file that is already listed there.',
    ].join(' '),
    userPrompt: [
      'Schema: {"summary":"one sentence","artifactLines":["markdown line"],"followups":["action item"]}.',
      'The artifact should be a practical folder-level upkeep note with sections: Current State, Drift or Gaps, Recommended Edits, Validation.',
      'Prefer concrete file-specific edits. Do not invent checked-in files or claim edits were applied.',
      'If a file is listed in the folder scope, treat it as existing even if its contents are truncated.',
      userPrompt,
    ].join('\n'),
    maxTokens,
  });
}

async function buildDocsFolderContext(scope, maxChars) {
  const parts = [];
  for (const file of scope.files) {
    try {
      const info = await stat(join(root, file));
      if (info.size > 256 * 1024) continue;
      const content = await readFile(join(root, file), 'utf8');
      parts.push(`--- ${file} ---\n${content.slice(0, 12000)}`);
    } catch {
      // skip files that disappeared during the run
    }
  }
  return parts.join('\n\n').slice(0, maxChars);
}

function validateDocsUpkeepJson(content, scopeLabel) {
  const parsed = parseJsonObject(content);
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new Error(`Invalid docs-upkeep JSON for ${scopeLabel}: missing summary`);
  }
  const artifact = Array.isArray(parsed.artifactLines)
    ? parsed.artifactLines.filter((line) => typeof line === 'string').join('\n')
    : parsed.artifact;
  if (typeof artifact !== 'string' || !artifact.trim()) {
    throw new Error(`Invalid docs-upkeep JSON for ${scopeLabel}: missing artifactLines`);
  }
  return {
    summary: parsed.summary.trim(),
    artifact: artifact.trim(),
    followups: Array.isArray(parsed.followups)
      ? parsed.followups
          .filter((followup) => typeof followup === 'string' && followup.trim())
          .map((followup) => followup.trim())
      : [],
  };
}

async function writeDocsUpkeepScopeArtifact(scope, result) {
  const filePath = join(artifactsRoot, 'reports', 'docs-upkeep', `${artifactSlug(scope.label)}.md`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    [
      `# Docs upkeep: ${scope.label}`,
      '',
      `Generated: ${new Date().toISOString()}`,
      `Files: ${scope.files.join(', ')}`,
      '',
      result.artifact,
      '',
      '## Follow-ups',
      '',
      ...(result.followups.length ? result.followups.map((item) => `- ${item}`) : ['- None.']),
      '',
    ].join('\n'),
    'utf8',
  );
}

async function writeDocsUpkeepIndex(results, flags) {
  const path = join(artifactsRoot, 'reports', 'docs-upkeep.md');
  const lines = [
    '# Documentation Upkeep',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${flags.quick ? 'quick' : 'full'}`,
    `Included package docs: ${flags.includePackageDocs ? 'yes' : 'no'}`,
    '',
    '## Folder Results',
    '',
  ];
  for (const result of results) {
    const artifact = `artifacts/llm/reports/docs-upkeep/${artifactSlug(result.scope.label)}.md`;
    lines.push(
      `- ${result.ok ? 'ok' : 'error'} ${result.scope.label}: ${result.ok ? result.summary : result.error}`,
      `  - Artifact: ${artifact}`,
    );
  }
  const followups = results.flatMap((result) =>
    result.ok ? result.followups.map((item) => ({ scope: result.scope.label, item })) : [],
  );
  lines.push('', '## Consolidated Follow-ups', '');
  if (followups.length === 0) lines.push('- None.');
  else for (const followup of followups) lines.push(`- ${followup.scope}: ${followup.item}`);
  lines.push('');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, lines.join('\n'), 'utf8');
  return 'artifacts/llm/reports/docs-upkeep.md';
}

function artifactSlug(label) {
  return (
    label
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'root'
  );
}

// ─── Progress helpers ─────────────────────────────────────────────────────────

function logStep(n, total, label) {
  console.log(`\n[${n}/${total}] ${label}`);
}

function logInfo(msg) {
  console.log(msg);
}

// ─── Commit flag parser ───────────────────────────────────────────────────────

function parseCommitFlags(args) {
  const promptParts = [];
  let model = null;
  let quick = false;
  let dryRun = false;
  let yes = false;
  let force = false;
  let skipChecks = false;
  let skipPostChecks = false;
  let withTests = false;
  let withBuild = false;
  let agent = 'direct';
  let piProvider = process.env.PI_PROVIDER ?? null;
  let piModel = process.env.PI_MODEL ?? null;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') model = args[++index];
    else if (arg === '--agent') agent = args[++index];
    else if (arg === '--pi-provider') piProvider = args[++index];
    else if (arg === '--pi-model') piModel = args[++index];
    else if (arg === '--quick') quick = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--yes' || arg === '-y') yes = true;
    else if (arg === '--force' || arg === '-f') force = true;
    else if (arg === '--skip-checks') skipChecks = true;
    else if (arg === '--skip-post-checks') skipPostChecks = true;
    else if (arg === '--with-tests') withTests = true;
    else if (arg === '--with-build') withBuild = true;
    else promptParts.push(arg);
  }
  if (!['direct', 'pi-rpc'].includes(agent)) {
    throw new Error('Commit --agent must be one of: direct, pi-rpc');
  }
  return {
    prompt: promptParts.join(' ').trim(),
    model,
    quick,
    dryRun,
    yes,
    force,
    skipChecks,
    skipPostChecks,
    withTests,
    withBuild,
    agent,
    piProvider,
    piModel,
  };
}

// ─── Quality gates ────────────────────────────────────────────────────────────

async function runQualityGates(flags) {
  if (flags.skipChecks) {
    logInfo('  --skip-checks: skipping all quality gates');
    return true;
  }

  const gates = QUALITY_GATES.filter((g) => {
    if (g.id === 'test') return flags.withTests;
    if (g.id === 'build') return flags.withBuild;
    return true; // lint + typecheck always run
  });

  let allPassed = true;
  for (const gate of gates) {
    process.stdout.write(`  › ${gate.label}...`);
    const start = Date.now();
    try {
      const { stdout, stderr } = await execFileAsync(gate.cmd, gate.args, {
        cwd: root,
        maxBuffer: 1024 * 1024 * 10,
        signal: AbortSignal.timeout(gate.timeoutMs),
        env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false', FORCE_COLOR: '0' },
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const summary = extractGateSummary(stdout + stderr);
      console.log(` ✓  (${elapsed}s)${summary ? `  ${summary}` : ''}`);
    } catch (error) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(` ✗  (${elapsed}s)`);
      const output = [error?.stdout ?? '', error?.stderr ?? error?.message ?? ''].join('\n').trim();
      // Print first 20 lines of error output indented
      const lines = output.split('\n').slice(0, 20);
      for (const line of lines) {
        logInfo(`     ${line}`);
      }
      if (output.split('\n').length > 20) logInfo('     ...[truncated]');
      if (gate.required) allPassed = false;
      else logInfo(`     (non-required gate, continuing)`);
    }
  }
  return allPassed;
}

function extractGateSummary(output) {
  // Moon task summary line: "Tasks: N completed (N cached)"
  const moonMatch = output.match(/Tasks:\s+\d+\s+completed[^\n]*/);
  if (moonMatch) return moonMatch[0].trim();
  // Biome summary: "Checked N files"
  const biomeMatch = output.match(/Checked \d+ files[^\n]*/);
  if (biomeMatch) return biomeMatch[0].trim();
  return '';
}

// ─── Scope detection ──────────────────────────────────────────────────────────

async function detectChangedScopes() {
  const [modified, staged, untracked] = await Promise.all([
    git(['diff', '--name-only']).catch(() => ''),
    git(['diff', '--cached', '--name-only']).catch(() => ''),
    git(['ls-files', '--others', '--exclude-standard']).catch(() => ''),
  ]);
  const untrackedSet = new Set(untracked.split('\n').filter(Boolean));
  const allFiles = new Set([
    ...modified.split('\n').filter(Boolean),
    ...staged.split('\n').filter(Boolean),
    ...untracked.split('\n').filter(Boolean),
  ]);
  const groups = new Map();
  for (const file of allFiles) {
    const scope = resolveScope(file);
    if (!groups.has(scope.key)) {
      groups.set(scope.key, { ...scope, files: [], untrackedSet });
    }
    groups.get(scope.key).files.push(file);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function resolveScope(filepath) {
  const [top, second] = filepath.split('/');
  if ((top === 'repos' || top === 'tools' || top === 'projects') && second) {
    return {
      key: `${top}/${second}`,
      label: `${top}/${second}`,
      changelogPath: `${top}/${second}/CHANGELOG.md`,
      scopeGlob: `${top}/${second}`,
    };
  }
  return { key: 'root', label: 'root', changelogPath: 'CHANGELOG.md', scopeGlob: null };
}

// ─── Per-scope changelog generation ──────────────────────────────────────────

async function generateChangelogEntry(scope, flags) {
  const trackedFiles = scope.files.filter((f) => !scope.untrackedSet.has(f));
  const untrackedFiles = scope.files.filter((f) => scope.untrackedSet.has(f));

  let diff = '';
  if (scope.scopeGlob) {
    diff = await git(['diff', 'HEAD', '--', scope.scopeGlob]).catch(() => '');
  } else if (trackedFiles.length > 0) {
    diff = await git(['diff', 'HEAD', '--', ...trackedFiles]).catch(() => '');
  }

  const diffCtx = [
    diff.slice(0, 14000) || '(no tracked diff)',
    untrackedFiles.length > 0
      ? `New untracked files:\n${untrackedFiles.map((f) => `  + ${f}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const today = new Date().toISOString().slice(0, 10);
  const response = await completeCommitAgent({
    action: 'changelog',
    flags,
    systemPrompt: [
      'You are a changelog writer for a TypeScript monorepo.',
      'Return strict JSON only, with no markdown fence and no explanatory text.',
      'Schema: {"summary":"one sentence","entryLines":["markdown line"],"risks":["risk or empty"]}.',
      'Use entryLines instead of a multiline string so every markdown line is a separate JSON string.',
      'The entryLines must form a Keep-a-Changelog style entry with a date heading and only factual bullets under Added, Changed, Fixed, or Removed.',
    ].join(' '),
    userPrompt: [
      `Scope: ${scope.label}`,
      `Date: ${today}`,
      `Changed files: ${scope.files.join(', ')}`,
      '',
      'Git diff:',
      diffCtx,
      '',
      'Write the JSON changelog analysis for this scope.',
    ].join('\n'),
    maxTokens: flags.quick ? 384 : 800,
  });
  return validateChangelogJson(response.content, scope.label);
}

async function appendToChangelog(scope, entry) {
  const changelogPath = join(root, scope.changelogPath);
  let existing = '';
  try {
    existing = await readFile(changelogPath, 'utf8');
  } catch {
    existing = `# Changelog\n\nAll notable changes to this package are documented here.\n\n`;
  }
  // Insert after the first heading block (# Changelog + optional subtitle lines)
  const headingEnd = existing.search(/\n##\s|\n\n(?!#)/);
  const insertPos = headingEnd > 0 ? headingEnd + 1 : existing.indexOf('\n') + 1;
  const updated = `${existing.slice(0, insertPos)}\n${entry.trim()}\n\n${existing.slice(insertPos)}`;
  await mkdir(dirname(changelogPath), { recursive: true });
  await writeFile(changelogPath, updated, 'utf8');
}

// ─── Commit message generation ────────────────────────────────────────────────

async function generateCommitMessage(preflightCtx, changelogResults, flags) {
  const changelogSummary = changelogResults
    .filter((r) => r.ok && r.entry)
    .map((r) => `### ${r.scope.label}\nSummary: ${r.summary}\n${r.entry}`)
    .join('\n\n');

  const context = [
    preflightCtx,
    changelogResults.length > 0 ? `--- changelog entries generated ---\n${changelogSummary}` : '',
    await readContextFile('CONTRIBUTING.md'),
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, flags.quick ? 12000 : 60000);

  const response = await completeCommitAgent({
    action: 'commit',
    flags,
    systemPrompt: [
      'You prepare commit metadata for a local deterministic git harness.',
      'Return strict JSON only, with no markdown fence and no explanatory text.',
      'Schema: {"subject":"conventional commit subject under 72 chars","bodyLines":["commit body line"],"filesToStage":["optional relative paths"],"risks":["risk or empty"]}.',
      'Use bodyLines instead of a multiline string so every commit body line is a separate JSON string.',
      'The subject must start with one of feat, fix, chore, docs, refactor, test, style, perf, ci, build, or revert.',
      'Do not claim the commit already happened.',
    ].join(' '),
    userPrompt: `${context}\n\nTask:\n${flags.prompt || repoActions.commit.defaultPrompt}`,
    maxTokens: flags.quick ? 512 : 1400,
  });
  return { response, commit: validateCommitJson(response.content) };
}

// ─── Confirmation + commit execution ─────────────────────────────────────────

function printProposedCommit(subject, body) {
  console.log('\n  ┌──────────────────────────────────────────────────────────────');
  console.log(`  │ ${subject}`);
  if (body) {
    console.log('  │');
    for (const line of body.split('\n').slice(0, 20)) {
      console.log(`  │ ${line}`);
    }
  }
  console.log('  └──────────────────────────────────────────────────────────────');
}

async function confirmPrompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n  ${question}`, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() !== 'n');
    });
  });
}

async function executeCommit(subject, body, filesToStage) {
  if (filesToStage.length === 0) throw new Error('No files selected for staging.');
  await execFileAsync('git', ['add', '--', ...filesToStage], { cwd: root });
  const messageArgs = body ? ['-m', subject, '-m', body] : ['-m', subject];
  await execFileAsync('git', ['commit', ...messageArgs], { cwd: root });
  return git(['rev-parse', '--short', 'HEAD']);
}

async function resolveFilesToStage(initialFiles, generatedFiles, modelFiles = []) {
  const requested = [...initialFiles, ...generatedFiles, ...modelFiles];
  const dirty = new Set(await changedFilesList());
  return unique(requested).filter((file) => dirty.has(file));
}

async function assertNoUnexpectedChanges(expectedFiles) {
  const expected = new Set(expectedFiles);
  const dirty = await changedFilesList();
  const unexpected = dirty.filter((file) => !expected.has(file));
  if (unexpected.length > 0) {
    throw new Error(
      [
        'Unexpected working tree changes appeared during commit pipeline:',
        ...unexpected.map((file) => `  - ${file}`),
        'Review them or rerun the command after staging scope is clear.',
      ].join('\n'),
    );
  }
}

async function changedFilesList() {
  const [modified, staged, untracked] = await Promise.all([
    git(['diff', '--name-only']).catch(() => ''),
    git(['diff', '--cached', '--name-only']).catch(() => ''),
    git(['ls-files', '--others', '--exclude-standard']).catch(() => ''),
  ]);
  return unique(
    [modified, staged, untracked].flatMap((value) => value.split('\n').filter(Boolean)),
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

async function writeCommitReport(commitResponse, changelogResults) {
  const changelogSection = changelogResults
    .map((r) =>
      r.ok ? `### ${r.scope.label}\n${r.entry}` : `### ${r.scope.label}\n⚠️ Failed: ${r.error}`,
    )
    .join('\n\n');

  const sections = [
    '# Lemonade commit',
    '',
    `Generated: ${commitResponse.generatedAt}`,
    `Model: ${commitResponse.model}`,
    `Base URL: ${commitResponse.baseUrl}`,
    '',
    '## Commit Analysis',
    '',
    commitResponse.content,
  ];
  if (changelogResults.length > 0) {
    sections.push('', '## Changelog Entries', '', changelogSection);
  }

  const path = join(artifactsRoot, 'reports', 'lemonade-commit.md');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, sections.join('\n'), 'utf8');
}

function validateChangelogJson(content, scopeLabel) {
  const parsed = parseJsonObject(content);
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new Error(`Invalid changelog JSON for ${scopeLabel}: missing summary`);
  }
  const entry = Array.isArray(parsed.entryLines)
    ? parsed.entryLines.filter((line) => typeof line === 'string').join('\n')
    : parsed.entry;
  if (typeof entry !== 'string' || !entry.trim()) {
    throw new Error(`Invalid changelog JSON for ${scopeLabel}: missing entry`);
  }
  return {
    summary: parsed.summary.trim(),
    entry: entry.trim(),
    risks: Array.isArray(parsed.risks)
      ? parsed.risks
          .filter((risk) => typeof risk === 'string' && risk.trim())
          .map((risk) => risk.trim())
      : [],
  };
}

function validateCommitJson(content) {
  const parsed = parseJsonObject(content);
  if (typeof parsed.subject !== 'string') throw new Error('Invalid commit JSON: missing subject');
  const subject = parsed.subject
    .trim()
    .replace(/[`*]+$/g, '')
    .slice(0, 72);
  if (
    !/^(feat|fix|chore|docs|refactor|test|style|perf|ci|build|revert)(\(.+\))?!?:\s/.test(subject)
  ) {
    throw new Error(`Invalid commit subject from LLM: ${subject}`);
  }
  const body = Array.isArray(parsed.bodyLines)
    ? parsed.bodyLines.filter((line) => typeof line === 'string').join('\n')
    : parsed.body;
  return {
    subject,
    body: typeof body === 'string' ? body.trim() : '',
    filesToStage: Array.isArray(parsed.filesToStage)
      ? parsed.filesToStage
          .filter((file) => typeof file === 'string' && file.trim())
          .map((file) => file.trim())
      : [],
    risks: Array.isArray(parsed.risks)
      ? parsed.risks
          .filter((risk) => typeof risk === 'string' && risk.trim())
          .map((risk) => risk.trim())
      : [],
  };
}

function parseJsonObject(content) {
  const text = content.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim();
  const candidate = fenced ?? text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  if (!candidate?.startsWith('{')) {
    throw new Error(`LLM did not return a JSON object: ${text.slice(0, 120)}`);
  }
  return JSON.parse(candidate);
}

async function completeCommitAgent({ action, flags, systemPrompt, userPrompt, maxTokens }) {
  if (flags.agent === 'pi-rpc') {
    return completeWithPiRpc({ action, flags, systemPrompt, userPrompt });
  }
  return completeDirect({
    action,
    modelOverride: flags.model,
    systemPrompt,
    userPrompt,
    maxTokens,
  });
}

async function completeDirect({ action, modelOverride, systemPrompt, userPrompt, maxTokens }) {
  const config = await readConfig();
  const client = await createClient(config);
  const models = await discoverModels(client.baseUrls);
  const modelId =
    modelOverride ?? config.actions?.[action] ?? config.defaultModel ?? chooseModel(models)?.id;
  if (!modelId)
    throw new Error('No Lemonade model available. Run pnpm run llm:models to inspect inventory.');

  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    stream: false,
    max_tokens: maxTokens,
  };

  const attempts = [];
  for (const path of chatPaths) {
    const url = new URL(path, client.baseUrl).toString();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
      const text = await response.text();
      attempts.push({ url, ok: response.ok, status: response.status });
      if (!response.ok) continue;
      return {
        generatedAt: new Date().toISOString(),
        action,
        baseUrl: client.baseUrl,
        model: modelId,
        content: extractAssistantText(text),
        attempts,
      };
    } catch (error) {
      attempts.push({ url, ok: false, error: formatFetchError(error) });
    }
  }
  throw new Error(`Lemonade completion failed: ${JSON.stringify(attempts)}`);
}

async function completeWithPiRpc({ action, flags, systemPrompt, userPrompt }) {
  const piArgs = ['--mode', 'json', '--print', '--no-session', '--no-tools'];
  const piProvider = flags.piProvider ?? 'lemonade';
  let piModel = flags.piModel ?? flags.model;
  if (piProvider === 'lemonade') {
    const lemonadeProvider = await writePiLemonadeProviderExtension(piModel);
    piArgs.push('--extension', lemonadeProvider.extensionPath, '--provider', 'lemonade');
    piModel = lemonadeProvider.modelId;
  } else {
    piArgs.push('--provider', piProvider);
  }
  if (piModel) piArgs.push('--model', piModel);

  const prompt = [
    systemPrompt,
    '',
    'Important: return only the requested strict JSON object. Do not edit files or run commands.',
    '',
    userPrompt,
  ].join('\n');
  piArgs.push(prompt);

  return new Promise((resolve, reject) => {
    const child = spawn('pi', piArgs, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Pi RPC completion timed out'));
    }, 180000);
    let buffer = '';
    let stderr = '';
    let lastAssistantText = '';
    let settled = false;

    function settle(error, response) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(response);
    }

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      while (true) {
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex === -1) break;
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.trim()) continue;
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (event.type === 'message_end' && event.message?.role === 'assistant') {
          lastAssistantText = assistantMessageText(event.message);
        }
        if (event.type === 'agent_end') {
          const finalMessage = [...(event.messages ?? [])]
            .reverse()
            .find((message) => message.role === 'assistant');
          const content = assistantMessageText(finalMessage) || lastAssistantText;
          settle(null, {
            generatedAt: new Date().toISOString(),
            action,
            baseUrl: 'pi-rpc',
            model: piModel ?? 'pi-default',
            content: content.trim(),
            attempts: [{ url: 'pi --mode json --print', ok: true, status: 0 }],
          });
        }
      }
    });

    child.on('error', (error) => {
      settle(
        new Error(
          `Unable to start pi. Install it with: pnpm add -g @mariozechner/pi-coding-agent. ${error.message}`,
        ),
      );
    });
    child.on('exit', (code) => {
      if (!settled && code !== 0) settle(new Error(`Pi RPC exited ${code}: ${stderr.trim()}`));
    });
  });
}

async function writePiLemonadeProviderExtension(preferredModel) {
  const config = await readConfig();
  const client = await createClient(config);
  const models = await discoverModels(client.baseUrls);
  const chosen = chooseModel(models, preferredModel ?? config.defaultModel);
  if (!chosen?.id) {
    throw new Error('No Lemonade model available for Pi provider registration.');
  }
  const providerBaseUrl = new URL('/api/v1', client.baseUrl).toString();
  const extensionPath = join(artifactsRoot, 'config', 'pi-lemonade-provider.mjs');
  const providerModels = models.map((model) => ({
    id: model.id ?? model.checkpoint,
    name: model.id ?? model.checkpoint,
    reasoning: false,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 4096,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    compat: {
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      supportsUsageInStreaming: false,
      maxTokensField: 'max_tokens',
    },
  }));
  const source = [
    'export default function registerLemonadeProvider(pi) {',
    `  pi.registerProvider('lemonade', ${JSON.stringify(
      {
        name: 'Lemonade Server',
        baseUrl: providerBaseUrl,
        apiKey: 'lemonade',
        api: 'openai-completions',
        models: providerModels,
      },
      null,
      2,
    )});`,
    '}',
    '',
  ].join('\n');
  await mkdir(dirname(extensionPath), { recursive: true });
  await writeFile(extensionPath, source, 'utf8');
  return { extensionPath, modelId: chosen.id };
}

function assistantMessageText(message) {
  if (!message?.content) return '';
  if (typeof message.content === 'string') return message.content;
  if (!Array.isArray(message.content)) return '';
  return message.content
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
}

// ─── Complete / LLM call ──────────────────────────────────────────────────────

async function complete({ action, modelOverride, userPrompt, context, quick = false }) {
  const config = await readConfig();
  const client = await createClient(config);
  const models = await discoverModels(client.baseUrls);
  const modelId =
    modelOverride ?? config.actions?.[action] ?? config.defaultModel ?? chooseModel(models)?.id;
  if (!modelId)
    throw new Error('No Lemonade model available. Run pnpm run llm:models to inspect inventory.');

  const messages = [
    {
      role: 'system',
      content: [
        'You are a repository upkeep assistant for the Conflux DevKit monorepo.',
        'Use the supplied repository context as source of truth.',
        'Do not claim fine-tuning has happened. Do not publish, deploy, rotate secrets, or commit changes.',
        'For review-like tasks, put findings first and keep recommendations specific.',
      ].join(' '),
    },
    { role: 'user', content: `${context}\n\nTask:\n${userPrompt}` },
  ];

  const body = {
    model: modelId,
    messages,
    temperature: 0.2,
    stream: false,
    max_tokens: quick ? 256 : 1600,
  };
  const attempts = [];
  for (const path of chatPaths) {
    const url = new URL(path, client.baseUrl).toString();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
      const text = await response.text();
      attempts.push({ url, ok: response.ok, status: response.status });
      if (!response.ok) continue;
      return {
        generatedAt: new Date().toISOString(),
        action,
        baseUrl: client.baseUrl,
        model: modelId,
        content: extractAssistantText(text),
        attempts,
      };
    } catch (error) {
      attempts.push({ url, ok: false, error: String(error) });
    }
  }
  throw new Error(`Lemonade chat completion failed: ${JSON.stringify(attempts)}`);
}

async function createClient(config = null) {
  const cfg = config ?? (await readConfig());
  const baseUrls = cfg.baseUrl
    ? [cfg.baseUrl]
    : process.env.LEMONADE_URL || process.env.LEMONADE_BASE_URL
      ? [process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL]
      : defaultBaseUrls;
  const models = await discoverModels(baseUrls);
  const attempt =
    models.find((model) => model.__baseUrl)?.__baseUrl ?? normalizeBaseUrl(baseUrls[0]);
  return { baseUrl: attempt, baseUrls };
}

async function discoverModels(baseUrls, opts = {}) {
  const attempts = [];
  for (const baseUrl of baseUrls.map(normalizeBaseUrl)) {
    for (const path of modelPaths) {
      const url = new URL(path, baseUrl).toString();
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const text = await response.text();
        const discoveredModels = response.ok ? extractModelInventory(text) : [];
        attempts.push({
          url,
          ok: response.ok,
          status: response.status,
          modelCount: discoveredModels.length,
        });
        if (!response.ok) continue;
        const models = discoveredModels.map((model) => ({
          ...model,
          __baseUrl: baseUrl,
        }));
        if (models.length) return opts.includeAttempts ? { models, attempts } : models;
      } catch (error) {
        attempts.push({ url, ok: false, error: formatFetchError(error) });
        // try next endpoint
      }
    }
  }
  return opts.includeAttempts ? { models: [], attempts } : [];
}

function formatFetchError(error) {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  if (cause && typeof cause === 'object' && 'code' in cause)
    return `${error.message} (${cause.code})`;
  return error.message;
}

function extractModelInventory(text) {
  try {
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
    return data
      .map((model) => ({
        id: typeof model?.id === 'string' ? model.id : undefined,
        checkpoint: typeof model?.checkpoint === 'string' ? model.checkpoint : undefined,
        labels: Array.isArray(model?.labels)
          ? model.labels.filter((label) => typeof label === 'string')
          : [],
        recipe: typeof model?.recipe === 'string' ? model.recipe : undefined,
        size: typeof model?.size === 'number' ? model.size : undefined,
        suggested: model?.suggested === true,
      }))
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}

function chooseModel(models, preferredId) {
  if (preferredId) {
    const preferred = models.find(
      (model) => model.id === preferredId || model.checkpoint === preferredId,
    );
    if (preferred) return preferred;
  }
  return [...models].sort((left, right) => modelScore(right) - modelScore(left))[0];
}

function modelScore(model) {
  const text =
    `${model.id ?? ''} ${model.checkpoint ?? ''} ${(model.labels ?? []).join(' ')}`.toLowerCase();
  let score = 0;
  if (model.suggested) score += 10;
  if (text.includes('coder')) score += 8;
  if (text.includes('coding')) score += 6;
  if (text.includes('tool')) score += 4;
  if (text.includes('qwen')) score += 3;
  if (text.includes('hot')) score += 2;
  return score;
}

function extractAssistantText(text) {
  const parsed = JSON.parse(text);
  const message =
    parsed?.choices?.[0]?.message?.content ?? parsed?.choices?.[0]?.text ?? parsed?.message;
  if (typeof message !== 'string') return text;
  return message.trim();
}

async function buildActionContext(spec, opts = {}) {
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

async function buildBaseContext(opts = {}) {
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

async function readContextFile(path) {
  try {
    const content = await readFile(join(root, path), 'utf8');
    return `--- ${path} ---\n${content.slice(0, 12000)}`;
  } catch {
    return '';
  }
}

async function changedFilesBlock() {
  const files = await git(['diff', '--name-only']);
  const staged = await git(['diff', '--cached', '--name-only']);
  const untracked = await git(['ls-files', '--others', '--exclude-standard']);
  return `--- changed files ---\n${[files, staged, untracked].join('\n').trim()}`;
}

async function gitDiffBlock() {
  const stat = await git(['diff', '--stat']);
  const names = await changedFilesBlock();
  const diff = await git(['diff', '--', ':!pnpm-lock.yaml']);
  return `--- git diff stat ---\n${stat}\n\n${names}\n\n--- git diff excerpt ---\n${diff.slice(0, 30000)}`;
}

async function commitPreflightBlock() {
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
    commandBlock('deterministic llm review', 'pnpm', ['run', 'llm:review'], { maxChars: 12000 }),
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

async function commandBlock(title, command, args, opts = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: root,
      maxBuffer: 1024 * 1024 * 10,
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30000),
      env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false' },
    });
    return renderCommandBlock(title, 0, stdout, stderr, opts.maxChars);
  } catch (error) {
    return renderCommandBlock(
      title,
      error?.code ?? 1,
      error?.stdout ?? '',
      error?.stderr ?? error?.message ?? '',
      opts.maxChars,
    );
  }
}

function renderCommandBlock(title, exitCode, stdout, stderr, maxChars = 8000) {
  const output = [stdout, stderr].filter(Boolean).join('\n').trim();
  const truncated =
    output.length > maxChars ? `${output.slice(0, maxChars)}\n...[truncated]` : output;
  return [`## ${title}`, `exitCode: ${exitCode}`, truncated || '(no output)'].join('\n');
}

async function git(args) {
  const { stdout } = await execFileAsync('git', args, { cwd: root, maxBuffer: 1024 * 1024 * 10 });
  return stdout.trim();
}

async function readConfig() {
  try {
    return { ...defaultConfig(), ...JSON.parse(await readFile(configPath, 'utf8')) };
  } catch (error) {
    if (error?.code === 'ENOENT') return defaultConfig();
    throw error;
  }
}

async function writeConfig(config) {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function defaultConfig() {
  return { baseUrl: null, defaultModel: null, actions: {} };
}

async function writeLlmReport(action, response) {
  const path = join(artifactsRoot, 'reports', `lemonade-${action}.md`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    [
      `# Lemonade ${action}`,
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

function parsePromptAndFlags(args) {
  const promptParts = [];
  let model = null;
  let quick = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') {
      model = args[++index];
    } else if (arg === '--quick') {
      quick = true;
    } else {
      promptParts.push(arg);
    }
  }
  return { prompt: promptParts.join(' ').trim(), model, quick };
}

function assertAction(action) {
  if (!repoActions[action]) {
    throw new Error(`Unknown action "${action}". Run pnpm run llm:actions to list actions.`);
  }
}

function normalizeBaseUrl(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function relativeConfigPath() {
  return 'artifacts/llm/config/lemonade.json';
}

function help() {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  models                         List auto-discovered Lemonade models
  actions                        List repo-specific actions
  config show                    Show local Lemonade CLI config
  config set base-url <url>      Pin Lemonade base URL
  config set default-model <id>  Pin default model id
  config set action <name> <id>  Pin model for one repo action
  ask [--quick] "question"       Ask a repo-aware question
  docs-upkeep [flags] [prompt]   Refresh docs checks and generate folder-by-folder upkeep artifacts
    --scope <path>               Limit to one docs folder prefix; repeatable
    --max-folders <n>            Limit folder count for bounded local runs
    --include-package-docs       Also scan README/API/STRUCTURE files outside docs/
    --quick                      Shorter per-folder artifact generation
    --model <id>                 Override LLM model
  commit [flags] [prompt]        Full commit pipeline:
                                   1. Quality gates (lint, typecheck; opt-in: build, tests)
                                   2. Preflight (gitnexus + git + review)
                                   3. Detect changed scopes
                                   4. Generate structured changelog JSON per scope (serial)
                                   5. Generate structured commit JSON
                                   6. Confirm proposed commit
                                   7. Write changelogs + re-run lint/typecheck
                                   8. Stage explicit file list + commit
    --dry-run                    Show what would happen; skip writes and commit
    --yes / -y                   Skip confirmation prompt
    --force / -f                 Commit even if quality gates fail
    --skip-checks                Skip all quality gates (Phase 1)
    --skip-post-checks           Skip post-generation lint/typecheck after changelog writes
    --with-build                 Also run Moon build in quality gates
    --with-tests                 Also run Moon test suite in quality gates
    --agent <direct|pi-rpc>       Use direct Lemonade calls or Pi RPC for agent steps
    --pi-provider <name>          Pi provider to use with --agent pi-rpc
    --pi-model <id>               Pi model to use with --agent pi-rpc
    --quick                      Short LLM calls (faster, less detail)
    --model <id>                 Override LLM model
  run <action> [--quick] [prompt] Run docs-upkeep, test-audit, repo-health, review, plan, architecture, validation

Examples:
  pnpm run llm:models
  pnpm run llm:config -- set default-model Qwen3-Coder-Next-GGUF
  pnpm run llm:commit
  pnpm run llm:commit -- --dry-run
  pnpm run llm:commit -- --yes
  pnpm run llm:commit -- --agent pi-rpc --pi-provider lemonade --pi-model Qwen3-Coder-Next-GGUF
  pnpm run llm:action -- review
  pnpm run llm:docs-upkeep -- --quick
  pnpm run llm:docs-upkeep -- --scope docs/architecture --max-folders 1
  pnpm run llm:test-audit
  pnpm run llm:ask -- --quick "Where should a docs alignment scanner live?"
`);
}
