import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EMPTY_STATE } from '../wizard.js';

// We test checkEnv and checkRpc in isolation by mocking process.version and fetch.

describe('checkEnv — Node version check', () => {
  it('exits with code 1 when Node < 24', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: number | string | null | undefined) => {
        throw new Error(`process.exit(${_code})`);
      });

    const originalVersion = process.version;
    Object.defineProperty(process, 'version', { value: 'v22.0.0', configurable: true });

    const { checkEnv } = await import('./check-env.js');
    await expect(checkEnv({ ...EMPTY_STATE })).rejects.toThrow('process.exit(1)');

    Object.defineProperty(process, 'version', { value: originalVersion, configurable: true });
    exitSpy.mockRestore();
  });

  it('passes when Node >= 24', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: number | string | null | undefined) => {
        throw new Error(`unexpected process.exit(${_code})`);
      });

    const originalVersion = process.version;
    Object.defineProperty(process, 'version', { value: 'v24.0.0', configurable: true });

    vi.resetModules();
    const { checkEnv } = await import('./check-env.js');
    const result = await checkEnv({ ...EMPTY_STATE });
    expect(result).toBeDefined();

    Object.defineProperty(process, 'version', { value: originalVersion, configurable: true });
    exitSpy.mockRestore();
  });
});

describe('checkRpc — RPC connectivity check', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the URL when RPC responds with a block number', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1234' }),
    }) as typeof fetch;

    vi.resetModules();
    const { checkRpc } = await import('./check-env.js');
    const url = await checkRpc('https://evmtestnet.confluxrpc.com');
    expect(url).toBe('https://evmtestnet.confluxrpc.com');
  });

  it('exits when RPC is unreachable and user provides no alternate', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as typeof fetch;

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: number | string | null | undefined) => {
        throw new Error(`process.exit(${_code})`);
      });

    // Mock @inquirer/prompts to simulate blank input (abort)
    vi.doMock('@inquirer/prompts', () => ({
      input: vi.fn().mockResolvedValue(''),
    }));

    vi.resetModules();
    const { checkRpc } = await import('./check-env.js');
    await expect(checkRpc('http://bad-url')).rejects.toThrow('process.exit(1)');

    exitSpy.mockRestore();
  });
});
