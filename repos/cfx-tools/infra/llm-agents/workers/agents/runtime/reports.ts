import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { artifactsRoot } from './constants.ts';

export async function writeJsonl(path, records) {
  await writeArtifact(
    path,
    records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : ''),
  );
}

export async function writeJsonReport(path, value) {
  await writeArtifact(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeMarkdownReport(path, content) {
  await writeArtifact(path, content.endsWith('\n') ? content : `${content}\n`);
}

export async function writeArtifact(path, content) {
  const abs = join(artifactsRoot, path);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
}

export async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(join(artifactsRoot, path), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function readJsonlIfExists(path) {
  try {
    return (await readFile(join(artifactsRoot, path), 'utf8'))
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

export function renderFindings(title, findings) {
  const lines = [`# ${title}`, '', `Generated: ${new Date().toISOString()}`, ''];
  if (!findings.length) {
    lines.push('No findings.');
  } else {
    for (const finding of findings) {
      lines.push(
        `- ${finding.severity ?? 'info'}: ${finding.file ? `${finding.file}: ` : ''}${finding.issue}`,
      );
      if (finding.recommendation) lines.push(`  Recommendation: ${finding.recommendation}`);
    }
  }
  return lines.join('\n');
}

export function renderReview(report) {
  const lines = ['# LLM Review Agent Report', '', `Generated: ${report.generatedAt}`, ''];
  if (report.executionContext) {
    lines.push('## Execution Context', '');
    lines.push(...renderExecutionContext(report.executionContext), '');
  }
  lines.push('## Changed Files', '');
  lines.push(
    ...(report.changedFiles.length
      ? report.changedFiles.map((file) => `- ${file}`)
      : ['No uncommitted changes detected.']),
  );
  lines.push('', '## Findings', '');
  lines.push(
    report.findings.length
      ? renderFindings('', report.findings).split('\n').slice(3).join('\n')
      : 'No findings.',
  );
  lines.push('', '## Code Hotspots', '');
  lines.push(
    `Status: ${report.codeHotspots.status}; ${report.codeHotspots.hardViolations} hard violation(s), ${report.codeHotspots.softWarnings} soft warning(s).`,
  );
  lines.push(`Report: ${report.codeHotspots.report}`);
  lines.push('', '## Suggested Validation', '');
  lines.push(...report.suggestedValidation.map((command) => `- ${command}`));
  return lines.join('\n');
}

export function renderEval(report) {
  return [
    '# LLM Eval Agent Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `Docs alignment: ${report.checks.docsAlignment}`,
    `CI/CD readiness: ${report.checks.ciCdReadiness}`,
    `Fine tuning: ${report.checks.fineTuning}`,
    '',
    renderFindings('Findings', report.findings),
  ].join('\n');
}

export function renderServeCheck(report) {
  const lines = [
    '# LLM Provider Check',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    `Base URL: ${report.baseUrl}`,
    `Latency: ${report.latencyMs} ms`,
    `Models: ${report.models.length}`,
    '',
    '## Models',
    '',
  ];
  if (report.models.length) {
    for (const model of report.models) {
      lines.push(`- ${model.id ?? model.checkpoint}${model.size ? ` (${model.size} GB)` : ''}`);
      if (model.labels?.length) lines.push(`  Labels: ${model.labels.join(', ')}`);
    }
  } else {
    lines.push('No models discovered.');
  }
  lines.push('', '## Attempts', '');
  for (const attempt of report.attempts) {
    lines.push(
      `- ${attempt.ok ? 'ok' : 'failed'} ${attempt.url}${attempt.status ? ` (${attempt.status})` : ''}${attempt.modelCount ? `, ${attempt.modelCount} model(s)` : ''}`,
    );
    if (attempt.error) lines.push(`  Error: ${attempt.error}`);
  }
  return lines.join('\n');
}

export function renderAgentRun(report) {
  const lines = ['# LLM Agent Run', '', `Generated: ${report.generatedAt}`, ''];
  if (report.executionContext) {
    lines.push('## Execution Context', '', ...renderExecutionContext(report.executionContext), '');
  }
  lines.push(...report.results.map((result) => `- ${result.agent}: ${result.status}`));
  return lines.join('\n');
}

export function printSummary(label, results) {
  console.log(`${label} complete`);
  for (const result of results) {
    if (isRecord(result.executionContext)) {
      for (const line of renderExecutionContext(result.executionContext)) {
        console.log(line);
      }
    }
    console.log(JSON.stringify(result));
  }
}

function renderExecutionContext(context) {
  const unit = context.unit
    ? `${context.unit.name} (${context.unit.rootDir})`
    : 'shared repo config';
  const llm =
    context.llm?.status === 'not-used'
      ? 'not used'
      : context.llm?.status === 'ready'
        ? `${context.llm.provider} :: ${context.llm.model ?? 'auto'}${context.llm.baseUrl ? ` @ ${context.llm.baseUrl}` : ''}`
        : `unavailable${context.llm?.error ? ` (${context.llm.error})` : ''}`;

  return [
    `- Unit: ${unit}`,
    `- Config: ${context.llm?.configPath ?? 'artifacts/llm/config/llm.json'}`,
    `- LLM: ${llm}`,
  ];
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
