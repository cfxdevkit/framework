import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  __packageName,
  cli,
  extractContracts,
  renderContractModule,
  writeContractModules,
} from './index.js';

describe('@cfxdevkit/codegen-contracts', () => {
  it('exposes its package name marker', () => {
    expect(__packageName).toBe('@cfxdevkit/codegen-contracts');
  });

  it('extracts Hardhat-style artifacts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cfx-artifacts-'));
    await writeFile(
      join(dir, 'Counter.json'),
      JSON.stringify({
        contractName: 'Counter',
        sourceName: 'contracts/Counter.sol',
        abi: [],
        bytecode: '0x6000',
      }),
    );
    await writeFile(join(dir, 'Counter.dbg.json'), '{}');

    await expect(extractContracts({ artifactsDir: dir })).resolves.toMatchObject([
      { contractName: 'Counter', bytecode: '0x6000' },
    ]);

    await writeFile(
      join(dir, 'Debug.json'),
      JSON.stringify({ contractName: 'Debug', abi: [], bytecode: 'not-hex' }),
    );
    await expect(
      extractContracts({ artifactsDir: dir, includeDebugFiles: true }),
    ).resolves.toHaveLength(1);
  });

  it('renders contract modules', () => {
    expect(
      renderContractModule({ artifact: { contractName: 'MyToken', abi: [], bytecode: '0x00' } }),
    ).toContain('export const MyTokenArtifact');
    expect(
      renderContractModule({
        artifact: {
          contractName: '123 Token',
          sourceName: 'contracts/Token.sol',
          abi: [],
          bytecode: '0x00',
          deployedBytecode: '0x01',
        },
      }),
    ).toContain('Contract_123_TokenArtifact');
  });

  it('writes generated modules and barrel', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cfx-codegen-'));
    const artifactsDir = join(root, 'artifacts');
    const outDir = join(root, 'generated');
    await mkdir(artifactsDir);
    await writeFile(
      join(artifactsDir, 'Box.json'),
      JSON.stringify({ contractName: 'Box', abi: [], bytecode: '0x01' }),
    );

    await writeContractModules({ artifactsDir, outDir });

    await expect(readFile(join(outDir, 'index.ts'), 'utf8')).resolves.toContain(
      "export * from './box.js'",
    );
  });

  it('runs the CLI extractor', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cfx-cli-codegen-'));
    const artifactsDir = join(root, 'artifacts');
    const outDir = join(root, 'generated');
    await mkdir(artifactsDir);
    await writeFile(
      join(artifactsDir, 'Vault.json'),
      JSON.stringify({ contractName: 'Vault', abi: [], bytecode: '0x02' }),
    );
    await cli(['--artifacts', artifactsDir, '--out', outDir]);
    await expect(readFile(join(outDir, 'vault.ts'), 'utf8')).resolves.toContain('VaultArtifact');
  });
});
