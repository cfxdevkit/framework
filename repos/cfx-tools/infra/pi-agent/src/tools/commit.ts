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

export async function executePiCommitSession(options: {
  prompt?: string;
  quick?: boolean;
  model?: string;
}): Promise<PiCommitWorkflowResult | null> {
  const args: string[] = [];
  if (options.quick) args.push('--quick');
  if (options.prompt) args.push(options.prompt);

  const commitPolicy = await resolveCommitRuntimePolicy(options.model);
  const { result } = await withScopedCommitPolicy(commitPolicy.profileOverride, async () =>
    withCapturedConsole(
      async () =>
        await executePiCommitWorkflow(args, { modelPolicies: commitPolicy.modelPolicies }),
    ),
  );
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
