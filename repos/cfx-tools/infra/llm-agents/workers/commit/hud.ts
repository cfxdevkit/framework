import type { ExecutionContextSummary } from '../shared/execution-context.js';
import { logInfo } from '../shared/logging.js';
import type { GateFailureAnalysis } from './failure-analysis.js';
import type { GateReport } from './gates/index.js';

type ScopeSummary = {
  readonly label: string;
  readonly files: readonly string[];
};

export type WorkingSetSummary = {
  fileCount: number;
  scopeCount: number;
  scopeLabels: string[];
  sampleFiles: string[];
};

export function summarizeWorkingSet(scopes: readonly ScopeSummary[]): WorkingSetSummary {
  const files = scopes.flatMap((scope) => scope.files);
  return {
    fileCount: files.length,
    scopeCount: scopes.length,
    scopeLabels: scopes.map((scope) => scope.label),
    sampleFiles: files.slice(0, 5),
  };
}

export function formatOperationHud(options: {
  title: string;
  executionContext: ExecutionContextSummary;
  workingSet: WorkingSetSummary;
  llmFailureAnalysis: boolean;
}): string[] {
  const { title, executionContext, workingSet, llmFailureAnalysis } = options;
  const unit = executionContext.unit
    ? `${executionContext.unit.name} (${executionContext.unit.rootDir})`
    : 'shared repo config';
  const llm =
    executionContext.llm.status === 'not-used'
      ? 'not used'
      : executionContext.llm.status === 'ready'
        ? `${executionContext.llm.provider} :: ${executionContext.llm.model ?? 'auto'}${executionContext.llm.baseUrl ? ` @ ${executionContext.llm.baseUrl}` : ''}`
        : `unavailable${executionContext.llm.error ? ` (${executionContext.llm.error})` : ''}`;
  const scopes =
    workingSet.scopeLabels.length > 4
      ? `${workingSet.scopeLabels.slice(0, 4).join(', ')} +${workingSet.scopeLabels.length - 4} more`
      : workingSet.scopeLabels.join(', ') || 'working tree clean';
  const samples = workingSet.sampleFiles.length
    ? workingSet.sampleFiles.join(', ')
    : 'no changed files detected';

  return renderBox(title, [
    `Unit: ${unit}`,
    `Config: ${executionContext.llm.configPath}`,
    `LLM: ${llm}`,
    `Failure analysis: ${llmFailureAnalysis ? 'enabled on failing gates' : 'deterministic only'}`,
    `Working set: ${workingSet.fileCount} file(s) across ${workingSet.scopeCount} scope(s)`,
    `Scopes: ${scopes}`,
    `Samples: ${samples}`,
  ]);
}

export function logOperationHud(options: Parameters<typeof formatOperationHud>[0]): void {
  for (const line of formatOperationHud(options)) logInfo(line);
}

export function logGateReport(report: GateReport): void {
  if (report.skipped) {
    logInfo(`  ${report.label}: skipped`);
    return;
  }

  logInfo(`  ${report.label}:`);
  for (const result of report.results) {
    const status = result.status.toUpperCase().padEnd(7);
    const elapsed = `${(result.elapsedMs / 1000).toFixed(1)}s`.padStart(6);
    const summary = result.summary || 'no concise summary reported';
    logInfo(`    [${status}] ${result.label.padEnd(24)} ${elapsed}  ${summary}`);
    for (const line of result.signalLines.slice(0, 3)) {
      logInfo(`      signal: ${line}`);
    }
    for (const hint of result.hints.slice(0, 3)) {
      logInfo(`      hint: ${hint}`);
    }
  }
}

export function logFailureAnalysis(analysis: GateFailureAnalysis | null): void {
  if (!analysis || analysis.status === 'not-needed') return;

  logInfo('');
  if (analysis.status === 'ready' && analysis.content) {
    for (const line of renderBox('Commit Failure Result', analysis.content.split('\n')))
      logInfo(line);
    return;
  }

  if (analysis.status === 'unavailable') {
    for (const line of renderBox('Commit Failure Result', [
      'LLM failure analysis is unavailable for this run.',
      ...(analysis.error ? [`Reason: ${analysis.error}`] : []),
    ]))
      logInfo(line);
    return;
  }

  for (const line of renderBox('Commit Failure Result', [
    'LLM failure analysis could not complete.',
    ...(analysis.error ? [`Reason: ${analysis.error}`] : []),
  ]))
    logInfo(line);
}

function renderBox(title: string, rows: readonly string[]): string[] {
  const width = Math.max(title.length + 4, ...rows.map((row) => row.length + 4));
  const top = `+${'-'.repeat(width - 2)}+`;
  const titleRow = `| ${title.padEnd(width - 4)} |`;
  const body = rows.map((row) => `| ${row.padEnd(width - 4)} |`);
  return [top, titleRow, top, ...body, top];
}
