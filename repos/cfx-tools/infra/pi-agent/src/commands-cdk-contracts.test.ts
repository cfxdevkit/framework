import { beforeEach, describe, expect, it, vi } from 'vitest';

const cdkToolMocks = vi.hoisted(() => ({
  executeCdkStatus: vi.fn(),
  executeCdkDerive: vi.fn(),
  executeCdkGenerate: vi.fn(),
  executeCdkContractsExtract: vi.fn(),
}));

vi.mock('./tools-cdk.js', () => ({
  executeCdkStatus: cdkToolMocks.executeCdkStatus,
  executeCdkDerive: cdkToolMocks.executeCdkDerive,
  executeCdkGenerate: cdkToolMocks.executeCdkGenerate,
  executeCdkContractsExtract: cdkToolMocks.executeCdkContractsExtract,
}));

import { registerPiCdkCommands } from './commands-cdk.js';

function buildPi() {
  const commands = new Map<string, (args: string, ctx: unknown) => Promise<void>>();
  const sendMessage = vi.fn();
  const pi = {
    registerCommand: vi.fn(
      (name: string, options: { handler: (args: string, ctx: unknown) => Promise<void> }) => {
        commands.set(name, options.handler);
      },
    ),
    registerMessageRenderer: vi.fn(),
    sendMessage,
  } as never;
  registerPiCdkCommands(pi);
  return { commands, sendMessage };
}

function buildCtx() {
  return {
    hasUI: true,
    ui: {
      setStatus: vi.fn(),
      setWidget: vi.fn(),
      notify: vi.fn(),
      setWorkingVisible: vi.fn(),
      setWorkingMessage: vi.fn(),
    },
  };
}

describe('registerPiCdkCommands — /cdk contracts extract', () => {
  beforeEach(() => {
    cdkToolMocks.executeCdkContractsExtract.mockReset();
  });

  it('reports extracted contract count', async () => {
    cdkToolMocks.executeCdkContractsExtract.mockResolvedValue({
      artifactsDir: 'artifacts',
      outDir: 'src/generated/contracts',
      count: 3,
    });

    const { commands, sendMessage } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('contracts extract', ctx);

    expect(cdkToolMocks.executeCdkContractsExtract).toHaveBeenCalledWith({});
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'cdk-result',
        details: expect.objectContaining({
          tone: 'success',
          lines: expect.arrayContaining([expect.stringContaining('extracted: 3')]),
        }),
      }),
    );
  });

  it('forwards --artifacts and --out flags', async () => {
    cdkToolMocks.executeCdkContractsExtract.mockResolvedValue({
      artifactsDir: 'my/artifacts',
      outDir: 'src/out',
      count: 1,
    });

    const { commands } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('contracts extract --artifacts my/artifacts --out src/out', ctx);

    expect(cdkToolMocks.executeCdkContractsExtract).toHaveBeenCalledWith({
      artifacts: 'my/artifacts',
      out: 'src/out',
    });
  });

  it('notifies on unknown contracts action', async () => {
    const { commands } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('contracts compile', ctx);

    expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining('compile'), 'error');
    expect(cdkToolMocks.executeCdkContractsExtract).not.toHaveBeenCalled();
  });
});

describe('registerPiCdkCommands — /cdk help', () => {
  it('emits help text when no subcommand given', async () => {
    const { commands, sendMessage } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('', ctx);

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'cdk-result',
        details: expect.objectContaining({
          lines: expect.arrayContaining([expect.stringContaining('/cdk status')]),
        }),
      }),
    );
  });
});
