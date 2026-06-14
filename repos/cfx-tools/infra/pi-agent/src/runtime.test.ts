import { spawn } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

const providerBridgeFactory = vi.hoisted(() => vi.fn());
const extensionFactory = vi.hoisted(() =>
  vi.fn((scope?: string) => ({ name: `repo-agent:${scope ?? 'shared'}` })),
);

vi.mock('./providers.js', () => ({
  createPiProviderBridge: providerBridgeFactory,
}));

vi.mock('./extension.js', () => ({
  createPiAgentExtension: extensionFactory,
  piScopeEnvVar: 'CFXDEVKIT_PI_SCOPE',
}));

import { runPiCommit, runPiInteractive, runPiPrint, runPiRpc } from './runtime.js';

const spawnMock = vi.mocked(spawn);

describe('pi runtime delegation', () => {
  beforeEach(() => {
    providerBridgeFactory.mockReset();
    extensionFactory.mockClear();
    spawnMock.mockReset();
    spawnMock.mockReturnValue({
      on(event: string, callback: (value?: number | null) => void) {
        if (event === 'exit') {
          callback(0);
        }
        return this;
      },
    } as never);
  });

  it('passes scope, config path, and PI provider env to print mode', async () => {
    providerBridgeFactory.mockResolvedValueOnce({
      configPath: '/workspaces/root/artifacts/llm/config/units/docs.json',
      scope: 'docs',
      pi: {
        provider: 'openai',
        model: 'demo-model',
        env: {
          OPENAI_BASE_URL: 'http://litellm.test/v1',
        },
      },
    });

    await runPiPrint({ scope: 'docs', promptArgs: ['--quick', 'hello'] });

    expect(extensionFactory).toHaveBeenCalledWith('docs');
    expect(providerBridgeFactory).toHaveBeenCalledWith('docs');
    expect(spawnMock).toHaveBeenCalledWith(
      expect.stringContaining('/repos/cfx-tools/infra/pi-agent/node_modules/.bin/pi'),
      [
        '-e',
        '/workspaces/root/.pi/extensions/repo-agent.ts',
        '--print',
        '--provider',
        'openai',
        '--model',
        'demo-model',
        '--quick hello',
      ],
      expect.objectContaining({
        cwd: '/workspaces/root',
        env: expect.objectContaining({
          CFXDEVKIT_LLM_CONFIG_PATH: '/workspaces/root/artifacts/llm/config/units/docs.json',
          CFXDEVKIT_PI_SCOPE: 'docs',
          OPENAI_BASE_URL: 'http://litellm.test/v1',
        }),
      }),
    );
  });

  it('throws when the PI subprocess exits unsuccessfully', async () => {
    providerBridgeFactory.mockResolvedValueOnce({
      configPath: '/workspaces/root/.pi/providers.json',
      scope: undefined,
      pi: {
        provider: 'openai',
        model: null,
        env: {
          OPENAI_API_KEY: 'github-token',
        },
      },
    });
    spawnMock.mockReturnValueOnce({
      on(event: string, callback: (value?: number | null) => void) {
        if (event === 'exit') {
          callback(1);
        }
        return this;
      },
    } as never);

    await expect(runPiRpc()).rejects.toThrow('PI rpc mode exited with code 1');
  });

  it.skipIf(process.env.CI)(
    'boots interactive commit mode with a seeded commit-session prompt',
    async () => {
      providerBridgeFactory.mockResolvedValueOnce({
        configPath: '/workspaces/root/.pi/providers.json',
        scope: undefined,
        pi: {
          provider: 'openai',
          model: 'demo-model',
          env: {},
        },
      });

      await runPiCommit({ promptArgs: ['Focus', 'on', 'docs', 'changes'] });

      expect(spawnMock).toHaveBeenCalledWith(
        expect.stringContaining('/repos/cfx-tools/infra/pi-agent/node_modules/.bin/pi'),
        expect.arrayContaining([
          '-e',
          '/workspaces/root/.pi/extensions/repo-agent.ts',
          '--provider',
          'openai',
          '--model',
          'demo-model',
          expect.stringContaining('Start an interactive repository commit session.'),
        ]),
        expect.objectContaining({
          cwd: '/workspaces/root',
          env: expect.objectContaining({
            CFXDEVKIT_LLM_CONFIG_PATH: '/workspaces/root/.pi/providers.json',
          }),
        }),
      );
    },
  );

  it('awaits terminal setup before starting the PI interactive session', async () => {
    const order: string[] = [];
    providerBridgeFactory.mockResolvedValueOnce({
      configPath: '/workspaces/root/.pi/providers.json',
      scope: undefined,
      pi: {
        provider: 'openai',
        model: 'demo-model',
        env: {},
      },
    });
    spawnMock.mockImplementationOnce(() => {
      order.push('spawn');
      return {
        on(event: string, callback: (value?: number | null) => void) {
          if (event === 'exit') {
            callback(0);
          }
          return this;
        },
      } as never;
    });

    await runPiInteractive({
      promptArgs: ['review'],
      terminalPhases: {
        beforeStart: async () => {
          order.push('beforeStart');
        },
      },
    });

    expect(order).toEqual(['beforeStart', 'spawn']);
  });

  it('runs the optional post-session terminal phase after PI exits', async () => {
    const order: string[] = [];
    providerBridgeFactory.mockResolvedValueOnce({
      configPath: '/workspaces/root/.pi/providers.json',
      scope: undefined,
      pi: {
        provider: 'openai',
        model: 'demo-model',
        env: {},
      },
    });
    spawnMock.mockImplementationOnce(() => {
      order.push('spawn');
      return {
        on(event: string, callback: (value?: number | null) => void) {
          if (event === 'exit') {
            callback(0);
          }
          return this;
        },
      } as never;
    });

    await runPiInteractive({
      terminalPhases: {
        afterExit: async () => {
          order.push('afterExit');
        },
      },
    });

    expect(order).toEqual(['spawn', 'afterExit']);
  });
});
