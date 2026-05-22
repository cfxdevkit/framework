import {
  type AgentSummary,
  type Finding,
  printSummary,
  readJsonIfExists,
  renderFindings,
  writeJsonReport,
  writeMarkdownReport,
} from '../runtime.js';

type StatusReport = { status?: string };
type ModelInventory = {
  id?: string;
  checkpoint?: string;
  labels: string[];
  recipe?: string;
  size?: number;
};

export async function runEvalCheck(opts: { silent?: boolean } = {}): Promise<AgentSummary> {
  const docsReport = await readJsonIfExists<StatusReport>('reports/docs-alignment.json');
  const ciCdReport = await readJsonIfExists<StatusReport>('reports/ci-cd.json');
  const findings: Finding[] = [];
  if (!docsReport) {
    findings.push({
      severity: 'warning',
      issue: 'docs check has not run',
      recommendation: 'Run pnpm run check:docs.',
    });
  } else if (docsReport.status !== 'ok') {
    findings.push({
      severity: 'error',
      issue: 'documentation alignment failed',
      recommendation: 'Review artifacts/llm/reports/docs-alignment.md.',
    });
  }
  if (!ciCdReport) {
    findings.push({
      severity: 'warning',
      issue: 'CI/CD readiness check has not run',
      recommendation: 'Run pnpm run check:ci.',
    });
  } else if (ciCdReport.status !== 'ok') {
    findings.push({
      severity: 'error',
      issue: 'CI/CD readiness checks failed',
      recommendation: 'Review artifacts/llm/reports/ci-cd.md.',
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    checks: {
      docsAlignment: docsReport?.status ?? 'missing',
      ciCdReadiness: ciCdReport?.status ?? 'missing',
      fineTuning: false,
    },
    findings,
  };
  await writeJsonReport('reports/eval.json', report);
  await writeMarkdownReport('reports/eval.md', renderEval(report));
  if (!opts.silent) printSummary('check:eval', [report]);
  return { agent: 'eval', status: report.status, findings: findings.length };
}

export async function runServeCheck(opts: { silent?: boolean } = {}): Promise<AgentSummary> {
  const configuredBaseUrl =
    process.env.LITELLM_BASE_URL ?? process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL;
  const baseUrls = configuredBaseUrl
    ? [configuredBaseUrl]
    : [
        'http://localhost:13305/',
        'http://127.0.0.1:13305/',
        'http://host.docker.internal:13305/',
        'http://host.containers.internal:13305/',
        'http://127.0.0.1:8000/',
      ];
  const fallbackBaseUrl = baseUrls[0] ?? 'http://localhost:13305/';
  const started = performance.now();
  const attempts = [];
  let discoveredBaseUrl: string | null = null;
  let models: ModelInventory[] = [];
  for (const baseUrl of baseUrls) {
    for (const path of ['/api/v1/models', '/v1/models', '/models']) {
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
          bodyPreview: text.slice(0, 500),
        });
        if (response.ok) {
          discoveredBaseUrl = baseUrl;
          models = discoveredModels;
          break;
        }
      } catch (error) {
        attempts.push({ url, ok: false, error: String(error) });
      }
    }
    if (discoveredBaseUrl) break;
  }
  const report = {
    generatedAt: new Date().toISOString(),
    status: discoveredBaseUrl ? 'ok' : 'unavailable',
    baseUrl: discoveredBaseUrl ?? fallbackBaseUrl,
    latencyMs: Math.round(performance.now() - started),
    models,
    attempts,
  };
  await writeJsonReport('reports/serve-check.json', report);
  await writeMarkdownReport('reports/serve-check.md', renderServeCheck(report));
  if (!opts.silent) printSummary('check:serve-check', [report]);
  return { agent: 'serve-check', status: report.status };
}

function renderEval(report: {
  generatedAt: string;
  status: string;
  checks: Record<string, unknown>;
  findings: Finding[];
}): string {
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

function extractModelInventory(text: string): ModelInventory[] {
  try {
    const parsed = JSON.parse(text) as unknown;
    const data = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed && Array.isArray((parsed as { data?: unknown }).data)
        ? (parsed as { data: unknown[] }).data
        : [];
    return data
      .map((model) => {
        const value = typeof model === 'object' && model ? (model as Record<string, unknown>) : {};
        const inventory: ModelInventory = { labels: [] };
        if (typeof value.id === 'string') inventory.id = value.id;
        if (typeof value.checkpoint === 'string') inventory.checkpoint = value.checkpoint;
        if (typeof value.recipe === 'string') inventory.recipe = value.recipe;
        if (typeof value.size === 'number') inventory.size = value.size;
        inventory.labels = Array.isArray(value.labels)
          ? value.labels.filter((label): label is string => typeof label === 'string')
          : [];
        return inventory;
      })
      .filter((model) => model.id || model.checkpoint);
  } catch {
    return [];
  }
}

function renderServeCheck(report: {
  generatedAt: string;
  status: string;
  baseUrl: string;
  latencyMs: number;
  models: ModelInventory[];
  attempts: readonly Record<string, unknown>[];
}): string {
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
      if (model.labels.length) lines.push(`  Labels: ${model.labels.join(', ')}`);
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
