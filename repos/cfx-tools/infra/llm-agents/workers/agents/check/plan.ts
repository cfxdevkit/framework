import { completeStructuredAgent } from '../../completion/index.ts';
import { renderCommandBlock } from '../../completion/runner.ts';
import { normalizeAgentCheckPlan } from './render.ts';
import type {
  AgentCheckFlags,
  AgentCheckPlan,
  AgentCheckValidationReport,
  AgentCheckValidationStep,
} from './types.ts';

export function collectActionableValidationSteps(
  validation: AgentCheckValidationReport,
): AgentCheckValidationStep[] {
  return validation.report.steps.filter(
    (step) => step.status === 'warning' || step.status === 'error',
  );
}

export function summarizeValidationForPrompt(validation: AgentCheckValidationReport): string {
  const lines = [
    `Status: ${validation.status}`,
    `Totals: ${validation.summary.passed}/${validation.summary.totalSteps} passed, ${validation.summary.warnings} warning(s), ${validation.summary.errors} error(s).`,
    '',
    'Actionable steps:',
  ];
  for (const step of validation.report.steps) {
    if (step.status === 'ok' || step.status === 'skipped') continue;
    lines.push(`- ${step.id} (${step.status}): ${step.summary}`);
    lines.push(`  Reproduce: ${step.command}`);
    if (step.details?.hardViolations?.length) {
      for (const violation of step.details.hardViolations.slice(0, 5)) {
        lines.push(
          `  Hard hotspot: ${violation.path} (${violation.lines} lines, score ${violation.hotspotScore})`,
        );
      }
    }
    if (step.details?.softWarnings?.length) {
      for (const warning of step.details.softWarnings.slice(0, 3)) {
        lines.push(
          `  Soft hotspot: ${warning.path} (${warning.lines} lines, score ${warning.hotspotScore})`,
        );
      }
    }
    if (step.details?.groups?.length) {
      for (const group of step.details.groups.slice(0, 5)) {
        lines.push(
          `  Kebab group: ${group.directory} ${group.prefix}*${group.extension} -> ${group.files.join(', ')}`,
        );
      }
    }
    for (const line of collectSignalLines(step).slice(0, 6)) {
      lines.push(`  Signal: ${line}`);
    }
  }
  return lines.join('\n');
}

function collectSignalLines(step: AgentCheckValidationStep): string[] {
  return [...(step.details?.stderrTail ?? []), ...(step.details?.stdoutTail ?? [])]
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('> @cfxdevkit/'))
    .filter((line) => !line.startsWith('▮▮▮▮ '));
}

export async function buildAgentCheckPlan(params: {
  repoCheck: { exitCode: number; stdout: string; stderr: string };
  validation: AgentCheckValidationReport;
  actionableSteps: AgentCheckValidationStep[];
  flags: AgentCheckFlags;
}): Promise<AgentCheckPlan> {
  const repoCheckBlock = renderCommandBlock(
    'pnpm cdk repo check',
    params.repoCheck.exitCode,
    params.repoCheck.stdout,
    params.repoCheck.stderr,
    params.flags.quick ? 12000 : 24000,
  );
  const validationSummary = summarizeValidationForPrompt(params.validation);
  const systemPrompt = [
    'You are a repository planning assistant for a TypeScript monorepo using OpenSpec.',
    'Analyze the repo-check output and propose only change grouping and handoff planning, never code edits.',
    'Return strict JSON only, with no markdown fence and no explanatory text.',
    'Schema: {"summary":"...","changes":[{"name":"kebab-case","title":"...","rationale":"...","issues":["..."]}],"branch":{"name":"opsx/...","title":"...","bodyLines":["..."]},"handoff":{"cloudPromptLines":["..."],"notes":["..."]}}.',
    'Each change must stay within repo-check remediation scope and should group only closely related failures.',
    'Prefer 1 change when issues are coupled; use at most 3 changes when separation materially reduces implementation risk.',
    'Do not include artifact body text in this response. Artifact enrichment happens in a later step using live OpenSpec instructions and templates.',
  ].join(' ');
  const userPrompt = [
    'Current repo-check execution:',
    repoCheckBlock,
    '',
    'Validation artifact summary:',
    validationSummary,
    '',
    'OpenSpec constraints:',
    '- Planning must lead to apply-ready OpenSpec artifacts in the next phase.',
    '- Keep scopes contained so the cloud LLM can implement and validate them independently.',
    '',
    'Plan the OpenSpec change set and branch/PR handoff now.',
  ].join('\n');

  const response = await completeStructuredAgent({
    action: 'agent-check',
    flags: { noThinking: false, model: undefined },
    systemPrompt,
    userPrompt,
    maxTokens: params.flags.quick ? 3600 : 7200,
  });

  try {
    return normalizeAgentCheckPlan(response.content);
  } catch {
    const retry = await completeStructuredAgent({
      action: 'agent-check',
      flags: { noThinking: false, model: undefined },
      systemPrompt: `${systemPrompt} The previous response was invalid. Return exactly one compact JSON object. No markdown.`,
      userPrompt: [
        'Previous invalid response excerpt:',
        response.content.slice(0, 1200),
        '',
        userPrompt.slice(0, params.flags.quick ? 7000 : 18000),
      ].join('\n'),
      maxTokens: params.flags.quick ? 3200 : 6400,
    });
    return normalizeAgentCheckPlan(retry.content);
  }
}
