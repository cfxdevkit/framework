import type {
  runHotspotsCheck,
  runKebabGroupsCheck,
  runUnitConfigsCheck,
} from '@cfxdevkit/arch-check';

export const defaultSoftLimit = 250;
export const defaultHardLimit = 300;
export const defaultSince = '90 days ago';
export const metadataRootRelativePath = 'artifacts/llm/repo-check';

export const repoCommandDefinitions = {
  'gitnexus-analyze': { script: 'gitnexus:analyze', artifactGroup: 'commands' },
  build: { script: 'build', artifactGroup: 'commands' },
  test: { script: 'test', artifactGroup: 'commands' },
  lint: { script: 'lint', artifactGroup: 'commands' },
  typecheck: { script: 'typecheck', artifactGroup: 'commands' },
  check: { script: 'check', artifactGroup: 'commands' },
  clean: { script: 'clean', artifactGroup: 'commands' },
  format: { script: 'format', artifactGroup: 'commands' },
  'format-check': { script: 'format:check', artifactGroup: 'commands' },
  'check-unused': { script: 'check:unused', artifactGroup: 'commands' },
  'security-audit': { script: 'security:audit', artifactGroup: 'commands' },
  'security-check': { script: 'security:check', artifactGroup: 'commands' },
  'check-docs': { script: 'check:docs', artifactGroup: 'checks' },
  'check-ci': { script: 'check:ci', artifactGroup: 'checks' },
  'check-secrets': { script: 'check:secrets', artifactGroup: 'checks' },
  'check-corpus': { script: 'check:corpus', artifactGroup: 'checks' },
  'check-eval': { script: 'check:eval', artifactGroup: 'checks' },
  'generate-api': { script: 'gen:api', artifactGroup: 'generate' },
  'generate-readme': { script: 'gen:readme', artifactGroup: 'generate' },
  'generate-structure': { script: 'gen:structure', artifactGroup: 'generate' },
  'generate-unit-configs': { script: 'gen:unit-configs', artifactGroup: 'generate' },
  'arch-check': { script: 'arch:check', artifactGroup: 'checks' },
} as const;

export type HotspotOptions = Parameters<typeof runHotspotsCheck>[0];
export type HotspotReport = Awaited<ReturnType<typeof runHotspotsCheck>>;
export type HotspotRecord = HotspotReport['hotspots'][number];
export type KebabGroupOptions = Parameters<typeof runKebabGroupsCheck>[0];
export type KebabGroupReport = Awaited<ReturnType<typeof runKebabGroupsCheck>>;
export type KebabGroupRecord = KebabGroupReport['groups'][number];
export type UnitConfigOptions = Parameters<typeof runUnitConfigsCheck>[0];
export type UnitConfigReport = Awaited<ReturnType<typeof runUnitConfigsCheck>>;
export type UnitConfigRecord = UnitConfigReport['units'][number];

export type RepoCheckTarget = 'validation' | 'hotspots' | 'kebab-groups' | 'unit-configs';
export type RepoCommandTarget = keyof typeof repoCommandDefinitions;

export type RepoValidationStepId =
  | 'gitnexus-analyze'
  | 'format'
  | 'lint'
  | 'typecheck'
  | 'test'
  | 'hotspots'
  | 'kebab-groups'
  | 'check';

export type GitNexusRepositorySummary = {
  name: string;
  path: string;
  indexedAt: string | null;
  commit: string | null;
  stats: {
    files: number | null;
    symbols: number | null;
    edges: number | null;
  };
  clusters: number | null;
  processes: number | null;
};

export type GitNexusSnapshot = {
  repository: string;
  indexedAt: string | null;
  indexedCommit: string | null;
  currentCommit: string | null;
  status: string | null;
  repositories: GitNexusRepositorySummary[];
};

export type RepoStructuredBase<TAction extends 'check' | 'command', TTarget extends string> = {
  kind: 'repo-structured';
  command: {
    namespace: 'repo';
    action: TAction;
    target: TTarget;
    script: string;
    args: string[];
    outputMode: 'text' | 'json';
  };
  context: {
    workspaceRoot: '.';
    requestedFrom: string;
    metadataRoot: string;
    generatedAt: string;
    gitNexus: GitNexusSnapshot | null;
  };
  artifacts: {
    reportPath: string;
    workspaceNodePath: string;
    fileNodeRoot?: string;
    fileNodeCount?: number;
  };
  status: 'ok' | 'warning' | 'error';
  exitCode: number;
};

export type RepoCheckHotspotsResult = RepoStructuredBase<'check', 'hotspots'> & {
  summary: {
    scannedFiles: number;
    hardViolations: number;
    softWarnings: number;
  };
  report: {
    policy: {
      source: string;
      softFileLineLimit: number;
      hardFileLineLimit: number;
      churnWindow: string;
    };
    hotspots: HotspotRecord[];
    hardViolations: HotspotRecord[];
    softWarnings: HotspotRecord[];
  };
};

export type RepoCheckKebabGroupsResult = RepoStructuredBase<'check', 'kebab-groups'> & {
  summary: {
    scannedFiles: number;
    groups: number;
    groupedFiles: number;
  };
  report: {
    policy: {
      source: string;
      minGroupSize: number;
    };
    groups: KebabGroupRecord[];
  };
};

export type RepoCheckUnitConfigsResult = RepoStructuredBase<'check', 'unit-configs'> & {
  summary: {
    units: number;
    configured: number;
    missing: number;
    drifted: number;
    written: number;
  };
  report: {
    policy: {
      source: string;
    };
    units: UnitConfigRecord[];
  };
};

export type RepoValidationStepDetails = {
  stdoutTail?: string[];
  stderrTail?: string[];
  hardViolations?: HotspotRecord[];
  softWarnings?: HotspotRecord[];
  groups?: KebabGroupRecord[];
};

export type RepoValidationStepResult = {
  id: RepoValidationStepId;
  label: string;
  kind: 'command' | 'check';
  required: boolean;
  status: 'ok' | 'warning' | 'error' | 'skipped';
  exitCode: number;
  durationMs: number;
  summary: string;
  command: string;
  artifactPath: string;
  details?: RepoValidationStepDetails;
};

export type RepoCheckValidationResult = RepoStructuredBase<'check', 'validation'> & {
  summary: {
    totalSteps: number;
    passed: number;
    warnings: number;
    errors: number;
    stoppedEarly: boolean;
  };
  report: {
    policy: {
      source: string;
      continueOnError: boolean;
      selectedSteps: RepoValidationStepId[];
    };
    steps: RepoValidationStepResult[];
  };
};

export type RepoCommandResult = RepoStructuredBase<'command', RepoCommandTarget> & {
  summary: {
    durationMs: number;
    stdoutLineCount: number;
    stderrLineCount: number;
  };
  result: {
    stdoutTail: string[];
    stderrTail: string[];
  };
};

export type RepoStructuredResult =
  | RepoCheckValidationResult
  | RepoCheckHotspotsResult
  | RepoCheckKebabGroupsResult
  | RepoCheckUnitConfigsResult
  | RepoCommandResult;
