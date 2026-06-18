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
  tuiMode?: boolean;
  yes?: boolean;
}): Promise<PiCommitWorkflowResult | null> {
  const args: string[] = [];
  if (options.quick) args.push('--quick');
  if (options.yes) args.push('--yes');
  if (options.prompt) args.push(options.prompt);

  const commitPolicy = await resolveCommitRuntimePolicy(options.model);
  const { result } = await withScopedCommitPolicy(commitPolicy.profileOverride, async () => {
    // When running in TUI mode, skip terminal UI by using a no-op stdout.
    // The llm-agents commit workflow writes to stdout/stderr and calls
    // ui.pause()/confirmPrompt() for approval — both break the TUI.
    // We use a null stream to suppress all terminal UI output.
    const isTTY = typeof process.stdout.isTTY === 'boolean' ? process.stdout.isTTY : false;
    const isTTYStderr = typeof process.stderr.isTTY === 'boolean' ? process.stderr.isTTY : false;

    if (options.tuiMode && isTTY && isTTYStderr) {
      // TUI mode: suppress terminal UI by setting stdout to a no-op stream.
      // The commit workflow will still run all logic and return the result,
      // but won't write to stdout/stderr or pause the terminal.
      const originalStdout = process.stdout;
      const originalStderr = process.stderr;

      // Create a no-op write stream for stdout
      const noopWriteStream = {
        isTTY: false,
        write: () => true,
        destroy: () => {},
        end: () => {},
        on: () => noopWriteStream,
        once: () => noopWriteStream,
      } as unknown as typeof process.stdout;

      // Create a no-op write stream for stderr
      const noopWriteStreamStderr = {
        isTTY: false,
        write: () => true,
        destroy: () => {},
        end: () => {},
        on: () => noopWriteStreamStderr,
        once: () => noopWriteStreamStderr,
      } as unknown as typeof process.stderr;

      // Temporarily redirect stdout and stderr
      process.stdout = noopWriteStream;
      process.stderr = noopWriteStreamStderr;

      try {
        return await withCapturedConsole(
          async () =>
            await executePiCommitWorkflow(args, {
              modelPolicies: commitPolicy.modelPolicies,
              // Skip terminal UI approval — we'll use TUI-native approval instead
              approvalMode: 'defer',
            }),
        );
      } finally {
        // Restore original stdout and stderr
        process.stdout = originalStdout;
        process.stderr = originalStderr;
      }
    }

    return await withCapturedConsole(
      async () =>
        await executePiCommitWorkflow(args, { modelPolicies: commitPolicy.modelPolicies }),
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
