import { runReviewAgent } from './review.ts';
import {
  printSummary,
  renderAgentRun,
  writeJsonReport,
  writeMarkdownReport,
} from './runtime/index.ts';
import { resolveExecutionContext } from '../shared/execution-context.ts';

export async function runAll() {
  const executionContext = await resolveExecutionContext({ useLlm: false });
  const results = [];
  results.push(await runReviewAgent({ silent: true }));

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'llm-agents',
    fineTuning: false,
    executionContext,
    results,
  };
  await writeJsonReport('reports/agent-run.json', report);
  await writeMarkdownReport('reports/agent-run.md', renderAgentRun(report));
  printSummary('llm:all', results);
  return report;
}
