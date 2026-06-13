import { beforeEach, describe, expect, it, vi } from 'vitest';

const cdkToolMocks = vi.hoisted(() => ({
  executeCdkStatus: vi.fn(),
  executeCdkDerive: vi.fn(),
  executeCdkGenerate: vi.fn(),
  executeCdkContractsExtract: vi.fn(),
}));

vi.mock('../tools/cdk.js', () => ({
  executeCdkStatus: cdkToolMocks.executeCdkStatus,
  executeCdkDerive: cdkToolMocks.executeCdkDerive,
  executeCdkGenerate: cdkToolMocks.executeCdkGenerate,
  executeCdkContractsExtract: cdkToolMocks.executeCdkContractsExtract,
}));

import { registerPiCdkCommands } from './cdk.js';

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

describe('registerPiCdkCommands — /cdk status', () => {
  beforeEach(() => {
    cdkToolMocks.executeCdkStatus.mockReset();
  });

  it('emits success message when all chains are healthy', async () => {
    cdkToolMocks.executeCdkStatus.mockResolvedValue([
      {
        chain: 'core-mainnet',
        chainId: 1029,
        family: 'core',
        network: 'mainnet',
        rpc: 'https://rpc.cfx.io',
        ok: true,
        head: '100',
        latencyMs: 42,
      },
      {
        chain: 'espace-mainnet',
        chainId: 1030,
        family: 'espace',
        network: 'mainnet',
        rpc: 'https://evm.cfx.io',
        ok: true,
        head: '200',
        latencyMs: 55,
      },
    ]);

    const { commands, sendMessage } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('status', ctx);

    expect(cdkToolMocks.executeCdkStatus).toHaveBeenCalledWith({});
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'cdk-result',
        content: 'CDK status',
        details: expect.objectContaining({
          tone: 'success',
          lines: expect.arrayContaining([
            expect.stringContaining('core-mainnet'),
            expect.stringContaining('espace-mainnet'),
          ]),
        }),
      }),
    );
    expect(ctx.ui.notify).not.toHaveBeenCalled();
  });

  it('forwards --chain and --rpc flags', async () => {
    cdkToolMocks.executeCdkStatus.mockResolvedValue([
      {
        chain: 'core-testnet',
        chainId: 1,
        family: 'core',
        network: 'testnet',
        rpc: 'http://custom',
        ok: false,
        latencyMs: 0,
        error: 'timeout',
      },
    ]);

    const { commands } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('status --chain core-testnet --rpc http://custom', ctx);

    expect(cdkToolMocks.executeCdkStatus).toHaveBeenCalledWith({
      chain: 'core-testnet',
      rpc: 'http://custom',
    });
  });

  it('uses error tone when all chains fail', async () => {
    cdkToolMocks.executeCdkStatus.mockResolvedValue([
      {
        chain: 'core-mainnet',
        chainId: 1029,
        family: 'core',
        network: 'mainnet',
        rpc: 'x',
        ok: false,
        latencyMs: 0,
        error: 'refused',
      },
    ]);

    const { commands, sendMessage } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('status', ctx);

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ tone: 'error' }),
      }),
    );
  });
});

describe('registerPiCdkCommands — /cdk derive', () => {
  beforeEach(() => {
    cdkToolMocks.executeCdkDerive.mockReset();
  });

  it('derives accounts from --generate flag', async () => {
    cdkToolMocks.executeCdkDerive.mockReturnValue({
      mnemonic: 'word '.repeat(12).trim(),
      accountType: 'standard',
      coreNetworkId: 1029,
      accounts: [
        {
          index: 0,
          evmAddress: '0xabc',
          coreAddress: 'cfx:abc',
          paths: { evm: "m/44'/60'/0'/0/0", core: "m/44'/503'/0'/0/0" },
        },
      ],
    });

    const { commands, sendMessage } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('derive --generate --count 1', ctx);

    expect(cdkToolMocks.executeCdkDerive).toHaveBeenCalledWith(
      expect.objectContaining({ generate: true, count: 1 }),
    );
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'cdk-result',
        details: expect.objectContaining({
          tone: 'success',
          lines: expect.arrayContaining([
            expect.stringContaining('mnemonic:'),
            expect.stringContaining('0xabc'),
          ]),
        }),
      }),
    );
  });
});

describe('registerPiCdkCommands — /cdk generate', () => {
  beforeEach(() => {
    cdkToolMocks.executeCdkGenerate.mockReset();
  });

  it('emits mnemonic in chat with word count', async () => {
    cdkToolMocks.executeCdkGenerate.mockReturnValue({
      mnemonic: 'test test test test test test test test test test test junk',
      wordCount: 12,
      valid: true,
    });

    const { commands, sendMessage } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('generate', ctx);

    expect(cdkToolMocks.executeCdkGenerate).toHaveBeenCalledWith({});
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: 'cdk-result',
        details: expect.objectContaining({
          tone: 'success',
          lines: expect.arrayContaining([
            expect.stringContaining('test test test'),
            expect.stringContaining('words: 12'),
          ]),
        }),
      }),
    );
  });

  it('passes --strength flag', async () => {
    cdkToolMocks.executeCdkGenerate.mockReturnValue({
      mnemonic: 'a '.repeat(24).trim(),
      wordCount: 24,
      valid: true,
    });

    const { commands } = buildPi();
    const ctx = buildCtx();

    await commands.get('cdk')?.('generate --strength 256', ctx);

    expect(cdkToolMocks.executeCdkGenerate).toHaveBeenCalledWith({ strength: 256 });
  });
});
