import { describe, expect, it } from 'vitest';
import { checkCliFrameworkPolicy } from './arch.js';

describe('tooling-cli framework policy', () => {
  it('rejects commander and requires clipanion plus @inquirer/prompts', () => {
    const findings: Array<{ rule: string; issue: string }> = [];

    checkCliFrameworkPolicy(
      {
        name: '@cfxdevkit/tooling-cli',
        path: 'repos/cfx-tools/infra/tooling-cli',
        packageJson: {
          dependencies: {
            commander: '^14.0.2',
          },
        },
      },
      findings as never,
    );

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'cli-framework-standard',
          issue: expect.stringContaining('Clipanion instead of commander'),
        }),
        expect.objectContaining({
          rule: 'cli-framework-standard',
          issue: expect.stringContaining('declare clipanion as a runtime dependency'),
        }),
        expect.objectContaining({
          rule: 'cli-framework-standard',
          issue: expect.stringContaining('@inquirer/prompts as a runtime dependency'),
        }),
      ]),
    );
  });

  it('accepts the current tooling-cli runtime dependency standard', () => {
    const findings: Array<{ rule: string; issue: string }> = [];

    checkCliFrameworkPolicy(
      {
        name: '@cfxdevkit/tooling-cli',
        path: 'repos/cfx-tools/infra/tooling-cli',
        packageJson: {
          dependencies: {
            clipanion: '^4.0.0-rc.4',
            '@inquirer/prompts': '^8.4.3',
          },
        },
      },
      findings as never,
    );

    expect(findings).toEqual([]);
  });
});
