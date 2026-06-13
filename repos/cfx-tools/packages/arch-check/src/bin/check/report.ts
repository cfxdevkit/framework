#!/usr/bin/env node
import { runFullReport } from '../../checks/report.js';

const report = await runFullReport();

const icon = report.status === 'ok' ? '✅' : '❌';
console.log(`${icon} Arch-check report: ${report.status.toUpperCase()}`);
for (const check of report.checks) {
  const checkIcon = check.status === 'ok' ? '  ✅' : '  ❌';
  const findings = check.findings ? ` (${check.findings} finding(s))` : '';
  console.log(`${checkIcon} ${check.label}${findings} — ${check.notes}`);
}
console.log('');
console.log('Report: artifacts/llm/reports/arch-check-report.{md,json}');

if (report.status === 'error') process.exitCode = 1;
