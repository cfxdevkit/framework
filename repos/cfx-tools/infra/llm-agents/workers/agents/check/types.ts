export const repoCheckCommand = ['cdk', 'repo', 'check'] as const;
export const validationArtifactPath = 'artifacts/llm/repo-check/checks/validation.json';

export type AgentCheckFlags = {
  quick: boolean;
  dryRun: boolean;
  createBranch: boolean;
  draftPr: boolean;
  createChanges: boolean;
};

export type AgentCheckValidationStep = {
  id: string;
  status: 'ok' | 'warning' | 'error' | 'skipped';
  summary: string;
  command: string;
  details?: {
    stdoutTail?: string[];
    stderrTail?: string[];
    hardViolations?: Array<{ path: string; lines: number; hotspotScore: number }>;
    softWarnings?: Array<{ path: string; lines: number; hotspotScore: number }>;
    groups?: Array<{ directory: string; prefix: string; extension: string; files: string[] }>;
  };
};

export type AgentCheckValidationReport = {
  status: 'ok' | 'warning' | 'error';
  summary: {
    totalSteps: number;
    passed: number;
    warnings: number;
    errors: number;
  };
  report: {
    steps: AgentCheckValidationStep[];
  };
};

export type AgentCheckPlanChange = {
  name: string;
  title: string;
  rationale: string;
  issues: string[];
};

export type AgentCheckPlan = {
  summary: string;
  changes: AgentCheckPlanChange[];
  branch: {
    name: string;
    title: string;
    bodyLines: string[];
  };
  handoff: {
    cloudPromptLines: string[];
    notes: string[];
  };
};

export type AgentCheckArtifact = {
  name: string;
  proposalPath: string;
  designPath: string;
  specPaths: string[];
  tasksPath: string;
};

export type AgentCheckFollowUp = {
  branch: {
    requested: boolean;
    name: string | null;
    status: 'skipped' | 'created' | 'switched' | 'active' | 'error';
    message?: string;
  };
  draftPr: {
    requested: boolean;
    status: 'skipped' | 'created' | 'error';
    url?: string;
    message?: string;
  };
};

export type OpenSpecInstructionArtifactId = 'proposal' | 'design' | 'specs' | 'tasks';

export type OpenSpecInstruction = {
  artifactId: OpenSpecInstructionArtifactId;
  outputPath: string;
  instruction: string;
  template: string;
};

export type OpenSpecInstructionSet = Record<OpenSpecInstructionArtifactId, OpenSpecInstruction>;

export type AgentCheckArtifactDraft = {
  proposal: string;
  design: string;
  specs: Array<{ name: string; content: string }>;
  tasks: string;
};

export function normalizeAgentCheckChange(change: unknown): AgentCheckPlanChange | null {
  if (!change || typeof change !== 'object') return null;
  const record = change as Record<string, unknown>;
  const name = normalizeKebab(
    typeof record.name === 'string' ? record.name : 'repo-check-remediation',
  );
  const title = normalizeLine(typeof record.title === 'string' ? record.title : name);
  const rationale = normalizeLine(typeof record.rationale === 'string' ? record.rationale : '');
  const issues = normalizeStringArray(record.issues, []);
  if (!rationale || !issues.length) return null;
  return { name, title, rationale, issues };
}

export function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const lines = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trimEnd())
    .filter(Boolean);
  return lines.length > 0 ? lines : fallback;
}

export function normalizeLine(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeKebab(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^opsx\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function joinLines(lines: string[]): string {
  return lines.join('\n').trimEnd();
}

export function stripMarkdownFences(content: string): string {
  const text = content.trim();
  return text.match(/```(?:md|markdown)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim() ?? text;
}
