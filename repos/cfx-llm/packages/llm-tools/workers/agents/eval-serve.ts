// @ts-nocheck
import {
  extractModelInventory,
  printSummary,
  readJsonIfExists,
  renderEval,
  renderServeCheck,
  writeJsonReport,
  writeMarkdownReport,
} from './runtime/index.ts';

export async function runEvalAgent(opts = {}) {
  const docsReport = await readJsonIfExists('reports/docs-alignment.json');
  const ciCdReport = await readJsonIfExists('reports/ci-cd.json');
  const findings = [];
  if (!docsReport) {
    findings.push({
      severity: 'warning',
      issue: 'docs agent has not run',
      recommendation: 'Run pnpm run llm:docs.',
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
      issue: 'CI/CD readiness agent has not run',
      recommendation: 'Run pnpm run llm:ci.',
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
  if (!opts.silent) printSummary('llm:eval', [report]);
  return { agent: 'eval', status: report.status, findings: findings.length };
}

export async function runServeCheckAgent(opts = {}) {
  const configuredBaseUrl = process.env.LEMONADE_URL ?? process.env.LEMONADE_BASE_URL;
  const baseUrls = configuredBaseUrl
    ? [configuredBaseUrl]
    : [
        'http://localhost:13305/',
        'http://127.0.0.1:13305/',
        'http://host.docker.internal:13305/',
        'http://host.containers.internal:13305/',
        'http://127.0.0.1:8000/',
      ];
  const started = performance.now();
  const attempts = [];
  let discoveredBaseUrl = null;
  let models = [];
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
    baseUrl: discoveredBaseUrl ?? baseUrls[0],
    latencyMs: Math.round(performance.now() - started),
    models,
    attempts,
  };
  await writeJsonReport('reports/serve-check.json', report);
  await writeMarkdownReport('reports/serve-check.md', renderServeCheck(report));
  if (!opts.silent) printSummary('llm:serve-check', [report]);
  return { agent: 'serve-check', status: report.status };
}
