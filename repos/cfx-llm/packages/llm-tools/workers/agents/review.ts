// @ts-nocheck
import {
  codeHotspotReport,
  gitChangedFiles,
  isGeneratedPath,
  isSecuritySensitive,
  printSummary,
  renderReview,
  suggestValidationCommands,
  writeJsonReport,
  writeMarkdownReport,
} from '../agent-runtime.ts';

export async function runReviewAgent(opts = {}) {
  const changed = await gitChangedFiles();
  const findings = [];
  const hotspotReport = await codeHotspotReport();
  for (const file of changed) {
    if (isGeneratedPath(file)) {
      findings.push({
        severity: 'warning',
        file,
        issue: 'Generated or artifact path changed',
        recommendation: 'Confirm this file should be committed rather than regenerated locally.',
      });
    }
    if (isSecuritySensitive(file)) {
      findings.push({
        severity: 'warning',
        file,
        issue: 'Security-sensitive surface changed',
        recommendation: 'Run pnpm run security:check plus targeted tests before review.',
      });
    }
  }
  if (hotspotReport.status === 'error') {
    for (const file of hotspotReport.hardViolations) {
      findings.push({
        severity: 'error',
        file: file.path,
        issue: `Code file exceeds hard size budget (${file.lines} lines > ${hotspotReport.policy.hardFileLineLimit})`,
        recommendation:
          'Split the module before committing so it stays easy for one person or agent to review.',
      });
    }
  }
  for (const file of hotspotReport.softWarnings) {
    findings.push({
      severity: 'warning',
      file: file.path,
      issue: `Code file exceeds soft size budget (${file.lines} lines > ${hotspotReport.policy.softFileLineLimit})`,
      recommendation: 'Consider splitting this module when touching it next.',
    });
  }

  const commands = suggestValidationCommands(changed);
  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    changedFiles: changed,
    findings,
    codeHotspots: {
      status: hotspotReport.status,
      hardViolations: hotspotReport.totals.hardViolations,
      softWarnings: hotspotReport.totals.softWarnings,
      report: 'artifacts/llm/reports/code-hotspots.md',
    },
    suggestedValidation: commands,
  };
  await writeJsonReport('reports/review.json', report);
  await writeMarkdownReport('reports/review.md', renderReview(report));
  if (!opts.silent) printSummary('llm:review', [report]);
  return {
    agent: 'review',
    status: report.status,
    changedFiles: changed.length,
    findings: findings.length,
  };
}
