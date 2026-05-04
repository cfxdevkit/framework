// @ts-nocheck
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import {
  checkMoonRegistration,
  checkPackageExports,
  collectCorpusFiles,
  docExtensions,
  findBrokenPathRefs,
  findCurrentPlannedDrift,
  printSummary,
  renderFindings,
  toRel,
  writeJsonReport,
  writeMarkdownReport,
} from './runtime/index.ts';

export async function runDocsAgent(opts = {}) {
  const markdownFiles = (await collectCorpusFiles()).filter((file) =>
    docExtensions.has(extname(file)),
  );
  const findings = [];
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
  if (!opts.silent) printSummary('llm:docs', [report]);
  return { agent: 'docs', status: report.status, findings: findings.length };
}
