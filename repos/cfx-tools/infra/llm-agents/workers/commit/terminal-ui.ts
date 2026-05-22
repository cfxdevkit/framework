import { clearScreenDown, moveCursor } from 'node:readline';
import type { ExecutionContextSummary } from '../shared/execution-context.ts';
import type { GateReport, GateResult, GateRunHooks } from './gates.ts';
import type { WorkingSetSummary } from './hud.ts';
export {
  summarizeCommitPreview,
  summarizeFailureAnalysis,
  summarizeGateFailures,
} from './terminal-ui-summary.ts';

type GateView = {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly status: 'pending' | 'running' | GateResult['status'];
  readonly summary: string;
  readonly elapsedMs?: number;
};

type WorkflowTerminalUi = {
  readonly gateHooks: GateRunHooks;
  start: () => void;
  startStep: (step: number, total: number, label: string) => void;
  note: (message: string) => void;
  pause: () => void;
  finish: (status: string, detailLines?: readonly string[]) => void;
};

export function createWorkflowTerminalUi(options: {
  commandLabel: string;
  executionContext: ExecutionContextSummary;
  workingSet: WorkingSetSummary;
  llmFailureAnalysis: boolean;
  stdout?: NodeJS.WriteStream;
  interactive?: boolean;
}): WorkflowTerminalUi {
  const output = options.stdout ?? process.stdout;
  const interactive = options.interactive ?? Boolean(output.isTTY && process.stderr.isTTY);
  const header = formatHeader(options.commandLabel, options.executionContext, options.workingSet);
  const state: {
    stepLine: string;
    gates: GateView[];
    noteLine: string;
    started: boolean;
    renderedLineCount: number;
  } = {
    stepLine: options.llmFailureAnalysis
      ? 'failure analysis: enabled when a gate fails'
      : 'failure analysis: deterministic only',
    gates: [],
    noteLine: '',
    started: false,
    renderedLineCount: 0,
  };

  const renderBlock = (extraLines: readonly string[] = []): void => {
    const lines = [header, state.stepLine, ...state.gates.map(formatGateLine)];
    if (state.noteLine) lines.push(state.noteLine);
    lines.push(...extraLines);

    if (!interactive) {
      output.write(`${lines.join('\n')}\n`);
      return;
    }

    clearBlock();
    output.write(`${lines.join('\n')}\n`);
    state.renderedLineCount = lines.length;
  };

  const clearBlock = (): void => {
    if (!interactive || state.renderedLineCount === 0) return;
    moveCursor(output, 0, -state.renderedLineCount);
    clearScreenDown(output);
    state.renderedLineCount = 0;
  };

  const ensureStarted = (): void => {
    if (state.started) return;
    state.started = true;
    if (interactive) {
      renderBlock();
      return;
    }
    output.write(`${header}\n`);
    output.write(`${state.stepLine}\n`);
  };

  const updateGate = (gateLabel: string, next: Partial<GateView>): void => {
    const index = state.gates.findIndex((gate) => gate.label === gateLabel);
    if (index === -1) {
      state.gates.push({
        id: gateLabel.toLowerCase(),
        label: gateLabel,
        required: true,
        status: next.status ?? 'pending',
        summary: next.summary ?? 'pending',
        ...(next.elapsedMs !== undefined ? { elapsedMs: next.elapsedMs } : {}),
      });
      return;
    }

    state.gates[index] = {
      ...state.gates[index],
      ...next,
    };
  };

  const gateHooks: GateRunHooks = {
    onGroupStart(group) {
      state.gates = group.gates.map((gate) => ({
        id: gate.id,
        label: gate.label,
        required: gate.required,
        status: 'pending',
        summary: gate.required ? 'queued' : 'queued optional',
      }));
      state.noteLine = `${group.label}: running ${group.gates.length} check(s)`;
      if (interactive) renderBlock();
    },
    onGateStart(gate) {
      updateGate(gate.label, { status: 'running', summary: 'running...' });
      if (interactive) renderBlock();
    },
    onGateFinish(result) {
      updateGate(result.label, {
        required: result.required,
        status: result.status,
        summary: pickGateSummary(result),
        elapsedMs: result.elapsedMs,
      });
      if (interactive) {
        state.noteLine = summarizeReportCounts(state.gates);
        renderBlock();
        return;
      }
      output.write(`${formatGateLine(state.gates.find((gate) => gate.label === result.label) ?? {
        id: result.id,
        label: result.label,
        required: result.required,
        status: result.status,
        summary: pickGateSummary(result),
        elapsedMs: result.elapsedMs,
      })}\n`);
    },
    onGroupFinish(report) {
      state.noteLine = summarizeFinishedReport(report);
      if (interactive) renderBlock();
    },
  };

  return {
    gateHooks,
    start() {
      ensureStarted();
    },
    startStep(step, total, label) {
      ensureStarted();
      state.stepLine = `step ${step}/${total} · ${label}`;
      state.noteLine = '';
      if (interactive) {
        renderBlock();
        return;
      }
      output.write(`${state.stepLine}\n`);
    },
    note(message) {
      ensureStarted();
      state.noteLine = `note: ${truncate(message, 108)}`;
      if (interactive) {
        renderBlock();
        return;
      }
      output.write(`${state.noteLine}\n`);
    },
    pause() {
      clearBlock();
    },
    finish(status, detailLines = []) {
      clearBlock();
      const lines = [
        header,
        state.stepLine,
        ...state.gates.map(formatGateLine),
        `status: ${status}`,
        ...detailLines,
      ];
      output.write(`${lines.join('\n')}\n`);
    },
  };
}

function formatHeader(
  commandLabel: string,
  executionContext: ExecutionContextSummary,
  workingSet: WorkingSetSummary,
): string {
  const unit = executionContext.unit?.name ?? 'shared';
  const llm =
    executionContext.llm.status === 'ready'
      ? `${executionContext.llm.provider}/${executionContext.llm.model ?? 'auto'}`
      : executionContext.llm.status === 'not-used'
        ? 'llm off'
        : 'llm unavailable';
  return truncate(
    `${commandLabel} · ${unit} · ${llm} · ${workingSet.fileCount} files / ${workingSet.scopeCount} scopes`,
    116,
  );
}

function formatGateLine(gate: GateView): string {
  const status = `${statusTag(gate.status, gate.required)}`.padEnd(6);
  const label = truncate(gate.label, 22).padEnd(22);
  const elapsed = gate.elapsedMs !== undefined ? `${(gate.elapsedMs / 1000).toFixed(1)}s`.padStart(6) : '   ...';
  return `  ${status}${label}${elapsed}  ${truncate(gate.summary, 76)}`;
}

function pickGateSummary(result: GateResult): string {
  return truncate(result.summary || result.signalLines[0] || 'completed', 76);
}

function statusTag(status: GateView['status'], required: boolean): string {
  if (status === 'running') return 'run';
  if (status === 'pending') return 'wait';
  if (status === 'ok') return 'ok';
  if (status === 'warning') return required ? 'warn' : 'note';
  if (status === 'error') return 'fail';
  return 'skip';
}

function summarizeReportCounts(gates: readonly GateView[]): string {
  const counts = gates.reduce(
    (acc, gate) => {
      acc[gate.status] = (acc[gate.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  return `checks: ${counts.ok ?? 0} ok, ${counts.warning ?? 0} warning, ${counts.error ?? 0} fail, ${counts.running ?? 0} running`;
}

function summarizeFinishedReport(report: GateReport): string {
  const failed = report.results.filter((result) => result.status === 'error').length;
  const warned = report.results.filter((result) => result.status === 'warning').length;
  if (failed > 0) return `${report.label}: ${failed} failed, ${warned} warning`;
  if (warned > 0) return `${report.label}: passed with ${warned} warning`;
  return `${report.label}: passed`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}