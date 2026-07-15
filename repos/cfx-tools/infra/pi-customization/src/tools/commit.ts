import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPiProgressReporter } from '@cfxdevkit/llm-agents';
import {
  type PiEffectiveActionPolicy,
  readPiConfig,
  resolveEffectiveActionPolicy,
} from '../config.js';
import { executePiCommitWorkflow, type PiCommitWorkflowResult } from '../llm-agents-runtime.js';
import { withCapturedConsole } from '../tools/utils.js';

// Flag to ensure PI_CODING_AGENT is set once so the commit workflow's
// createWorkflowTerminalUi detects the TUI and skips interactive cursor
// manipulation (moveCursor/clearScreenDown).
if (!process.env.PI_CODING_AGENT) {
  process.env.PI_CODING_AGENT = 'true';
}

export async function executePiCommitSession(options: {
  prompt?: string;
  quick?: boolean;
  model?: string;
  tuiMode?: boolean;
  yes?: boolean;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
  singlePassApproval?: boolean;
  tuiConfirm?: ((question: string) => Promise<boolean>) | null;
  onProgress?: (phase: string, detail?: string) => void;
  onAbort?: () => void;
  signal?: AbortSignal;
  /** ExtensionContext for TUI mode — used to wire createPiProgressReporter */
  ctx?: {
    hasUI: boolean;
    ui?: {
      setWorkingVisible: (v: boolean) => void;
      setWorkingMessage: (m?: string) => void;
      setStatus: (k: string, v?: string) => void;
    };
  };
}): Promise<PiCommitWorkflowResult | null> {
  const args: string[] = [];
  if (options.quick) args.push('--quick');
  if (options.yes) args.push('--yes');
  if (options.prompt) args.push(options.prompt);

  const commitPolicy = await resolveCommitRuntimePolicy(options.model);

  // Wire createPiProgressReporter when tuiMode is true and ctx is provided
  const reporter =
    options.tuiMode && options.ctx && !options.onProgress
      ? createPiProgressReporter({
          ctx: options.ctx,
          onProgress: options.onProgress,
          onAbort: options.onAbort,
        })
      : null;

  const finalOnProgress = options.onProgress ?? reporter?.onProgress;
  const finalOnAbort = options.onAbort ?? reporter?.onAbort;

  if (options.singlePassApproval && options.tuiMode) {
    const { result } = await withScopedCommitPolicy(commitPolicy.profileOverride, async () => {
      return await withCapturedConsole(
        async () =>
          await executePiCommitWorkflow(args, {
            modelPolicies: commitPolicy.modelPolicies,
            approvalMode: 'prompt',
            ...(options.stdout ? { stdout: options.stdout } : {}),
            ...(options.stderr ? { stderr: options.stderr } : {}),
            ...(options.tuiConfirm ? { tuiConfirm: options.tuiConfirm } : {}),
            ...(finalOnProgress ? { onProgress: finalOnProgress } : {}),
            ...(finalOnAbort ? { onAbort: finalOnAbort } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
          }),
      );
    });
    return result;
  }

  const { result } = await withScopedCommitPolicy(commitPolicy.profileOverride, async () => {
    return await withCapturedConsole(
      async () =>
        await executePiCommitWorkflow(args, {
          modelPolicies: commitPolicy.modelPolicies,
          approvalMode: 'defer',
          ...(options.stdout ? { stdout: options.stdout } : {}),
          ...(options.stderr ? { stderr: options.stderr } : {}),
          ...(options.tuiConfirm ? { tuiConfirm: options.tuiConfirm } : {}),
          ...(finalOnProgress ? { onProgress: finalOnProgress } : {}),
          ...(finalOnAbort ? { onAbort: finalOnAbort } : {}),
          ...(options.signal ? { signal: options.signal } : {}),
        }),
    );
  });
  return result;
}

async function resolveCommitRuntimePolicy(explicitModel?: string): Promise<{
  readonly modelPolicies?: {
    readonly messageGenerationModel?: string | null;
    readonly failureAnalysisModel?: string | null;
  };
  readonly profileOverride?: Record<string, unknown>;
}> {
  const config = await readPiConfig();
  const commitPolicy = resolveEffectiveActionPolicy(config, { action: 'commit' });
  const messagePolicy = resolveEffectiveActionPolicy(config, {
    action: 'commit',
    phase: 'message-generation',
  });
  const failurePolicy = resolveEffectiveActionPolicy(config, {
    action: 'commit',
    phase: 'failure-analysis',
  });

  const messageGenerationModel = explicitModel ?? messagePolicy.model ?? commitPolicy.model ?? null;
  const failureAnalysisModel = explicitModel ?? failurePolicy.model ?? messageGenerationModel;
  const profileOverride = buildCommitProfileOverride(commitPolicy);

  return {
    ...(messageGenerationModel || failureAnalysisModel
      ? {
          modelPolicies: {
            ...(messageGenerationModel ? { messageGenerationModel } : {}),
            ...(failureAnalysisModel ? { failureAnalysisModel } : {}),
          },
        }
      : {}),
    ...(profileOverride ? { profileOverride } : {}),
  };
}

function buildCommitProfileOverride(
  commitPolicy: PiEffectiveActionPolicy,
): Record<string, unknown> | undefined {
  if (!commitPolicy.profile.exists || !commitPolicy.profile.provider) return undefined;
  return {
    provider: commitPolicy.profile.provider,
    baseUrl: commitPolicy.profile.baseUrl,
    defaultModel: commitPolicy.profile.defaultModel ?? commitPolicy.model ?? null,
    ...(commitPolicy.profile.requestTimeoutMs !== null
      ? { requestTimeoutMs: commitPolicy.profile.requestTimeoutMs }
      : {}),
    harness: { providerStrategy: commitPolicy.profile.providerStrategy },
  };
}

async function withScopedCommitPolicy<T>(
  profileOverride: Record<string, unknown> | undefined,
  work: () => Promise<T>,
): Promise<T> {
  if (!profileOverride) return await work();

  const directory = await mkdtemp(join(tmpdir(), 'cfxdevkit-pi-commit-'));
  const filePath = join(directory, 'llm.commit.json');
  const previous = process.env.CFXDEVKIT_LLM_CONFIG_PATH;
  await writeFile(filePath, `${JSON.stringify(profileOverride, null, 2)}\n`, 'utf8');
  process.env.CFXDEVKIT_LLM_CONFIG_PATH = filePath;
  try {
    return await work();
  } finally {
    if (previous === undefined) {
      delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
    } else {
      process.env.CFXDEVKIT_LLM_CONFIG_PATH = previous;
    }
    await rm(directory, { recursive: true, force: true });
  }
}
