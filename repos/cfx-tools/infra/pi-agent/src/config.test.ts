import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readPiConfig } from './config.js';

describe('readPiConfig', () => {
  const previousCwd = process.cwd();
  const previousScopedPath = process.env.CFXDEVKIT_LLM_CONFIG_PATH;

  afterEach(async () => {
    process.chdir(previousCwd);
    if (previousScopedPath === undefined) {
      delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
    } else {
      process.env.CFXDEVKIT_LLM_CONFIG_PATH = previousScopedPath;
    }
  });

  it('merges the shared PI config with scoped unit overlays', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pi-config-merge-'));
    await mkdir(join(root, '.pi'), { recursive: true });
    await mkdir(join(root, 'artifacts', 'llm', 'config', 'units'), { recursive: true });

    await writeFile(
      join(root, '.pi', 'providers.json'),
      `${JSON.stringify(
        {
          provider: 'lemonade',
          baseUrl: 'http://host.containers.internal:13305/',
          defaultModel: 'Qwen3-Coder-Next-GGUF',
          requestTimeoutMs: 600000,
          actions: {},
          providerProfiles: {
            'local-fast': {
              provider: 'lemonade',
              defaultModel: 'Qwen3-Coder-Next-GGUF',
            },
          },
          actionPolicies: {
            review: {
              profile: 'local-fast',
              phases: {},
            },
          },
          harness: {
            version: 1,
            defaultMode: 'deterministic',
            providerStrategy: 'auto',
            deterministic: {
              preserveDeterministicArtifacts: true,
              preserveDeterministicSections: true,
            },
            exploratory: {
              allowCodeChanges: true,
              allowWideChanges: true,
            },
          },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const scopedPath = join(root, 'artifacts', 'llm', 'config', 'units', 'delivery.json');
    await writeFile(
      scopedPath,
      `${JSON.stringify(
        {
          harness: {
            defaultMode: 'exploratory',
          },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    process.chdir(root);

    const config = await readPiConfig(scopedPath);

    expect(config.provider).toBe('lemonade');
    expect(config.baseUrl).toBe('http://host.containers.internal:13305/');
    expect(config.defaultModel).toBe('Qwen3-Coder-Next-GGUF');
    expect(config.harness.defaultMode).toBe('exploratory');
    expect(config.providerProfiles?.['local-fast']).toEqual(
      expect.objectContaining({ provider: 'lemonade' }),
    );
    expect(config.actionPolicies?.review).toEqual(
      expect.objectContaining({ profile: 'local-fast' }),
    );
  });
});
