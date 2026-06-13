import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { discoverDocsPagePackages } from '../discover/packages.js';

const tempDirs: string[] = [];

async function createPackage(
  repoRoot: string,
  rel: string,
  pkg: { name: string; private?: boolean; description?: string; exports?: Record<string, string> },
  files: { readme?: string; api?: string } = {},
) {
  const dir = path.join(repoRoot, rel);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: pkg.name,
        private: pkg.private,
        description: pkg.description ?? '',
        exports: pkg.exports ?? { '.': './src/index.ts' },
      },
      null,
      2,
    ),
    'utf8',
  );
  if (files.readme) await fs.writeFile(path.join(dir, 'README.md'), files.readme, 'utf8');
  if (files.api) await fs.writeFile(path.join(dir, 'API.md'), files.api, 'utf8');
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('discoverDocsPagePackages', () => {
  it('discovers public docs packages and computes package-page metadata', async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'docs-pipeline-'));
    tempDirs.push(repoRoot);

    await createPackage(
      repoRoot,
      'repos/cfx-tools/packages/example',
      {
        name: '@cfxdevkit/example',
        description: 'Example package',
        exports: { '.': './src/index.ts', './react': './src/react.ts' },
      },
      {
        readme: '# Example\n\n> Example package',
        api: '# API\n\n## Core API',
      },
    );
    await createPackage(repoRoot, 'repos/cfx-tools/packages/private-pkg', {
      name: '@cfxdevkit/private-pkg',
      private: true,
    });

    const packages = await discoverDocsPagePackages({ repoRoot });

    expect(packages).toHaveLength(1);
    expect(packages[0]).toMatchObject({
      name: '@cfxdevkit/example',
      rel: 'repos/cfx-tools/packages/example',
      slug: 'example',
      description: 'Example package',
    });
    expect(packages[0]?.skeletonHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
