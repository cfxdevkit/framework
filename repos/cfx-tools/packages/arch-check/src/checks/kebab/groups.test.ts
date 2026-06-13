import { describe, expect, it } from 'vitest';
import { findKebabGroupRecords } from './groups.js';

describe('findKebabGroupRecords', () => {
  it('groups sibling kebab-case files by shared prefix before the last segment', () => {
    const groups = findKebabGroupRecords([
      'repos/cfx-tools/packages/arch-check/src/contracts/workspace-scripts-docs.ts',
      'repos/cfx-tools/packages/arch-check/src/contracts/workspace-scripts-llm.ts',
      'repos/cfx-tools/packages/arch-check/src/contracts/workspace-scripts-repo.ts',
      'repos/cfx-tools/packages/arch-check/src/contracts/workspace.ts',
    ]);

    expect(groups).toEqual([
      {
        directory: 'repos/cfx-tools/packages/arch-check/src/contracts',
        prefix: 'workspace-scripts',
        extension: '.ts',
        files: [
          'workspace-scripts-docs.ts',
          'workspace-scripts-llm.ts',
          'workspace-scripts-repo.ts',
        ],
        count: 3,
      },
    ]);
  });

  it('keeps groups directory-local and ignores non-kebab singles', () => {
    const groups = findKebabGroupRecords([
      'repos/cfx-tools/infra/tooling-cli/src/agent-config.ts',
      'repos/cfx-tools/infra/tooling-cli/src/agent-help.ts',
      'repos/cfx-tools/infra/tooling-cli/src/names.ts',
      'repos/cfx-tools/infra/tooling-cli/tests/agent-config.ts',
      'repos/cfx-tools/infra/tooling-cli/tests/agent-help.ts',
      'repos/cfx-tools/infra/tooling-cli/tests/index.ts',
    ]);

    expect(groups).toEqual([
      {
        directory: 'repos/cfx-tools/infra/tooling-cli/src',
        prefix: 'agent',
        extension: '.ts',
        files: ['agent-config.ts', 'agent-help.ts'],
        count: 2,
      },
      {
        directory: 'repos/cfx-tools/infra/tooling-cli/tests',
        prefix: 'agent',
        extension: '.ts',
        files: ['agent-config.ts', 'agent-help.ts'],
        count: 2,
      },
    ]);
  });
});
