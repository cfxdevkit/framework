import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolingNamespaceDefinition } from './contracts.js';
import { buildToolingCatalog } from './registry.js';
import { runCli } from './run.js';

function createNamespace(name: string): ToolingNamespaceDefinition {
  return {
    name,
    description: `${name} namespace`,
    commands: [{ name: 'status', description: `${name} status` }],
    run: vi.fn().mockResolvedValue(undefined),
  };
}

describe('tooling-cli', () => {
  beforeEach(() => {
    process.exitCode = 0;
  });

  it('builds a machine-readable catalog from namespace registries', () => {
    const catalog = buildToolingCatalog([createNamespace('llm')]);

    expect(catalog).toEqual({
      namespaces: [
        {
          name: 'llm',
          description: 'llm namespace',
          commands: [{ name: 'status', description: 'llm status' }],
        },
      ],
    });
  });

  it('omits hidden commands from the machine-readable catalog', () => {
    const catalog = buildToolingCatalog([
      {
        name: 'llm',
        description: 'llm namespace',
        commands: [
          { name: 'models', description: 'visible' },
          { name: 'review', description: 'hidden', hidden: true },
        ],
        run: vi.fn().mockResolvedValue(undefined),
      },
    ]);

    expect(catalog).toEqual({
      namespaces: [
        {
          name: 'llm',
          description: 'llm namespace',
          commands: [{ name: 'models', description: 'visible' }],
        },
      ],
    });
  });

  it('dispatches a namespaced command through the registered runner', async () => {
    const namespace = createNamespace('docs');

    await runCli(['docs', 'status', '--json'], { namespaces: [namespace] });

    expect(namespace.run).toHaveBeenCalledWith(['status', '--json']);
    expect(process.exitCode).toBe(0);
  });

  it('falls back to namespace help when a subcommand is unknown', async () => {
    const namespace = createNamespace('llm');
    const stderr = { write: vi.fn() };

    await runCli(['llm', 'missing'], {
      namespaces: [namespace],
      stdout: { write: vi.fn() },
      stderr,
    });

    expect(stderr.write).toHaveBeenCalledWith('Unknown llm command: missing\n\n');
    expect(namespace.run).toHaveBeenCalledWith(['help']);
    expect(process.exitCode).toBe(1);
  });
});
