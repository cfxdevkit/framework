import { describe, expect, it } from 'vitest';

import {
  embedHash,
  generateMdxSkeleton,
  isValidGeneratedMdx,
  readEmbeddedHash,
  stripEmbeddedHash,
} from './package-content.js';

describe('package-content', () => {
  it('round-trips the package page hash footer', () => {
    const content = '# Example';
    const withHash = embedHash(content, 'abc123');

    expect(readEmbeddedHash(withHash)).toBe('abc123');
    expect(stripEmbeddedHash(withHash)).toBe(content);
  });

  it('sanitizes generated MDX skeleton content', () => {
    const mdx = generateMdxSkeleton({
      name: '@cfxdevkit/example',
      description: 'Example package',
      exports: {
        '.': './src/index.ts',
        './react': './src/react.ts',
      },
      readme: `# Example\n\n> Example package\n\n<!-- remove me -->\nIntro with {@link ExampleType} and 0x\${string}.\n\n## Install\n\nIgnore this section.\n\n## Usage\n\nKeep this section.`,
      api: `# API\n\n## Sub-paths\n\nIgnore this section too.\n\n## Core API\n\nUses {@link ExampleApi}.`,
    });

    expect(mdx).toMatchInlineSnapshot(`
      "---
      title: "@cfxdevkit/example"
      description: "Example package"
      ---

      import { Callout, Tabs } from 'nextra/components'

      # @cfxdevkit/example

      > Example package

      ## Install

      <Tabs items={['pnpm', 'npm', 'yarn']}>
        <Tabs.Tab>
        \`\`\`bash
        pnpm add @cfxdevkit/example
        \`\`\`
        </Tabs.Tab>
        <Tabs.Tab>
        \`\`\`bash
        npm install @cfxdevkit/example
        \`\`\`
        </Tabs.Tab>
        <Tabs.Tab>
        \`\`\`bash
        yarn add @cfxdevkit/example
        \`\`\`
        </Tabs.Tab>
      </Tabs>

      Intro with \`ExampleType\` and HexAddress.

      ## Usage

      Keep this section.

      ## API Reference

      ## Core API

      Uses \`ExampleApi\`.
      "
    `);
  });

  it('accepts generated MDX and rejects truncated MDX', async () => {
    const mdx = generateMdxSkeleton({
      name: '@cfxdevkit/example',
      description: 'Example package',
      exports: { '.': './src/index.ts' },
      readme: null,
      api: null,
    });

    expect(await isValidGeneratedMdx(mdx)).toBe(true);
    expect(await isValidGeneratedMdx(mdx.split('\n').slice(0, 14).join('\n'))).toBe(false);
  });
});
