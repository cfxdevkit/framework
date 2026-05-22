import { describe, expect, it } from 'vitest';
import { backfillReadmeSections, checkReadmeSections } from './readme.js';

const pkg = {
  name: '@cfxdevkit/devnode',
  description: 'Local Conflux dev node lifecycle.',
  rel: 'repos/cfx-core/packages/devnode',
  subpaths: {
    '.': 'dist/index.d.ts',
    './cli': 'dist/cli.d.ts',
  },
};

describe('readme helpers', () => {
  it('detects missing required sections', () => {
    expect(
      checkReadmeSections(['# `@cfxdevkit/devnode`', '', '## Install'].join('\n')),
    ).toEqual({
      hasInstall: true,
      hasUsage: false,
      hasApiLink: false,
      hasTier: false,
    });
  });

  it('backfills only the missing required sections', () => {
    const existing = [
      '# `@cfxdevkit/devnode`',
      '',
      '> Local Conflux dev node lifecycle.',
      '',
      '## Install',
      '',
      '```bash',
      'pnpm add @cfxdevkit/devnode',
      '```',
    ].join('\n');

    const updated = backfillReadmeSections(existing, pkg);

    expect(updated).toContain('## Usage');
    expect(updated).toContain('See [API.md](./API.md) for the full public surface.');
    expect(updated).toContain('## Tier');
    expect(updated.match(/## Install/g)).toHaveLength(1);
  });
});