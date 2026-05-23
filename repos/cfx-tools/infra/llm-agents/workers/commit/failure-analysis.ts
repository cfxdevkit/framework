import { completeStructuredAgent } from '../completion/index.ts';
import {
  type ExecutionContextSummary,
  renderExecutionContextLines,
} from '../shared/execution-context.ts';
import { createLlmProgressReporter } from '../shared/logging.ts';
import type { GateReport } from './gates.ts';

export type GateFailureAnalysis = {
  attempted: boolean;
  usedLlm: boolean;
  status: 'not-needed' | 'ready' | 'unavailable' | 'failed';
  content: string | null;
  error?: string;
};

export async function analyzeGateFailures(options: {
  command: 'precommit' | 'commit';
  executionContext: ExecutionContextSummary;
  reports: readonly GateReport[];
  modelOverride?: string | null;
}): Promise<GateFailureAnalysis> {
  const failedResults = options.reports.flatMap((report) =>
    report.results.filter((result) => result.status !== 'ok'),
  );
  if (!failedResults.length) {
    return { attempted: false, usedLlm: false, status: 'not-needed', content: null };
  }
  if (options.executionContext.llm.status !== 'ready') {
    return {
      attempted: false,
      usedLlm: false,
      status: 'unavailable',
      content: null,
      error: options.executionContext.llm.error ?? 'LLM is not configured for this unit.',
    };
  }

  try {
    const response = await completeStructuredAgent({
      action: 'validation',
      flags: { model: options.modelOverride ?? undefined },
      systemPrompt: [
        'You analyze repository validation failures for a human maintainer.',
        'Use only the supplied gate results and execution context.',
        'Return concise, high-signal guidance with findings first.',
        'This output is shown as the commit failure result, so keep it scannable and explicit.',
        'For code hotspots, list each violating file path and line count exactly as reported when available.',
        'For kebab file groups, report representative grouped sibling findings exactly as reported when available.',
        'Prefer the smallest fix and the next validation command.',
        'Use only supported root CLI commands such as `pnpm cdk repo check ...`; never reference tsx paths or internal package entrypoints.',
        'Use exactly these sections: Summary, Root causes, Minimal fixes, Next commands.',
      ].join(' '),
      userPrompt: [
        `Command: repo ${options.command}`,
        '',
        'Execution context:',
        ...renderExecutionContextLines(options.executionContext),
        '',
        'Commit failure details:',
        ...formatFailedResults(failedResults),
      ].join('\n'),
      maxTokens: 900,
      onProgress: createLlmProgressReporter(`${options.command} failure analysis`),
    });
    return {
      attempted: true,
      usedLlm: true,
      status: 'ready',
      content: response.content.trim(),
    };
  } catch (error) {
    return {
      attempted: true,
      usedLlm: false,
      status: 'failed',
      content: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatFailedResults(results: readonly GateReport['results'][number][]): string[] {
  return results.flatMap((result) => {
    const lines = [
      `### ${result.label}`,
      `Status: ${result.status}`,
      `Required: ${result.required ? 'yes' : 'no'}`,
      `Reproduce: ${result.command}`,
    ];

    if (result.summary) {
      lines.push(`Summary: ${result.summary}`);
    }

    if (result.signalLines.length) {
      lines.push('Findings:');
      lines.push(...result.signalLines.map((line) => `- ${line}`));
    }

    if (result.hints.length) {
      lines.push('Deterministic follow-up hints:');
      lines.push(...result.hints.map((hint) => `- ${hint}`));
    }

    lines.push('');
    return lines;
  });
}
