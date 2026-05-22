const llmAgentsModulePath = '../../llm-agents/src/index.js';

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
}

interface LlmAgentsModule {
  readonly executeAction: (args: string[]) => Promise<PiRepoActionExecutionResult>;
  readonly getActionDefinitions: () => readonly {
    name: string;
    definition: PiRepoActionDefinition;
  }[];
  readonly runCommitWorkflow: (
    args: string[],
    options?: {
      approvalMode?: 'defer' | 'prompt' | 'auto-approve';
      modelPolicies?: {
        messageGenerationModel?: string | null;
        failureAnalysisModel?: string | null;
      };
    },
  ) => Promise<PiCommitWorkflowResult | null>;
}

export async function getPiActionDefinitions(): Promise<
  readonly { name: string; definition: PiRepoActionDefinition }[]
> {
  return (await loadLlmAgentsModule()).getActionDefinitions();
}

export async function executePiAction(args: string[]): Promise<PiRepoActionExecutionResult> {
  return await (await loadLlmAgentsModule()).executeAction(args);
}

export async function executePiCommitWorkflow(
  args: string[],
  options?: {
    modelPolicies?: {
      readonly messageGenerationModel?: string | null;
      readonly failureAnalysisModel?: string | null;
    };
  },
): Promise<PiCommitWorkflowResult | null> {
  return await (await loadLlmAgentsModule()).runCommitWorkflow(args, {
    approvalMode: 'defer',
    ...(options?.modelPolicies ? { modelPolicies: options.modelPolicies } : {}),
  });
}

async function loadLlmAgentsModule(): Promise<LlmAgentsModule> {
  return (await import(llmAgentsModulePath)) as LlmAgentsModule;
}
