import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { artifactsRoot, type LlmModel, type LlmProvider } from '../completion/index.ts';
import type { JsonValidation, ValidationProbeResult } from './probe.ts';

export type ValidateModelsFlags = {
  quick: boolean;
  noThinking: boolean;
  model: string | null;
  limit: number;
};

export type ModelValidationResult = {
  model: string;
  labels: readonly string[];
  size: number | null;
  ok: boolean;
  loadMs: number | null;
  firstResponseMs: number | null;
  hotFirstResponseMs: number | null;
  jsonValid: boolean;
  jsonShapeOk: boolean;
  requestedMinContextTokens: number | null;
  reasoningObserved: boolean;
  headersMs: number | null;
  firstReasoningMs: number | null;
  firstContentMs: number | null;
  completeMs: number | null;
  finishReason: string | null;
  contentChars: number;
  reasoningChars: number;
  contentPreview?: string;
  cold: ValidationProbeResult;
  hot: ValidationProbeResult;
  json: ValidationProbeResult;
  error: string | null;
};

export type ValidationReport = {
  generatedAt: string;
  provider: LlmProvider['type'];
  baseUrl: string | null;
  discoverMs: number;
  noThinking: boolean;
  quick: boolean;
  minContextTokens: number | null;
  results: readonly ModelValidationResult[];
};

export function displayModelId(model: LlmModel): string {
  return model.id ?? model.checkpoint ?? '(unknown-model)';
}

export function displayModelLabels(model: LlmModel): string {
  return model.labels?.length ? model.labels.join(', ') : '';
}

export function parseValidateModelsFlags(args: string[]): ValidateModelsFlags {
  const flags: ValidateModelsFlags = {
    quick: false,
    noThinking: false,
    model: null,
    limit: Number.POSITIVE_INFINITY,
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--quick') {
      flags.quick = true;
    } else if (arg === '--no-thinking') {
      flags.noThinking = true;
    } else if (arg === '--model' && args[index + 1]) {
      flags.model = args[++index] ?? null;
    } else if (arg === '--limit' && args[index + 1]) {
      const limit = Number(args[++index]);
      if (Number.isFinite(limit) && limit > 0) flags.limit = limit;
    }
  }
  return flags;
}

export function summarizeValidationResult(
  result: {
    model: string;
  } & ValidationProbeResult,
): string {
  if (!result.ok) return `[error] ${result.model}: ${result.error}`;
  const parts = [
    `[ok] ${result.model}`,
    `headers=${result.headersMs ?? 'n/a'}ms`,
    `firstReasoning=${result.firstReasoningMs ?? 'n/a'}ms`,
    `firstContent=${result.firstContentMs ?? 'n/a'}ms`,
    `complete=${result.completeMs ?? 'n/a'}ms`,
    `reasoning=${result.reasoningObserved ? 'yes' : 'no'}`,
    `finish=${result.finishReason ?? 'unknown'}`,
  ];
  if (result.tps !== null && result.tps !== undefined) parts.push(`tps=${result.tps}`);
  if (result.pp !== null && result.pp !== undefined) parts.push(`pp=${result.pp}`);
  if (result.promptTokens !== null && result.promptTokens !== undefined)
    parts.push(`prompt=${result.promptTokens}tok`);
  if (result.completionTokens !== null && result.completionTokens !== undefined)
    parts.push(`completion=${result.completionTokens}tok`);
  return parts.join(', ');
}

export function validateJsonProbe(content: string): JsonValidation {
  try {
    const parsed = JSON.parse(content) as { ok?: unknown; mode?: unknown };
    return {
      jsonValid: true,
      jsonShapeOk:
        typeof parsed === 'object' &&
        parsed !== null &&
        parsed.ok === true &&
        parsed.mode === 'json',
    };
  } catch {
    return { jsonValid: false, jsonShapeOk: false };
  }
}

export function findValidationError(result: ModelValidationResult): string | null {
  if (!result.cold.ok) return `cold: ${result.cold.error}`;
  if (!result.hot.ok) return `hot: ${result.hot.error}`;
  if (!result.json.ok) return `json: ${result.json.error}`;
  if (!result.jsonShapeOk) return 'json payload mismatch';
  return null;
}

export function renderValidationTable(results: readonly ModelValidationResult[]): string {
  const rows = results.map((result) => {
    const note = result.error ?? (result.jsonShapeOk ? '' : 'json payload mismatch');
    return [
      toTableCell(result.model, 30),
      toDisplayDuration(result.loadMs),
      toDisplayDuration(result.firstResponseMs),
      toDisplayDuration(result.hotFirstResponseMs),
      result.jsonShapeOk ? 'ok' : result.jsonValid ? 'invalid' : 'error',
      result.reasoningObserved ? 'yes' : 'no',
      result.ok ? 'ok' : 'error',
      toTableCell(note, 36),
    ];
  });

  const header = ['Model', 'Load', 'First', 'Hot First', 'JSON', 'Reason', 'Status', 'Note'];
  const widths = header.map((label, index) =>
    Math.max(label.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const renderRow = (row: readonly string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join(' | ');
  const divider = widths.map((width) => '-'.repeat(width)).join('-|-');
  return [renderRow(header), divider, ...rows.map(renderRow)].join('\n');
}

export async function writeModelValidationReport(report: ValidationReport): Promise<string> {
  const filePath = join(artifactsRoot, 'reports', 'model-validation.json');
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return 'artifacts/llm/reports/model-validation.json';
}

function toDisplayDuration(value: number | null): string {
  return value === null ? 'n/a' : `${value}ms`;
}

function toTableCell(value: string | number | null | undefined, maxWidth = 32): string {
  const text = String(value ?? '');
  if (text.length <= maxWidth) return text;
  return `${text.slice(0, maxWidth - 1)}…`;
}
