import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type PiEffectiveActionPolicy,
  readPiConfig,
  resolveEffectiveActionPolicy,
} from '../config.js';
import { executePiCommitWorkflow, type PiCommitWorkflowResult } from '../llm-agents-runtime.js';
import { withCapturedConsole } from '../tools/utils.js';

// Flag to ensure PI_CODING_AGENT is set once so the commit workflow's
// createWorkflowTerminalUi detects the TUI and skips interactive cursor
// manipulation (moveCursor/clearScreenDown).  The commit workflow creates
// its own stdout/stderr redirection internally for approval prompts,
// so setting it in this file would be a no-op.  We set it here once at
// module load time so all downstream calls see it.
if (!process.env.PI_CODING_AGENT) {
  process.env.PI_CODING_AGENT = 'true';
}

export async function executePiCommitSession(options: {
  prompt?: string;
  quick?: boolean;
  model?: string;
  tuiMode?: boolean;
  yes?: boolean;
}): Promise<PiCommitWorkflowResult | null> {
  const args: string[] = [];
  if (options.quick) args.push('--quick');
  if (options.yes) args.push('--yes');
  if (options.prompt) args.push(options.prompt);

  const commitPolicy = await resolveCommitRuntimePolicy(options.model);
  const { result } = await withScopedCommitPolicy(commitPolicy.profileOverride, async () => {
    // In TUI mode the commit workflow's createWorkflowTerminalUi detects
    // PI_CODING_AGENT (set once at module load) and falls back to
    // sequential line output, so it never tries ANSI cursor manipulation.
    // We always use defer approval mode so the caller tool handles
    // approval via TUI-native confirm dialogs instead of terminal prompts.
    return await withCapturedConsole(
      async () =>
        await executePiCommitWorkflow(args, {
          modelPolicies: commitPolicy.modelPolicies,
          approvalMode: 'defer',
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
