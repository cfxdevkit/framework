import { beforeEach, describe, expect, it, vi } from 'vitest';

const providerBridgeMocks = vi.hoisted(() => ({
  createPiProviderBridge: vi.fn(),
}));

const runtimeMocks = vi.hoisted(() => ({
  getPiActionDefinitions: vi.fn(),
}));

const toolMocks = vi.hoisted(() => ({
  executePiRepoAction: vi.fn(),
  executePiCommitSession: vi.fn(),
}));

vi.mock('./providers.js', () => ({
  createPiProviderBridge: providerBridgeMocks.createPiProviderBridge,
}));

vi.mock('./llm-agents-runtime.js', () => ({
  getPiActionDefinitions: runtimeMocks.getPiActionDefinitions,
}));

vi.mock('./tools.js', () => ({
  executePiRepoAction: toolMocks.executePiRepoAction,
  executePiCommitSession: toolMocks.executePiCommitSession,
}));

import { registerPiRepoCommands } from './commands.js';

describe('registerPiRepoCommands', () => {
  beforeEach(() => {
    providerBridgeMocks.createPiProviderBridge.mockReset();
    runtimeMocks.getPiActionDefinitions.mockReset();
    toolMocks.executePiRepoAction.mockReset();
    toolMocks.executePiCommitSession.mockReset();

    providerBridgeMocks.createPiProviderBridge.mockResolvedValue({
      scope: 'scripts',
      providerType: 'litellm',
      providerStrategy: 'auto',
      configPath: '/workspaces/root/artifacts/llm/config/units/scripts.json',
      defaultModel: 'Qwen3-Coder-Next-GGUF',
      pi: {
        provider: 'litellm',
        model: 'Qwen3-Coder-Next-GGUF',
        baseUrl: 'http://localhost:4000',
        apiKeyEnv: 'LITELLM_KEY',
      },
    });
    runtimeMocks.getPiActionDefinitions.mockResolvedValue([
      { name: 'review', definition: { title: 'Review changes', mode: 'deterministic' } },
      { name: 'health', definition: { title: 'Check repo health', mode: 'exploratory' } },
    ]);
  });

  it('writes repo status into the session stream instead of a widget', async () => {
    const commands = new Map<string, (args: string, ctx: any) => Promise<void>>();
    const registerMessageRenderer = vi.fn();
    const sendMessage = vi.fn();
    registerPiRepoCommands({
      registerCommand: vi.fn(
        (name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) => {
          commands.set(name, options.handler);
        },
      ),
      registerMessageRenderer,
      sendMessage,
    } as never);

    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
        notify: vi.fn(),
        setWorkingVisible: vi.fn(),
        setWorkingMessage: vi.fn(),
      },
    };

    await commands.get('repo-status')?.('', ctx);

    expect(registerMessageRenderer).toHaveBeenCalledWith(
      'repo-agent-summary',
      expect.any(Function),
    );
    expect(ctx.ui.setStatus).toHaveBeenCalledWith('repo-agent', 'repo:scripts');
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'repo-agent-summary',
        content: 'Repo agent context',
        display: true,
        details: expect.objectContaining({
          title: 'Repo agent context',
          lines: expect.arrayContaining(['provider: litellm', 'actions: 2']),
        }),
      }),
    );
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-context', undefined, {
      placement: 'aboveEditor',
    });
    expect(ctx.ui.notify).not.toHaveBeenCalled();
  });

  it('writes repo action results into the session stream and clears progress state', async () => {
    const commands = new Map<string, (args: string, ctx: any) => Promise<void>>();
    const sendMessage = vi.fn();
    registerPiRepoCommands({
      registerCommand: vi.fn(
        (name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) => {
          commands.set(name, options.handler);
        },
      ),
      registerMessageRenderer: vi.fn(),
      sendMessage,
    } as never);

    toolMocks.executePiRepoAction.mockResolvedValue({
      action: 'review',
      definition: { title: 'Review changes', mode: 'deterministic' },
      executionContext: {
        unit: { name: 'scripts' },
        llm: { provider: 'litellm', model: 'Qwen3-Coder-Next-GGUF' },
      },
      response: { content: 'First line\nSecond line\nThird line\nFourth line\nFifth line' },
    });

    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
        notify: vi.fn(),
        setWorkingVisible: vi.fn(),
        setWorkingMessage: vi.fn(),
      },
    };

    await commands.get('repo-run')?.('review --quick focus scripts', ctx);

    expect(toolMocks.executePiRepoAction).toHaveBeenCalledWith({
      action: 'review',
      prompt: 'focus scripts',
      quick: true,
    });
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'repo-agent-summary',
        content: 'Repo workflow',
        details: expect.objectContaining({
          tone: 'success',
          lines: expect.arrayContaining(['action: review', 'mode: deterministic']),
        }),
      }),
    );
    expect(ctx.ui.setWorkingVisible).toHaveBeenNthCalledWith(1, true);
    expect(ctx.ui.setWorkingVisible).toHaveBeenLastCalledWith(false);
    expect(ctx.ui.notify).not.toHaveBeenCalled();
  });

  it('writes blocked commit workflow summaries into the session stream', async () => {
    const commands = new Map<string, (args: string, ctx: any) => Promise<void>>();
    const sendMessage = vi.fn();
    registerPiRepoCommands({
      registerCommand: vi.fn(
        (name: string, options: { handler: (args: string, ctx: any) => Promise<void> }) => {
          commands.set(name, options.handler);
        },
      ),
      registerMessageRenderer: vi.fn(),
      sendMessage,
    } as never);

    toolMocks.executePiCommitSession.mockResolvedValue({
      command: 'commit',
      status: 'blocked',
      phase: 'quality-gates',
      executionContext: {
        unit: { name: 'scripts' },
        llm: { provider: 'litellm', model: 'Qwen3-Coder-Next-GGUF' },
      },
      repositoryPolicies: {
        label: 'Repository policy gates',
        passed: true,
        skipped: false,
        results: [],
      },
      qualityGates: {
        label: 'Quality gates',
        passed: false,
        skipped: false,
        results: [{ label: 'Typecheck', status: 'error', summary: 'type mismatch' }],
      },
      approval: {
        required: false,
        approved: false,
        declined: false,
      },
      failureAnalysis: {
        attempted: true,
        usedLlm: true,
        status: 'ready',
        content: 'Summary\nMinimal fixes\nNext commands',
      },
      blockedBy: 'quality-gates',
    });

    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
        notify: vi.fn(),
        setWorkingVisible: vi.fn(),
        setWorkingMessage: vi.fn(),
      },
    };

    await commands.get('repo-commit')?.('Focus release cleanup', ctx);

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'repo-agent-summary',
        content: 'Commit workflow',
        details: expect.objectContaining({
          tone: 'warning',
          lines: expect.arrayContaining([
            'status: blocked',
            'phase: quality-gates',
            'failure guidance:',
          ]),
        }),
      }),
    );
    expect(ctx.ui.notify).not.toHaveBeenCalled();
  });
});
