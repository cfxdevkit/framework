import { describe, expect, it } from 'vitest';
import {
  findUnexpectedReferenceDocuments,
  getDocsRootDocumentRequirements,
  getProjectRootDocumentRequirements,
  getPublicPackageDocumentRequirements,
  getWorkspaceRootDocumentRequirements,
  isDocumentationUpkeepPath,
  rootToolingScriptRequirements,
  validateDocumentContent,
  validateScriptRequirements,
} from './workspace.js';

describe('workspace document contract', () => {
  it('requires README and STRUCTURE for public tooling packages', () => {
    const requirements = getPublicPackageDocumentRequirements('repos/cfx-tools/packages/mcp-server');

    expect(requirements.map((requirement) => requirement.path)).toEqual(['README.md', 'STRUCTURE.md']);
  });

  it('requires README and STRUCTURE for non-tooling public packages too', () => {
    const requirements = getPublicPackageDocumentRequirements('repos/cfx-core/packages/cdk');

    expect(requirements.map((requirement) => requirement.path)).toEqual(['README.md', 'STRUCTURE.md']);
  });

  it('treats projects/examples as a lighter project-root contract', () => {
    const requirements = getProjectRootDocumentRequirements('projects/examples');

    expect(requirements.map((requirement) => requirement.path)).toEqual(['README.md']);
  });

  it('tracks the workspace root control-plane documents explicitly', () => {
    expect(getWorkspaceRootDocumentRequirements().map((requirement) => requirement.path)).toEqual([
      'AGENTS.md',
      'README.md',
      'ARCHITECTURE.md',
      'CHANGELOG.md',
      'CLAUDE.md',
      'CONTRIBUTING.md',
      'OPENSPEC.md',
      'SECURITY.md',
    ]);
  });

  it('tracks the maintained docs root documents explicitly', () => {
    expect(getDocsRootDocumentRequirements().map((requirement) => requirement.path)).toEqual([
      'README.md',
      'STRUCTURE.md',
      'keystore-docker.md',
      'legacy-migration-refactor-audit.md',
      'llm-automation-agents.md',
      'llm-fine-tuning-plan.md',
    ]);
  });

  it('detects missing required README shape elements', () => {
    const requirement = getPublicPackageDocumentRequirements('repos/cfx-core/packages/cdk')[0];
    const missing = validateDocumentContent(
      requirement,
      ['# `@cfxdevkit/cdk`', '', '## Usage', '', 'See [API.md](./API.md).'].join('\n'),
    );

    expect(missing).toEqual(['Install section', 'Tier section']);
  });

  it('accepts a README that satisfies the package shape contract', () => {
    const requirement = getPublicPackageDocumentRequirements('repos/cfx-core/packages/cdk')[0];
    const missing = validateDocumentContent(
      requirement,
      [
        '# `@cfxdevkit/cdk`',
        '',
        '## Install',
        '',
        '```bash',
        'pnpm add @cfxdevkit/cdk',
        '```',
        '',
        '## Usage',
        '',
        '```ts',
        'export {}',
        '```',
        '',
        '## API Reference',
        '',
        'See [API.md](./API.md).',
        '',
        '## Tier',
        '',
        '**Tier 0** — framework.',
      ].join('\n'),
    );

    expect(missing).toEqual([]);
  });

  it('requires workspace identity in STRUCTURE.md', () => {
    const requirement = getPublicPackageDocumentRequirements('repos/cfx-core/packages/cdk')[1];
    const missing = validateDocumentContent(
      requirement,
      ['# `@cfxdevkit/cdk` — Structure', '', '```text', 'src', '```'].join('\n'),
    );

    expect(missing).toEqual(['workspace path line']);
  });

  it('detects unexpected root-level reference docs', () => {
    const unexpected = findUnexpectedReferenceDocuments(
      ['README.md', 'STRUCTURE.md', 'PORTING.md', 'CHANGELOG.md'],
      getPublicPackageDocumentRequirements('repos/cfx-core/packages/cdk'),
      ['API.md'],
    );

    expect(unexpected).toEqual(['CHANGELOG.md', 'PORTING.md']);
  });

  it('keeps default docs upkeep scoped to managed documentation paths', () => {
    expect(isDocumentationUpkeepPath('docs/architecture/framework-design-principles.md')).toBe(true);
    expect(isDocumentationUpkeepPath('infrastructure/README.md')).toBe(true);
    expect(isDocumentationUpkeepPath('repos/cfx-tools/README.md')).toBe(true);
    expect(isDocumentationUpkeepPath('projects/cas/README.md')).toBe(true);

    expect(isDocumentationUpkeepPath('openspec/changes/archive/unify-root-tooling-cli/tasks.md')).toBe(false);
    expect(isDocumentationUpkeepPath('repos/cfx-core/packages/cdk/README.md')).toBe(false);
    expect(isDocumentationUpkeepPath('repos/cfx-tools/packages/docs-site/content/packages/llm-client.mdx')).toBe(false);
  });

  it('allows explicit docs upkeep scopes outside the default managed set', () => {
    expect(
      isDocumentationUpkeepPath('repos/cfx-core/packages/cdk/README.md', {
        scopes: ['repos/cfx-core/packages/cdk'],
      }),
    ).toBe(true);
    expect(
      isDocumentationUpkeepPath('repos/cfx-tools/packages/docs-site/content/packages/llm-client.mdx', {
        scopes: ['repos/cfx-tools/packages/docs-site/content/packages'],
      }),
    ).toBe(true);
    expect(
      isDocumentationUpkeepPath('openspec/changes/archive/unify-root-tooling-cli/tasks.md', {
        scopes: ['openspec/changes/archive'],
      }),
    ).toBe(false);
  });

  it('restricts docs-only mode to docs/', () => {
    expect(isDocumentationUpkeepPath('docs/README.md', { docsOnly: true })).toBe(true);
    expect(isDocumentationUpkeepPath('README.md', { docsOnly: true })).toBe(false);
  });
});

describe('root tooling script contract', () => {
  it('accepts the canonical root tooling aliases', () => {
    const actualScripts = Object.fromEntries(
      rootToolingScriptRequirements.map((requirement) => [requirement.name, requirement.expected]),
    );

    expect(validateScriptRequirements(actualScripts)).toEqual([]);
  });

  it('reports missing and mismatched root tooling aliases', () => {
    const findings = validateScriptRequirements({
      tooling: 'pnpm tooling',
      docs: 'pnpm run tooling -- docs',
    });

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: 'package.json',
          rule: 'tooling-script-contract',
          issue: expect.stringContaining('Root script tooling is out of sync'),
        }),
        expect.objectContaining({
          file: 'package.json',
          rule: 'tooling-script-contract',
          issue: expect.stringContaining('missing script docs:sync'),
        }),
      ]),
    );
  });
});