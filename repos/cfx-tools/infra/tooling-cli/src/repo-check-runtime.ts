import { existsSync } from 'node:fs';

const cdkRepoCheckPackageName = '@cfxdevkit/cdk-repo-check';
const cdkRepoCheckSourceModulePath = '../../../packages/cdk-repo-check/src/index.js';
const cdkRepoCheckSourceEntry = new URL(
  '../../../packages/cdk-repo-check/src/index.ts',
  import.meta.url,
);
const cdkRepoCheckDistEntry = new URL(
  '../../../packages/cdk-repo-check/dist/index.js',
  import.meta.url,
);

export type RepoCheckTarget = 'validation' | 'hotspots' | 'kebab-groups' | 'unit-configs';
export type RepoCommandTarget =
  | 'gitnexus-analyze'
  | 'build'
  | 'test'
  | 'lint'
  | 'typecheck'
  | 'check'
  | 'clean'
  | 'format'
  | 'format-check'
  | 'check-unused'
  | 'security-audit'
  | 'security-check'
  | 'check-docs'
  | 'check-ci'
  | 'check-secrets'
  | 'check-corpus'
  | 'check-eval'
  | 'generate-api'
  | 'generate-readme'
  | 'generate-structure'
  | 'generate-unit-configs'
  | 'arch-check';

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

type RepoStructuredBase<TAction extends 'check' | 'command', TTarget extends string> = {
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

export type RepoCheckHotspotRecord = {
  path: string;
  lines: number;
  commits: number;
  hotspotScore: number;
  overSoftLimit: boolean;
  overHardLimit: boolean;
  addedLines: number;
  deletedLines: number;
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
    hotspots: RepoCheckHotspotRecord[];
    hardViolations: RepoCheckHotspotRecord[];
    softWarnings: RepoCheckHotspotRecord[];
  };
};

export type RepoCheckKebabGroupRecord = {
  directory: string;
  prefix: string;
  extension: string;
  files: string[];
  count: number;
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
    groups: RepoCheckKebabGroupRecord[];
  };
};

export type RepoCheckUnitConfigRecord = {
  unit: string;
  rootDir: string;
  configPath: string;
  status: 'ok' | 'missing' | 'drift';
  findings: string[];
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
    units: RepoCheckUnitConfigRecord[];
  };
};

export type RepoValidationStepDetails = {
  stdoutTail?: string[];
  stderrTail?: string[];
  hardViolations?: RepoCheckHotspotRecord[];
  softWarnings?: RepoCheckHotspotRecord[];
  groups?: RepoCheckKebabGroupRecord[];
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

type RepoCheckModule = {
  runRepoCheck(target: RepoCheckTarget, args: readonly string[]): Promise<RepoStructuredResult>;
  runRepoCommand(target: RepoCommandTarget, args: readonly string[]): Promise<RepoCommandResult>;
};

export async function runRepoCheck(
  target: RepoCheckTarget,
  args: readonly string[],
): Promise<RepoStructuredResult> {
  const module = await loadRepoCheckModule();
  return await module.runRepoCheck(target, args);
}

export async function runRepoCommand(
  target: RepoCommandTarget,
  args: readonly string[],
): Promise<RepoCommandResult> {
  const module = await loadRepoCheckModule();
  return await module.runRepoCommand(target, args);
}

async function loadRepoCheckModule(): Promise<RepoCheckModule> {
  if (existsSync(cdkRepoCheckSourceEntry)) {
    return (await import(cdkRepoCheckSourceModulePath)) as RepoCheckModule;
  }

  if (existsSync(cdkRepoCheckDistEntry)) {
    return (await import(cdkRepoCheckPackageName)) as RepoCheckModule;
  }

  return (await import(cdkRepoCheckSourceModulePath)) as RepoCheckModule;
}
