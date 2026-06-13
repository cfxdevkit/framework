/**
 * CDK tool executors — deterministic, no LLM, no agent loop.
 *
 * Every function here is a thin wrapper over @cfxdevkit/cli pure functions.
 * They must NEVER call executePiAgentCheck, executePiAction, or any LLM path.
 */
import {
  type ContractsExtractReport,
  type DeriveReport,
  type GenerateReport,
  type RunContractsExtractOptions,
  type RunDeriveOptions,
  type RunGenerateOptions,
  type RunStatusOptions,
  runContractsExtract,
  runDerive,
  runGenerate,
  runStatus,
  type StatusReport,
} from '@cfxdevkit/cli';

export type {
  ContractsExtractReport,
  DeriveReport,
  GenerateReport,
  RunContractsExtractOptions,
  RunDeriveOptions,
  RunGenerateOptions,
  RunStatusOptions,
  StatusReport,
};

// ─── Status ──────────────────────────────────────────────────────────────────

export async function executeCdkStatus(opts: RunStatusOptions): Promise<StatusReport[]> {
  return runStatus(opts);
}

// ─── Derive ──────────────────────────────────────────────────────────────────

export function executeCdkDerive(opts: RunDeriveOptions): DeriveReport {
  return runDerive(opts);
}

// ─── Generate ────────────────────────────────────────────────────────────────

export function executeCdkGenerate(opts: RunGenerateOptions = {}): GenerateReport {
  return runGenerate(opts);
}

// ─── Contracts Extract ───────────────────────────────────────────────────────

export async function executeCdkContractsExtract(
  opts: RunContractsExtractOptions = {},
): Promise<ContractsExtractReport> {
  return runContractsExtract(opts);
}
