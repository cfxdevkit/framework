/**
 * solc compile smoke + devnode integration.
 *
 * Both suites are network-gated: solc binaries must be downloaded the first
 * time, and devnode spawns a real Conflux node. Set the env vars below to
 * opt in.
 *
 * - `RUN_SOLC_TESTS=1`     — runs the in-memory compile smoke (downloads solc).
 * - `RUN_DEVNODE_TESTS=1`  — additionally spawns a devnode and deploys the
 *                            compiled artifact via `@cfxdevkit/contracts`.
 *
 * Caches: solc artifacts land in `$XDG_CACHE_HOME/cfxdevkit/solc` (or
 * `~/.cache/cfxdevkit/solc`) so subsequent runs are offline + fast.
 */
import { erc20 } from '@cfxdevkit/contracts';
import { deployContract } from '@cfxdevkit/contracts/deploy';
import { createClient, espaceLocal, http, signerFromPrivateKey } from '@cfxdevkit/core';
import { createDevNode } from '@cfxdevkit/devnode';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compile } from './solc/compile.js';
import { basicErc20 } from './templates/index.js';

const RUN_SOLC = process.env.RUN_SOLC_TESTS === '1';
const RUN_DEVNODE = process.env.RUN_DEVNODE_TESTS === '1';

describe.skipIf(!RUN_SOLC)('compiler / compile smoke', () => {
  it('compiles the basic-erc20 template', async () => {
    const out = await compile({
      sources: basicErc20.sources,
      solcVersion: basicErc20.solcVersion,
      evmVersion: 'paris',
      optimizer: { enabled: true, runs: 200 },
    });
    expect(out.artifacts.length).toBeGreaterThan(0);
    const a = out.artifacts.find((x) => x.contractName === 'BasicErc20');
    expect(a).toBeDefined();
    expect(a?.bytecode).toMatch(/^0x[0-9a-f]+$/);
    expect(a?.deployedBytecode).toMatch(/^0x[0-9a-f]+$/);
    expect(a?.abi.some((it) => it.type === 'function' && it.name === 'transfer')).toBe(true);
    expect(out.solcVersion).toMatch(/^0\.8\.26/);
    expect(out.inputHash).toMatch(/^[0-9a-f]{64}$/);
  }, 120_000);

  it('reports unresolved imports as a typed error', async () => {
    await expect(
      compile({
        sources: [
          {
            path: 'X.sol',
            content:
              '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\nimport "@nope/missing.sol";\ncontract X {}',
          },
        ],
        solcVersion: basicErc20.solcVersion,
      }),
    ).rejects.toMatchObject({ code: 'compiler/resolver/not-found' });
  }, 120_000);
});

describe.skipIf(!RUN_DEVNODE)('compiler / devnode integration', () => {
  let node: ReturnType<typeof createDevNode> | null = null;
  beforeAll(async () => {
    node = createDevNode();
    await node.start();
  }, 120_000);
  afterAll(async () => {
    if (node) await node.stop();
  }, 30_000);

  it('compiles → deploys → reads ERC-20 state on eSpace', async () => {
    const out = await compile({
      sources: basicErc20.sources,
      solcVersion: basicErc20.solcVersion,
      evmVersion: 'paris',
      optimizer: { enabled: true, runs: 200 },
    });
    const artifact = out.artifacts.find((a) => a.contractName === 'BasicErc20');
    if (!artifact) throw new Error('BasicErc20 not in compile output');
    if (!node) throw new Error('devnode not started');

    // First account is pre-funded with 10000 CFX on both spaces.
    const account = node.accounts[0];
    const signer = signerFromPrivateKey(account.privateKey);
    const client = createClient({
      chain: { ...espaceLocal, id: node.config.evmChainId },
      transport: http({ url: node.urls.espace, timeoutMs: 10_000 }),
    });

    const deployed = await deployContract({
      client,
      signer,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: ['Devnode Token', 'DEV', 18, 1_000_000n * 10n ** 18n],
      waitForReceipt: true,
      pollIntervalMs: 500,
      receiptTimeoutMs: 60_000,
    });
    expect(deployed.address).toMatch(/^0x[0-9a-fA-F]{40}$/);

    if (!deployed.address) throw new Error('deploy returned no address');
    const bind = { client, address: deployed.address };
    const [symbol, decimals, total, bal] = await Promise.all([
      erc20.symbol(bind),
      erc20.decimals(bind),
      erc20.totalSupply(bind),
      erc20.balanceOf(bind, account.evmAddress),
    ]);
    expect(symbol).toBe('DEV');
    expect(decimals).toBe(18);
    expect(total).toBe(1_000_000n * 10n ** 18n);
    expect(bal).toBe(total);
  }, 180_000);
});
