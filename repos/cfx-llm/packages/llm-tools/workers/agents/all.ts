// @ts-nocheck

import { runCorpusAgent, runDatasetAgent } from './corpus.ts';
import { runDocsAgent } from './docs.ts';
import { runEvalAgent, runServeCheckAgent } from './eval-serve.ts';
import { runReviewAgent } from './review.ts';
import {
  printSummary,
  renderAgentRun,
  writeJsonReport,
  writeMarkdownReport,
} from './runtime/index.ts';

export async function runAll() {
  const results = [];
  results.push(await runCorpusAgent({ silent: true }));
  results.push(await runDocsAgent({ silent: true }));
  results.push(await runReviewAgent({ silent: true }));
  results.push(await runDatasetAgent({ silent: true }));
  results.push(await runEvalAgent({ silent: true }));
  results.push(await runServeCheckAgent({ silent: true }));

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'deterministic-agents',
    fineTuning: false,
    results,
  };
  await writeJsonReport('reports/agent-run.json', report);
  await writeMarkdownReport('reports/agent-run.md', renderAgentRun(report));
  printSummary('llm:all', results);
  return report;
}
