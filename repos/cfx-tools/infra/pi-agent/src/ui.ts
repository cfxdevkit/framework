import type { ExtensionContext } from '@earendil-works/pi-coding-agent';
import type { PiAgentExtension } from './extension.js';
import type {
  PiCommitWorkflowResult,
  PiPrecommitWorkflowResult,
  PiRepoActionExecutionResult,
} from './llm-agents-runtime.js';
import type { PiProviderBridge } from './providers.js';

export interface PiOperatorUiState {
  readonly statusText: string;
  readonly widgetKey: string;
  readonly widgetLines: readonly string[];
}

export function createPiRuntimeUiState(options: {
  extension: PiAgentExtension;
  providerBridge: PiProviderBridge;
  actionCount: number;
}): PiOperatorUiState {
  const { extension, providerBridge, actionCount } = options;
  const scopeLabel = providerBridge.scope ?? 'shared-repo';
  const modelLabel = providerBridge.defaultModel ?? providerBridge.pi.model ?? 'auto';
  return {
    statusText: `${scopeLabel} · ${providerBridge.providerType} · ${modelLabel}`,
    widgetKey: 'repo-agent-context',
    widgetLines: [
      'Repo agent context',
      `extension: ${extension.name}`,
      `scope: ${scopeLabel}`,
      `provider: ${providerBridge.providerType}`,
      `model: ${modelLabel}`,
      `strategy: ${providerBridge.providerStrategy}`,
      `config: ${providerBridge.configPath}`,
      `actions: ${actionCount}`,
    ],
  };
}

export function createPiRepoActionUiState(result: PiRepoActionExecutionResult): PiOperatorUiState {
  const responseLines = previewResponseLines(result.response.content);
  const unitLabel = result.executionContext.unit?.name ?? 'shared-repo';
  const modelLabel = result.executionContext.llm.model ?? 'auto';
  return {
    statusText: `${result.action} · ${result.definition.mode} · ${modelLabel}`,
    widgetKey: 'repo-agent-workflow',
    widgetLines: [
      'Repo workflow',
      `action: ${result.action}`,
      `title: ${result.definition.title}`,
      `mode: ${result.definition.mode}`,
      `scope: ${unitLabel}`,
      `provider: ${result.executionContext.llm.provider ?? 'unavailable'}`,
      `model: ${modelLabel}`,
      `response: ${result.response.content.length} chars`,
      ...responseLines,
    ],
  };
}

export function createPiGateUiState(
  result: PiPrecommitWorkflowResult | PiCommitWorkflowResult,
): PiOperatorUiState {
  const scopeLabel = result.executionContext.unit?.name ?? 'shared-repo';
  const status =
    result.repositoryPolicies.passed && result.qualityGates.passed ? 'passed' : 'attention';
  return {
    statusText: `${result.command} · ${status} · ${scopeLabel}`,
    widgetKey: 'repo-agent-gates',
    widgetLines: [
      `${capitalize(result.command)} gates`,
      `scope: ${scopeLabel}`,
      ...summarizeGateReport(result.repositoryPolicies),
      ...summarizeGateReport(result.qualityGates),
    ],
  };
}

export function createPiCommitWorkflowUiState(
  result: PiCommitWorkflowResult | null,
): PiOperatorUiState {
  if (!result) {
    return {
      statusText: 'commit · clean',
      widgetKey: 'repo-agent-commit',
      widgetLines: ['Commit workflow', 'status: clean', 'No changed scopes detected.'],
    };
  }

  const scopeLabel = result.executionContext.unit?.name ?? 'shared-repo';
  const approvalLabel = result.approval.required
    ? result.approval.approved
      ? 'approved'
      : result.approval.declined
        ? 'declined'
        : 'pending'
    : 'not-required';
  const lines = [
    'Commit workflow',
    `status: ${result.status}`,
    `phase: ${result.phase}`,
    `scope: ${scopeLabel}`,
    `provider: ${result.executionContext.llm.provider ?? 'unavailable'}`,
    `model: ${result.executionContext.llm.model ?? 'auto'}`,
    `approval: ${approvalLabel}`,
    ...summarizeGateReport(result.repositoryPolicies),
    ...summarizeGateReport(result.qualityGates),
  ];

  if (result.postGenerationQualityGates) {
    lines.push(...summarizeGateReport(result.postGenerationQualityGates));
  }
  if (result.commitPreview) {
    lines.push(`subject: ${result.commitPreview.subject}`);
  }
  if (result.generatedFiles?.length) {
    lines.push(`generated files: ${result.generatedFiles.join(', ')}`);
  }
  if (result.sha) {
    lines.push(`sha: ${result.sha}`);
  }
  if (result.failureAnalysis?.content) {
    lines.push('failure guidance:');
    lines.push(...result.failureAnalysis.content.split('\n').filter(Boolean).slice(0, 4));
  }

  return {
    statusText: `commit · ${result.status} · ${scopeLabel}`,
    widgetKey: 'repo-agent-commit',
    widgetLines: lines,
  };
}

export function renderPiActionCatalogLines(
  entries: readonly {
    name: string;
    definition: { title: string; mode: 'deterministic' | 'exploratory' };
  }[],
  filterMode?: string,
): readonly string[] {
  const normalized = normalizeMode(filterMode);
  const filteredEntries = entries.filter(({ definition }) => {
    if (!normalized) {
      return true;
    }
    return definition.mode === normalized;
  });

  return [
    `Repo actions${normalized ? ` (${normalized})` : ''}`,
    ...filteredEntries.map(
      ({ name, definition }) => `${name} · ${definition.mode} · ${definition.title}`,
    ),
  ];
}

export function applyPiOperatorUiState(ctx: ExtensionContext, state: PiOperatorUiState): void {
  if (!ctx.hasUI) {
    return;
  }

  ctx.ui.setStatus('repo-agent', state.statusText);
  ctx.ui.setWidget(state.widgetKey, [...state.widgetLines], { placement: 'aboveEditor' });
}

export function setPiWorkflowProgress(ctx: ExtensionContext, phase: string): void {
  if (!ctx.hasUI) {
    return;
  }

  ctx.ui.setStatus('repo-progress', phase);
  ctx.ui.setWorkingVisible(true);
  ctx.ui.setWorkingMessage(phase);
}

export function clearPiWorkflowProgress(ctx: ExtensionContext): void {
  if (!ctx.hasUI) {
    return;
  }

  ctx.ui.setStatus('repo-progress', undefined);
  ctx.ui.setWorkingVisible(false);
  ctx.ui.setWorkingMessage();
}

function summarizeGateReport(
  report:
    | PiPrecommitWorkflowResult['repositoryPolicies']
    | PiPrecommitWorkflowResult['qualityGates'],
): string[] {
  if (report.skipped) {
    return [`${report.label}: skipped`];
  }

  return [
    `${report.label}: ${report.passed ? 'passed' : 'attention'}`,
    ...report.results.slice(0, 4).map((result) => {
      const suffix = result.summary ? ` (${result.summary})` : '';
      return `- ${result.label}: ${result.status}${suffix}`;
    }),
  ];
}

function previewResponseLines(content: string): string[] {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (lines.length === 0) {
    return ['preview: (empty response)'];
  }

  return ['preview:', ...lines.map((line) => `  ${line}`)];
}

function normalizeMode(value?: string): 'deterministic' | 'exploratory' | undefined {
  if (value === 'deterministic' || value === 'exploratory') {
    return value;
  }
  return undefined;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
