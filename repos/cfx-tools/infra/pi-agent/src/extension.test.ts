import { beforeEach, describe, expect, it, vi } from 'vitest';

const providerBridgeMocks = vi.hoisted(() => ({
  createPiProviderBridge: vi.fn(),
  registerPiProviderBridge: vi.fn(),
}));

const actionDefinitionMocks = vi.hoisted(() => ({
  getPiActionDefinitions: vi.fn(),
}));

const commandMocks = vi.hoisted(() => ({
  registerPiRepoCommands: vi.fn(),
  registerPiCdkCommands: vi.fn(),
}));

const toolMocks = vi.hoisted(() => ({
  registerPiRepoTools: vi.fn(),
}));

vi.mock('./providers.js', () => ({
  createPiProviderBridge: providerBridgeMocks.createPiProviderBridge,
  registerPiProviderBridge: providerBridgeMocks.registerPiProviderBridge,
}));

vi.mock('./llm-agents-runtime.js', () => ({
  getPiActionDefinitions: actionDefinitionMocks.getPiActionDefinitions,
}));

vi.mock('./commands.js', () => ({
  registerPiRepoCommands: commandMocks.registerPiRepoCommands,
}));

vi.mock('./commands/cdk.js', () => ({
  registerPiCdkCommands: commandMocks.registerPiCdkCommands,
}));

vi.mock('./tools.js', () => ({
  registerPiRepoTools: toolMocks.registerPiRepoTools,
}));

import { registerPiAgentProjectExtension } from './extension.js';

describe('registerPiAgentProjectExtension', () => {
  beforeEach(() => {
    providerBridgeMocks.createPiProviderBridge.mockReset();
    providerBridgeMocks.registerPiProviderBridge.mockReset();
    actionDefinitionMocks.getPiActionDefinitions.mockReset();
    commandMocks.registerPiRepoCommands.mockReset();
    toolMocks.registerPiRepoTools.mockReset();

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
    actionDefinitionMocks.getPiActionDefinitions.mockResolvedValue([
      { name: 'review', definition: { title: 'Review changes', mode: 'deterministic' } },
    ]);
  });

  it('refreshes only the compact footer status on session start', async () => {
    const eventHandlers = new Map<string, (event: unknown, ctx: any) => Promise<void>>();
    const pi = {
      on: vi.fn((event: string, handler: (event: unknown, ctx: any) => Promise<void>) => {
        eventHandlers.set(event, handler);
      }),
    };

    await registerPiAgentProjectExtension(pi as never);

    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
        setWorkingVisible: vi.fn(),
        setWorkingMessage: vi.fn(),
      },
    };

    await eventHandlers.get('session_start')?.({}, ctx);

    expect(ctx.ui.setStatus).toHaveBeenCalledWith('repo-agent', 'repo:scripts');
    expect(ctx.ui.setWidget).not.toHaveBeenCalled();
  });

  it('clears all repo-agent widgets on shutdown', async () => {
    const eventHandlers = new Map<string, (event: unknown, ctx: any) => Promise<void>>();
    const pi = {
      on: vi.fn((event: string, handler: (event: unknown, ctx: any) => Promise<void>) => {
        eventHandlers.set(event, handler);
      }),
    };

    await registerPiAgentProjectExtension(pi as never);

    const ctx = {
      hasUI: true,
      ui: {
        setStatus: vi.fn(),
        setWidget: vi.fn(),
        setWorkingVisible: vi.fn(),
        setWorkingMessage: vi.fn(),
      },
    };

    await eventHandlers.get('session_shutdown')?.({}, ctx);

    expect(ctx.ui.setStatus).toHaveBeenCalledWith('repo-agent', undefined);
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-context', undefined, {
      placement: 'aboveEditor',
    });
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-actions', undefined, {
      placement: 'aboveEditor',
    });
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-workflow', undefined, {
      placement: 'aboveEditor',
    });
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-gates', undefined, {
      placement: 'aboveEditor',
    });
    expect(ctx.ui.setWidget).toHaveBeenCalledWith('repo-agent-commit', undefined, {
      placement: 'aboveEditor',
    });
  });
});
