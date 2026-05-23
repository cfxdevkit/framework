import { join, relative } from 'node:path';
import { parseValidationArgs } from './args.js';
import { runStructuredRepoCommand } from './commands.js';
import { findWorkspaceRoot, getGitNexusSnapshot, writeJson } from './context.js';
import { runStructuredHotspotsCheck } from './hotspots.js';
import { runStructuredKebabGroupsCheck } from './kebab-groups.js';
import {
  metadataRootRelativePath,
  type RepoCheckHotspotsResult,
  type RepoCheckKebabGroupsResult,
  type RepoCheckValidationResult,
  type RepoCommandResult,
  type RepoStructuredResult,
  type RepoValidationStepDetails,
  type RepoValidationStepId,
  type RepoValidationStepResult,
} from './types.js';

type ValidationStepDefinition = {
  id: RepoValidationStepId;
  label: string;
  kind: 'command' | 'check';
  required: boolean;
};

const validationStepDefinitions: readonly ValidationStepDefinition[] = [
  { id: 'gitnexus-analyze', label: 'GitNexus analyze', kind: 'command', required: true },
  { id: 'format', label: 'Format write', kind: 'command', required: true },
  { id: 'lint', label: 'Lint', kind: 'command', required: true },
  { id: 'typecheck', label: 'Typecheck', kind: 'command', required: true },
  { id: 'test', label: 'Tests', kind: 'command', required: true },
  { id: 'hotspots', label: 'Hotspots', kind: 'check', required: true },
  { id: 'kebab-groups', label: 'Kebab groups', kind: 'check', required: false },
  { id: 'check', label: 'Repo check', kind: 'command', required: true },
];

export async function runStructuredValidationCheck(
  args: readonly string[],
): Promise<RepoCheckValidationResult> {
  const invocation = parseValidationArgs(args);
  const selectedSteps =
    invocation.selectedSteps.length > 0
      ? validationStepDefinitions.filter((step) => invocation.selectedSteps.includes(step.id))
      : [...validationStepDefinitions];

  const stepResults: RepoValidationStepResult[] = [];
  for (const step of selectedSteps) {
    const startedAt = Date.now();
    const result = await runValidationStep(step.id);
    const details = collectValidationStepDetails(result);
    stepResults.push({
      id: step.id,
      label: step.label,
      kind: step.kind,
      required: step.required,
      status: result.status,
      exitCode: result.exitCode,
      durationMs: Date.now() - startedAt,
      summary: summarizeValidationStep(result),
      command: renderValidationCommand(step.id),
      artifactPath: result.artifacts.reportPath,
      ...(details ? { details } : {}),
    });
    if (result.exitCode !== 0 && !invocation.continueOnError) {
      break;
    }
  }

  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const generatedAt = new Date().toISOString();
  const requestedFrom = relative(workspaceRoot, process.cwd()).split('\\').join('/') || '.';
  const errors = stepResults.filter((step) => step.status === 'error').length;
  const warnings = stepResults.filter((step) => step.status === 'warning').length;
  const passed = stepResults.filter((step) => step.status === 'ok').length;
  const stoppedEarly = stepResults.length < selectedSteps.length;

  const result: RepoCheckValidationResult = {
    kind: 'repo-structured',
    command: {
      namespace: 'repo',
      action: 'check',
      target: 'validation',
      script: 'repo-check:validation',
      args: invocation.forwardedArgs,
      outputMode: invocation.outputMode,
    },
    context: {
      workspaceRoot: '.',
      requestedFrom,
      metadataRoot: metadataRootRelativePath,
      generatedAt,
      gitNexus: await getGitNexusSnapshot(workspaceRoot),
    },
    artifacts: {
      reportPath: join(metadataRootRelativePath, 'checks', 'validation.json'),
      workspaceNodePath: join(metadataRootRelativePath, 'nodes', 'workspace', 'validation.json'),
    },
    status: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok',
    exitCode: errors > 0 ? 1 : 0,
    summary: {
      totalSteps: stepResults.length,
      passed,
      warnings,
      errors,
      stoppedEarly,
    },
    report: {
      policy: {
        source: 'repo-validation-sequence',
        continueOnError: invocation.continueOnError,
        selectedSteps: selectedSteps.map((step) => step.id),
      },
      steps: stepResults,
    },
  };

  await writeJson(workspaceRoot, result.artifacts.reportPath, result);
  await writeJson(workspaceRoot, result.artifacts.workspaceNodePath, {
    kind: 'workspace',
    generatedAt,
    check: 'validation',
    status: result.status,
    summary: result.summary,
    policy: result.report.policy,
    gitNexus: result.context.gitNexus,
  });

  return result;
}

async function runValidationStep(stepId: RepoValidationStepId): Promise<RepoStructuredResult> {
  switch (stepId) {
    case 'gitnexus-analyze':
      return await runStructuredRepoCommand('gitnexus-analyze', []);
    case 'format':
      return await runStructuredRepoCommand('format', []);
    case 'lint':
      return await runStructuredRepoCommand('lint', []);
    case 'typecheck':
      return await runStructuredRepoCommand('typecheck', []);
    case 'test':
      return await runStructuredRepoCommand('test', []);
    case 'hotspots':
      return await runStructuredHotspotsCheck(['--fail-on-hard']);
    case 'kebab-groups':
      return await runStructuredKebabGroupsCheck([]);
    case 'check':
      return await runStructuredRepoCommand('check', []);
  }
}

function summarizeValidationStep(result: RepoStructuredResult): string {
  if (isRepoCommandResult(result)) {
    const firstStdoutLine = result.result.stdoutTail[0];
    const firstStderrLine = result.result.stderrTail[0];
    return firstStdoutLine ?? firstStderrLine ?? `${result.status} (exit ${result.exitCode})`;
  }

  if (isRepoHotspotsResult(result)) {
    return `scanned ${result.summary.scannedFiles}; hard ${result.summary.hardViolations}; soft ${result.summary.softWarnings}`;
  }

  if (isRepoKebabGroupsResult(result)) {
    return `scanned ${result.summary.scannedFiles}; groups ${result.summary.groups}; files ${result.summary.groupedFiles}`;
  }

  return `completed with status ${result.status}`;
}

function renderValidationCommand(stepId: RepoValidationStepId): string {
  switch (stepId) {
    case 'gitnexus-analyze':
      return 'pnpm run gitnexus:analyze';
    case 'format':
      return 'pnpm run format';
    case 'lint':
      return 'pnpm run lint';
    case 'typecheck':
      return 'pnpm run typecheck';
    case 'test':
      return 'pnpm run test';
    case 'hotspots':
      return 'pnpm run cdk -- repo check hotspots -- --fail-on-hard';
    case 'kebab-groups':
      return 'pnpm run cdk -- repo check kebab-groups';
    case 'check':
      return 'pnpm run check';
  }
}

function collectValidationStepDetails(
  result: RepoStructuredResult,
): RepoValidationStepDetails | undefined {
  if (isRepoCommandResult(result)) {
    return {
      stdoutTail: result.result.stdoutTail.slice(0, 8),
      stderrTail: result.result.stderrTail.slice(0, 8),
    };
  }

  if (isRepoHotspotsResult(result)) {
    return {
      hardViolations: result.report.hardViolations.slice(0, 8),
      softWarnings: result.report.softWarnings.slice(0, 8),
    };
  }

  if (isRepoKebabGroupsResult(result)) {
    return {
      groups: result.report.groups.slice(0, 8),
    };
  }

  return undefined;
}

function isRepoCommandResult(result: RepoStructuredResult): result is RepoCommandResult {
  return result.command.action === 'command';
}

function isRepoHotspotsResult(result: RepoStructuredResult): result is RepoCheckHotspotsResult {
  return result.command.action === 'check' && result.command.target === 'hotspots';
}

function isRepoKebabGroupsResult(
  result: RepoStructuredResult,
): result is RepoCheckKebabGroupsResult {
  return result.command.action === 'check' && result.command.target === 'kebab-groups';
}
