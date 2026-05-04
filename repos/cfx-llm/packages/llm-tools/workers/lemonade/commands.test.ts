import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configure } from './commands.ts';
import { readConfig, writeConfig } from './completion/index.ts';

vi.mock('./completion/index.ts', () => ({
  buildActionContext: vi.fn(),
  buildBaseContext: vi.fn(),
  chooseModel: vi.fn(),
  complete: vi.fn(),
  createClient: vi.fn(),
  defaultConfig: vi.fn(() => ({ baseUrl: null, defaultModel: null, actions: {} })),
  discoverModels: vi.fn(),
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
  writeLlmReport: vi.fn(),
}));

const readConfigMock = vi.mocked(readConfig);
const writeConfigMock = vi.mocked(writeConfig);

describe('configure', () => {
  beforeEach(() => {
    readConfigMock.mockResolvedValue({ baseUrl: null, defaultModel: null, actions: {} });
    writeConfigMock.mockResolvedValue(undefined);
  });

  it('accepts the nested pnpm separator before set', async () => {
    await configure(['--', 'set', 'default-model', 'user.Qwen3.6-35B-A3B-GGUF']);

    expect(writeConfigMock).toHaveBeenCalledWith({
      baseUrl: null,
      defaultModel: 'user.Qwen3.6-35B-A3B-GGUF',
      actions: {},
    });
  });
});
