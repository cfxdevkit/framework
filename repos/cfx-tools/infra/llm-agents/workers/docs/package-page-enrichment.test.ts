import { describe, expect, it } from 'vitest';
import {
  resolvePackagePageMaxTokens,
  validatePackagePageEnrichment,
} from './package-page-enrichment.ts';

function buildInstallBlock(pkgName: string): string[] {
  return [
    '## Install',
    '',
    "<Tabs items={['pnpm', 'npm', 'yarn']}>",
    '  <Tabs.Tab>',
    '  ```bash',
    `  pnpm add ${pkgName}`,
    '  ```',
    '  </Tabs.Tab>',
    '  <Tabs.Tab>',
    '  ```bash',
    `  npm install ${pkgName}`,
    '  ```',
    '  </Tabs.Tab>',
    '  <Tabs.Tab>',
    '  ```bash',
    `  yarn add ${pkgName}`,
    '  ```',
    '  </Tabs.Tab>',
    '</Tabs>',
    '',
  ];
}

function buildExistingPage(): string {
  return [
    '---',
    'title: "@cfxdevkit/example"',
    'description: "Example package"',
    '---',
    '',
    "import { Callout, Tabs } from 'nextra/components'",
    '',
    '# @cfxdevkit/example',
    '',
    '> Example package',
    '',
    ...buildInstallBlock('@cfxdevkit/example'),
    '## Sub-paths',
    '',
    '| Import | Contents |',
    '|--------|---------|',
    '| `@cfxdevkit/example` | — |',
    '| `@cfxdevkit/example/utils` | — |',
    '',
    '## Usage',
    '',
    '```typescript',
    "import { createClient } from '@cfxdevkit/example'",
    '// TODO: add usage example',
    '```',
    '',
  ].join('\n');
}

function buildLegacyPage(): string {
  return [
    '---',
    'title: "@cfxdevkit/testing"',
    'description: "Shared test fixtures and matchers."',
    '---',
    '',
    "import { Callout, Tabs } from 'nextra/components'",
    '',
    '# @cfxdevkit/testing',
    '',
    '> Shared test fixtures and matchers.',
    '',
    ...buildInstallBlock('@cfxdevkit/testing'),
    'Legacy prose.',
    '',
    '## Sub-paths',
    '',
    '| Sub-path | Exports |',
    '|----------|---------|',
    '| `.` | 8 symbols |',
    '',
    '## Usage',
    '',
    '```ts',
    "import { createMockClient } from '@cfxdevkit/testing'",
    '```',
    '',
    '## API Reference',
    '',
    'Existing API details.',
    '',
  ].join('\n');
}

describe('resolvePackagePageMaxTokens', () => {
  it('raises the non-quick output budget for longer MDX pages', () => {
    const page = `${['---', 'title: "pkg"', '---', '', 'body'].join('\n')}\n${'A'.repeat(9000)}`;
    const readme = `# README\n${'B'.repeat(2500)}`;

    expect(resolvePackagePageMaxTokens(page, readme, {})).toBeGreaterThanOrEqual(8000);
  });

  it('keeps quick mode on a smaller bounded budget', () => {
    const page = `${['---', 'title: "pkg"', '---', '', 'body'].join('\n')}\n${'A'.repeat(2000)}`;
    const readme = `# README\n${'B'.repeat(500)}`;

    expect(resolvePackagePageMaxTokens(page, readme, { quick: true })).toBeLessThanOrEqual(7000);
    expect(resolvePackagePageMaxTokens(page, readme, { quick: true })).toBeGreaterThanOrEqual(2200);
  });
});

describe('validatePackagePageEnrichment', () => {
  it('accepts a candidate that preserves the skeleton and fills sub-path descriptions', () => {
    const existing = buildExistingPage();
    const candidate = [
      '---',
      'title: "@cfxdevkit/example"',
      'description: "Example package"',
      '---',
      '',
      "import { Callout, Tabs } from 'nextra/components'",
      '',
      '# @cfxdevkit/example',
      '',
      '> Example package',
      '',
      ...buildInstallBlock('@cfxdevkit/example'),
      '## Sub-paths',
      '',
      '| Import | Contents |',
      '|--------|---------|',
      '| `@cfxdevkit/example` | Primary client entrypoint. |',
      '| `@cfxdevkit/example/utils` | Shared helper utilities. |',
      '',
      '## Usage',
      '',
      '```typescript',
      "import { createClient } from '@cfxdevkit/example'",
      '',
      'const client = createClient()',
      '```',
      '',
    ].join('\n');

    expect(validatePackagePageEnrichment(existing, candidate)).toContain(
      '| `@cfxdevkit/example` | Primary client entrypoint. |',
    );
  });

  it('rejects a candidate that drops the fixed install block', () => {
    const existing = buildExistingPage();
    const candidate = [
      '---',
      'title: "@cfxdevkit/example"',
      'description: "Example package"',
      '---',
      '',
      "import { Callout, Tabs } from 'nextra/components'",
      '',
      '# @cfxdevkit/example',
      '',
      '> Example package',
      '',
      '## Usage',
      '',
      'Broken rewrite.',
      '',
    ].join('\n');

    expect(validatePackagePageEnrichment(existing, candidate)).toBeNull();
  });

  it('rejects a candidate that truncates the content after the sub-paths table', () => {
    const existing = buildExistingPage();
    const candidate = [
      '---',
      'title: "@cfxdevkit/example"',
      'description: "Example package"',
      '---',
      '',
      "import { Callout, Tabs } from 'nextra/components'",
      '',
      '# @cfxdevkit/example',
      '',
      '> Example package',
      '',
      ...buildInstallBlock('@cfxdevkit/example'),
      '## Sub-paths',
      '',
      '| Import | Contents |',
      '|--------|---------|',
      '| `@cfxdevkit/example` | Primary client entrypoint. |',
      '| `@cfxdevkit/example/utils` | Shared helper utilities. |',
      '',
    ].join('\n');

    expect(validatePackagePageEnrichment(existing, candidate)).toBeNull();
  });

  it('accepts legacy sub-path table headers by preserving the existing table shape', () => {
    const existing = buildLegacyPage();
    const candidate = [
      '---',
      'title: "@cfxdevkit/testing"',
      'description: "Shared test fixtures and matchers."',
      '---',
      '',
      "import { Callout, Tabs } from 'nextra/components'",
      '',
      '# @cfxdevkit/testing',
      '',
      '> Shared test fixtures and matchers.',
      '',
      ...buildInstallBlock('@cfxdevkit/testing'),
      'Legacy prose.',
      '',
      '## Sub-paths',
      '',
      '| Import | Contents |',
      '|--------|---------|',
      '| `.` | Shared test utilities entrypoint. |',
      '',
      '## Usage',
      '',
      '```ts',
      "import { createMockClient } from '@cfxdevkit/testing'",
      '',
      'const client = createMockClient();',
      '```',
      '',
      '## API Reference',
      '',
      'Updated API details.',
      '',
    ].join('\n');

    const validated = validatePackagePageEnrichment(existing, candidate);

    expect(validated).toContain('| Sub-path | Exports |');
    expect(validated).toContain('| `.` | Shared test utilities entrypoint. |');
  });
});
