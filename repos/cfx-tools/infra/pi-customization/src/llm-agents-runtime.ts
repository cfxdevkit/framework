/**
 * Interface layer for @cfxdevkit/llm-agents.
 *
 * In the PI-integrated path, this imports directly from @cfxdevkit/llm-agents
 * (the built dist), falling back to source imports during development.
 */

export type PiRepoActionMode = 'deterministic' | 'exploratory';

export interface PiRepoActionDefinition {
  readonly title: string;
  readonly description: string;
  readonly mode: PiRepoActionMode;
}

export interface PiExecutionContextPayload {
  readonly unit: {
    readonly name: string;
    readonly rootDir: string;
    readonly configPath: string;
  } | null;
  readonly llm: {
    readonly used: boolean;
    readonly status: 'not-used' | 'ready' | 'unavailable';
    readonly configPath: string;
    readonly provider?: string;
    readonly baseUrl?: string | null;
    readonly model?: string | null;
    readonly error?: string;
  };
}

export interface PiRepoActionExecutionResult {
  readonly action: string;
  readonly definition: PiRepoActionDefinition;
  readonly executionContext: PiExecutionContextPayload;
  readonly response: {
    readonly content: string;
  };
}

export interface PiGateResult {
  readonly label: string;
  readonly status: 'ok' | 'warning' | 'error' | 'skipped';
  readonly summary: string;
}

export interface PiGateReport {
  readonly label: string;
  readonly passed: boolean;
  readonly skipped: boolean;
  readonly results: readonly PiGateResult[];
}

export interface PiGateFailureAnalysis {
  readonly attempted: boolean;
  readonly usedLlm: boolean;
  readonly status: 'not-needed' | 'ready' | 'unavailable' | 'failed';
  readonly content: string | null;
  readonly error?: string;
}

export interface PiPrecommitWorkflowResult {
  readonly command: 'precommit';
  readonly status: 'passed' | 'forced' | 'blocked';
  readonly phase: 'repository-policy-gates' | 'quality-gates' | 'completed';
  readonly executionContext: PiExecutionContextPayload;
  readonly repositoryPolicies: PiGateReport;
  readonly qualityGates: PiGateReport;
  readonly failureAnalysis: PiGateFailureAnalysis | null;
  readonly blockedBy?: 'repository-policy' | 'quality-gates';
}

export interface PiAgentCheckValidationStep {
  readonly id: string;
  readonly status: 'ok' | 'warning' | 'error' | 'skipped';
  readonly summary: string;
  readonly command: string;
}

export interface PiAgentCheckArtifact {
  readonly name: string;
  readonly proposalPath: string;
  readonly designPath: string;
  readonly specPaths: readonly string[];
  readonly tasksPath: string;
}

export interface PiAgentCheckResult {
  readonly generatedAt: string;
  readonly status: 'ok' | 'planned' | 'warning-planned';
  readonly executionContext: PiExecutionContextPayload;
  readonly validation: {
    readonly status: 'ok' | 'warning' | 'error';
    readonly summary: {
      readonly totalSteps: number;
      readonly passed: number;
      readonly warnings: number;
      readonly errors: number;
    };
    readonly actionableSteps: readonly PiAgentCheckValidationStep[];
  };
  readonly plan: null | {
    readonly summary: string;
    readonly changes: readonly {
      readonly name: string;
      readonly title: string;
      readonly rationale: string;
      readonly issues: readonly string[];
    }[];
    readonly branch: {
      readonly name: string;
      readonly title: string;
    };
    readonly handoff: {
      readonly cloudPromptLines: readonly string[];
      readonly notes: readonly string[];
    };
  };
  readonly artifacts: readonly PiAgentCheckArtifact[];
  readonly followUp: {
    readonly branch: {
      readonly requested: boolean;
      readonly name: string | null;
      readonly status: 'skipped' | 'created' | 'switched' | 'active' | 'error';
      readonly message?: string;
    };
    readonly draftPr: {
      readonly requested: boolean;
      readonly status: 'skipped' | 'created' | 'error';
      readonly url?: string;
      readonly message?: string;
    };
  };
  readonly dryRun: boolean;
}

export interface PiCommitWorkflowResult {
  readonly command: 'commit';
  readonly status: 'blocked' | 'approval-required' | 'aborted' | 'dry-run' | 'committed';
  readonly phase:
    | 'repository-policy-gates'
    | 'quality-gates'
    | 'preflight'
    | 'scope-detection'
    | 'release-intent'
    | 'message-generation'
    | 'approval'
    | 'post-checks'
    | 'completed';
  readonly executionContext: PiExecutionContextPayload;
  readonly repositoryPolicies: PiGateReport;
  readonly qualityGates: PiGateReport;
  readonly postGenerationQualityGates?: PiGateReport;
  readonly commitPreview?: {
    readonly subject: string;
    readonly body: string;
  };
  readonly approval: {
    readonly required: boolean;
    readonly approved: boolean;
    readonly declined: boolean;
  };
  readonly failureAnalysis: PiGateFailureAnalysis | null;
  readonly blockedBy?: 'repository-policy' | 'quality-gates' | 'post-checks';
  readonly generatedFiles?: readonly string[];
  readonly dryRun?: boolean;
  readonly sha?: string;
  // Whether the workflow was aborted before completion (e.g. user cancelled via Esc).
  readonly aborted?: boolean;
}

// ---------------------------------------------------------------------------
// Type aliases for llm-agents module interface
// ---------------------------------------------------------------------------

interface LlmAgentsModule {
  readonly executeAction: (args: string[]) => Promise<PiRepoActionExecutionResult>;
  readonly getActionDefinitions: () => readonly {
    name: string;
    definition: PiRepoActionDefinition;
  }[];
  readonly runAgentCheck: (
    rawArgs: readonly string[],
    opts?: { silent?: boolean },
  ) => Promise<PiAgentCheckResult>;
  readonly runCommitWorkflow: (
    args: string[],
    options?: {
      approvalMode?: 'defer' | 'prompt' | 'auto-approve';
      modelPolicies?: {
        messageGenerationModel?: string | null;
        failureAnalysisModel?: string | null;
      };
      tuiConfirm?: ((question: string) => Promise<boolean>) | null;
      onProgress?: (phase: string, detail?: string) => void;
      onAbort?: () => void;
      signal?: AbortSignal;
    },
  ) => Promise<PiCommitWorkflowResult | null>;
}

// ---------------------------------------------------------------------------
// Runtime imports — direct from @cfxdevkit/llm-agents
// ---------------------------------------------------------------------------

let _module: LlmAgentsModule | null = null;

async function ensureModule(): Promise<LlmAgentsModule> {
  if (_module) return _module;

  // Try importing from @cfxdevkit/llm-agents (built dist).
  try {
    const mod = (await import('@cfxdevkit/llm-agents')) as unknown as LlmAgentsModule;
    _module = mod;
  } catch {
    // If @cfxdevkit/llm-agents isn't available (dev environment),
    // we'll throw at call time with a helpful error.
    _module = {
      getActionDefinitions: async () => {
        throw new Error(
          '@cfxdevkit/llm-agents is not installed. ' + 'Run `pnpm install` in the workspace.',
        );
      },
      executeAction: async () => {
        throw new Error('@cfxdevkit/llm-agents is not installed.');
      },
      runAgentCheck: async () => {
        throw new Error('@cfxdevkit/llm-agents is not installed.');
      },
      runCommitWorkflow: async () => null,
    } as unknown as LlmAgentsModule;
  }

  return _module;
}

export async function getPiActionDefinitions(): Promise<
  readonly { name: string; definition: PiRepoActionDefinition }[]
> {
  return (await ensureModule()).getActionDefinitions();
}

export async function executePiAction(args: string[]): Promise<PiRepoActionExecutionResult> {
  return await (await ensureModule()).executeAction(args);
}

export async function executePiAgentCheck(options: {
  dryRun?: boolean;
  createBranch?: boolean;
  createChanges?: boolean;
  quick?: boolean;
}): Promise<PiAgentCheckResult> {
  const args: string[] = [];
  if (options.quick) args.push('--quick');
  if (options.dryRun) args.push('--dry-run');
  if (options.createBranch) args.push('--create-branch');
  if (!options.createChanges) args.push('--no-create');
  return await (await ensureModule()).runAgentCheck(args, { silent: true });
}

export async function executePiCommitWorkflow(
  args: string[],
  options?: {
    modelPolicies?: {
      readonly messageGenerationModel?: string | null;
      readonly failureAnalysisModel?: string | null;
    };
    approvalMode?: 'defer' | 'prompt' | 'auto-approve';
    tuiConfirm?: ((question: string) => Promise<boolean>) | null;
    onProgress?: (phase: string, detail?: string) => void;
    onAbort?: () => void;
    signal?: AbortSignal;
  },
): Promise<PiCommitWorkflowResult | null> {
  return await (await ensureModule()).runCommitWorkflow(args, {
    approvalMode: options?.approvalMode ?? 'defer',
    ...(options?.modelPolicies ? { modelPolicies: options.modelPolicies } : {}),
    ...(options?.tuiConfirm ? { tuiConfirm: options.tuiConfirm } : {}),
    ...(options?.onProgress ? { onProgress: options.onProgress } : {}),
    ...(options?.onAbort ? { onAbort: options.onAbort } : {}),
    ...(options?.signal ? { signal: options.signal } : {}),
  });
}
