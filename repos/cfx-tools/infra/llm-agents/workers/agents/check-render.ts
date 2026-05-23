import { parseJsonObject } from '../completion/index.ts';
import type {
  AgentCheckArtifact,
  AgentCheckFollowUp,
  AgentCheckPlan,
  AgentCheckValidationStep,
} from './check-types.ts';
import {
  normalizeAgentCheckChange,
  normalizeKebab,
  normalizeLine,
  normalizeStringArray,
} from './check-types.ts';

export function normalizeAgentCheckPlan(content: string): AgentCheckPlan {
  const parsed = parseAgentCheckJson(content);
  const changes = Array.isArray(parsed.changes)
    ? parsed.changes
        .map((change) => normalizeAgentCheckChange(change))
        .filter((change): change is AgentCheckPlan['changes'][number] => Boolean(change))
    : [];
  if (!changes.length) {
    throw new Error('Invalid agent-check JSON: missing changes');
  }

  const firstChange = changes[0];
  const branchName = normalizeKebab(
    parsed.branch?.name ||
      (changes.length === 1 && firstChange ? firstChange.name : 'repo-check-remediation'),
  );
  const branchTitle = normalizeLine(
    parsed.branch?.title ||
      `Plan fixes for ${changes.length === 1 && firstChange ? firstChange.title : 'repo check findings'}`,
  );

  return {
    summary: normalizeLine(
      parsed.summary || 'Planned OpenSpec changes for current repo-check findings.',
    ),
    changes,
    branch: {
      name: branchName.startsWith('opsx/') ? branchName : `opsx/${branchName}`,
      title: branchTitle,
      bodyLines: normalizeStringArray(parsed.branch?.bodyLines, [
        'This PR contains OpenSpec planning artifacts only.',
        'Implementation and validation are delegated to the cloud coding flow.',
      ]),
    },
    handoff: {
      cloudPromptLines: normalizeStringArray(parsed.handoff?.cloudPromptLines, [
        'Implement the attached OpenSpec changes only.',
        'Do not widen scope beyond the planned repo-check findings.',
        'Validate in the repo validation order before proposing merge.',
      ]),
      notes: normalizeStringArray(parsed.handoff?.notes, [
        'Keep local planning and cloud implementation as separate phases.',
      ]),
    },
  };
}

function parseAgentCheckJson(content: string): Partial<AgentCheckPlan> {
  try {
    return parseJsonObject(content) as Partial<AgentCheckPlan>;
  } catch {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new Error(`Invalid agent-check JSON: ${content.slice(0, 120)}`);
    }
    const candidate = content.slice(start, end + 1);
    return parseJsonCandidateWithRepairs(candidate) as Partial<AgentCheckPlan>;
  }
}

function parseJsonCandidateWithRepairs(candidate: string): unknown {
  const escaped = escapeRawNewlinesInJsonStrings(candidate);
  const attempts = [candidate, escaped, stripTrailingCommas(escaped)];
  let lastError: unknown = null;
  for (const attempt of [...new Set(attempts.filter(Boolean))]) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function escapeRawNewlinesInJsonStrings(text: string): string {
  let output = '';
  let inString = false;
  let escaped = false;
  for (const char of text) {
    if (inString) {
      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        output += char;
        escaped = true;
        continue;
      }
      if (char === '"') inString = false;
      if (char === '\n') output += '\\n';
      else if (char === '\r') output += '\\r';
      else output += char;
      continue;
    }
    if (char === '"') inString = true;
    output += char;
  }
  return output;
}

function stripTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, '$1');
}

export function renderAgentCheckReport(report: {
  generatedAt: string;
  status: string;
  command: { command: string; exitCode: number; artifactPath: string };
  validation: {
    status: string;
    summary: { totalSteps: number; passed: number; warnings: number; errors: number };
    actionableSteps: AgentCheckValidationStep[];
  };
  plan: {
    summary: string;
    changes: Array<{ name: string; title: string; rationale: string; issues: string[] }>;
    branch: { name: string; title: string; bodyLines: string[] };
    handoff: { cloudPromptLines: string[]; notes: string[] };
  } | null;
  artifacts: AgentCheckArtifact[];
  followUp: AgentCheckFollowUp;
  dryRun: boolean;
}): string {
  const lines = ['# Agent Check', '', `Generated: ${report.generatedAt}`, ''];
  lines.push('## Repo Check', '');
  lines.push(`- Command: ${report.command.command}`);
  lines.push(`- Exit code: ${report.command.exitCode}`);
  lines.push(`- Validation artifact: ${report.command.artifactPath}`);
  lines.push(
    `- Summary: ${report.validation.summary.passed}/${report.validation.summary.totalSteps} passed, ${report.validation.summary.warnings} warning(s), ${report.validation.summary.errors} error(s).`,
  );
  if (!report.plan) {
    lines.push(
      '',
      '## Planned Changes',
      '',
      'No actionable repo-check findings. No OpenSpec change was prepared.',
    );
  }
  if (report.plan) {
    lines.push('', '## Planned Changes', '');
    lines.push(report.plan.summary, '');
    for (const change of report.plan.changes) {
      lines.push(`### ${change.name}`, '');
      lines.push(`- Title: ${change.title}`);
      lines.push(`- Why: ${change.rationale}`);
      for (const issue of change.issues) lines.push(`- Issue: ${issue}`);
      lines.push('');
    }
    lines.push('## Handoff Branch', '');
    lines.push(`- Branch: ${report.plan.branch.name}`);
    lines.push(`- PR title: ${report.plan.branch.title}`);
    for (const line of report.plan.branch.bodyLines) lines.push(`- PR body: ${line}`);
    lines.push('', '## Cloud Handoff', '');
    for (const line of report.plan.handoff.cloudPromptLines) lines.push(`- ${line}`);
    if (report.plan.handoff.notes.length > 0) {
      lines.push('', '## Flow Notes', '');
      for (const line of report.plan.handoff.notes) lines.push(`- ${line}`);
    }
  }
  lines.push('', '## Branch / PR Follow-up', '');
  lines.push(`- Branch request: ${report.followUp.branch.requested ? 'yes' : 'no'}`);
  lines.push(`- Branch status: ${report.followUp.branch.status}`);
  if (report.followUp.branch.name) lines.push(`- Branch name: ${report.followUp.branch.name}`);
  if (report.followUp.branch.message)
    lines.push(`- Branch note: ${report.followUp.branch.message}`);
  lines.push(`- Draft PR request: ${report.followUp.draftPr.requested ? 'yes' : 'no'}`);
  lines.push(`- Draft PR status: ${report.followUp.draftPr.status}`);
  if (report.followUp.draftPr.url) lines.push(`- Draft PR URL: ${report.followUp.draftPr.url}`);
  if (report.followUp.draftPr.message)
    lines.push(`- Draft PR note: ${report.followUp.draftPr.message}`);
  lines.push('', '## Generated OpenSpec Artifacts', '');
  if (report.dryRun) {
    lines.push('- Dry run: no OpenSpec files were written.');
  } else if (report.artifacts.length > 0) {
    for (const artifact of report.artifacts) {
      lines.push(`- ${artifact.name}`);
      lines.push(`  proposal: ${artifact.proposalPath}`);
      lines.push(`  design: ${artifact.designPath}`);
      for (const specPath of artifact.specPaths) lines.push(`  spec: ${specPath}`);
      lines.push(`  tasks: ${artifact.tasksPath}`);
    }
  } else {
    lines.push('- No artifacts written.');
  }
  return lines.join('\n');
}

export function renderAgentCheckConsoleSummary(report: {
  status: string;
  executionContext?: {
    unit?: { name?: string; rootDir?: string } | null;
    llm?: {
      status?: string;
      configPath?: string;
      provider?: string;
      model?: string | null;
      baseUrl?: string | null;
      error?: string;
    } | null;
  };
  validation: {
    summary: { totalSteps: number; passed: number; warnings: number; errors: number };
  };
  plan: { changes: Array<{ name: string }>; branch: { name: string } } | null;
  artifacts: AgentCheckArtifact[];
  followUp: AgentCheckFollowUp;
  dryRun: boolean;
}): string {
  const unit = report.executionContext?.unit?.name
    ? `${report.executionContext.unit.name} (${report.executionContext.unit.rootDir ?? 'n/a'})`
    : 'shared repo config';
  const llm =
    report.executionContext?.llm?.status === 'ready'
      ? `${report.executionContext.llm.provider ?? 'unknown'} :: ${report.executionContext.llm.model ?? 'auto'}${report.executionContext.llm.baseUrl ? ` @ ${report.executionContext.llm.baseUrl}` : ''}`
      : report.executionContext?.llm?.status === 'not-used'
        ? 'not used'
        : `unavailable${report.executionContext?.llm?.error ? ` (${report.executionContext.llm.error})` : ''}`;

  const lines = ['agent:check complete'];
  lines.push(`- Unit: ${unit}`);
  lines.push(`- Config: ${report.executionContext?.llm?.configPath ?? '.pi/providers.json'}`);
  lines.push(`- LLM: ${llm}`);
  lines.push(
    `- Validation: ${report.validation.summary.passed}/${report.validation.summary.totalSteps} passed, ${report.validation.summary.warnings} warning(s), ${report.validation.summary.errors} error(s)`,
  );
  lines.push(`- Status: ${report.status}`);
  if (report.plan) {
    lines.push(`- Planned changes: ${report.plan.changes.map((c) => c.name).join(', ')}`);
    lines.push(
      `- Branch: ${report.followUp.branch.name ?? report.plan.branch.name} (${report.followUp.branch.status})`,
    );
  } else {
    lines.push('- Planned changes: none');
  }
  if (report.dryRun) {
    lines.push('- OpenSpec artifacts: dry run, no files written');
  } else if (report.artifacts.length > 0) {
    lines.push('- OpenSpec artifacts:');
    for (const artifact of report.artifacts) {
      lines.push(`  - ${artifact.name}: ${artifact.proposalPath}`);
      lines.push(`    design: ${artifact.designPath}`);
      for (const specPath of artifact.specPaths) lines.push(`    spec: ${specPath}`);
      lines.push(`    tasks: ${artifact.tasksPath}`);
    }
  } else {
    lines.push('- OpenSpec artifacts: none');
  }
  lines.push(
    '- Reports: artifacts/llm/reports/agent-check.md, artifacts/llm/reports/agent-check.json',
  );
  lines.push(
    '- Next: cdk agent interactive --local for local review, cdk agent interactive --github for cloud implementation',
  );
  return lines.join('\n');
}
