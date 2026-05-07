import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, listTemplates } from '@cfxdevkit/compiler';
import { deriveAccount } from '@cfxdevkit/core/wallet';
import { createDevNode } from '@cfxdevkit/devnode';
import {
  createFileKeystore,
  initFileKeystore,
  readFileKeystoreMnemonic,
} from '@cfxdevkit/services/keystore-file';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const deployEnabled = process.argv.includes('--deploy');

await checkManifest();
await checkKeystoreToDevnodeDerivation();
const artifact = await checkBuiltInTemplateCompile();

if (deployEnabled) {
  await checkLocalDeploy(artifact);
}

console.log(
  `extension smoke OK${deployEnabled ? ' with local deployment' : ''}: manifest, wallet/node, and contract template workflows passed`,
);

async function checkManifest() {
  const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.contributes.views['cfxdevkit-sidebar'].length, 1);
  assert.equal(pkg.contributes.views['cfxdevkit-sidebar'][0].id, 'cfxdevkit.mainView');

  const commandIds = new Set(pkg.contributes.commands.map((command) => command.command));
  assert.equal(commandIds.has('cfxdevkit.deployContract'), true);
  assert.equal(commandIds.has('cfxdevkit.importContract'), true);

  const titleCommands = new Set(
    (pkg.contributes.menus['view/title'] ?? []).map((item) => item.command),
  );
  assert.equal(titleCommands.has('cfxdevkit.deployContract'), false);
  assert.equal(titleCommands.has('cfxdevkit.importContract'), false);
}

async function checkKeystoreToDevnodeDerivation() {
  const mnemonic = 'test test test test test test test test test test test junk';
  const passphrase = 'correct horse battery staple';
  const dir = await mkdtemp(join(tmpdir(), 'cfx-extension-smoke-'));
  try {
    const path = join(dir, 'keystore.json');
    const ref = { service: 'cfxdevkit', account: 'mnemonic-default' };
    await initFileKeystore({ path, passphrase });
    const keystore = createFileKeystore({ path, unlock: async () => ({ passphrase }) });
    await keystore.put({ ref, kind: 'mnemonic', secret: mnemonic, meta: { accountCount: '2' } });

    const restored = await readFileKeystoreMnemonic({ path, passphrase, ref });
    const node = createDevNode({ mnemonic: restored, accounts: 2, dataDir: join(dir, 'node') });
    const first = deriveAccount({ mnemonic, path: "m/44'/60'/0'/0/0" });
    assert.equal(node.accounts[0].evmAddress, first.account.address);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function checkBuiltInTemplateCompile() {
  const template = listTemplates()[0];
  assert.ok(template, 'expected at least one built-in contract template');
  const output = await compile({
    sources: template.sources,
    solcVersion: template.solcVersion,
    evmVersion: template.evmVersion ?? 'paris',
  });
  assert.deepEqual(output.warnings, []);
  const artifact = output.artifacts.find((item) => item.contractName === template.contractName);
  assert.ok(artifact, `expected artifact for ${template.contractName}`);
  assert.match(artifact.bytecode, /^0x[0-9a-f]+$/i);

  const constructorAbi = artifact.abi.find((entry) => entry.type === 'constructor');
  assert.deepEqual(
    constructorAbi.inputs.map((input) => input.type),
    ['string', 'string', 'uint8', 'uint256'],
  );
  return artifact;
}

async function checkLocalDeploy(artifact) {
  const { deployContract } = await import('@cfxdevkit/contracts/deploy');
  const { createClient, http } = await import('@cfxdevkit/core/client');
  const { espaceLocal } = await import('@cfxdevkit/core/chains');

  const mnemonic = 'test test test test test test test test test test test junk';
  const passphrase = 'correct horse battery staple';
  const dir = await mkdtemp(join(tmpdir(), 'cfx-extension-deploy-'));
  let node;
  try {
    const path = join(dir, 'keystore.json');
    const ref = { service: 'cfxdevkit', account: 'mnemonic-default' };
    await initFileKeystore({ path, passphrase });
    const keystore = createFileKeystore({ path, unlock: async () => ({ passphrase }) });
    await keystore.put({ ref, kind: 'mnemonic', secret: mnemonic, meta: { accountCount: '2' } });
    const restored = await readFileKeystoreMnemonic({ path, passphrase, ref });
    node = createDevNode({
      mnemonic: restored,
      accounts: 2,
      dataDir: join(dir, 'node'),
      coreRpcPort: Number(process.env.CFX_SMOKE_CORE_RPC_PORT ?? '22537'),
      evmRpcPort: Number(process.env.CFX_SMOKE_EVM_RPC_PORT ?? '28545'),
      coreWsPort: Number(process.env.CFX_SMOKE_CORE_WS_PORT ?? '22536'),
      evmWsPort: Number(process.env.CFX_SMOKE_EVM_WS_PORT ?? '28546'),
      logging: process.env.CFX_SMOKE_NODE_LOGGING === '1',
    });
    await node.start();

    const client = createClient({
      chain: { ...espaceLocal, rpc: { http: [node.urls.espace] } },
      transport: http({ url: node.urls.espace }),
    });
    const signer = await keystore.getSigner(ref, undefined, {
      derivationPath: "m/44'/60'/0'/0/0",
    });
    const result = await deployContract({
      client,
      signer,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: ['Smoke Token', 'SMK', 18, 1000n],
      waitForReceipt: true,
      receiptTimeoutMs: 30_000,
      pollIntervalMs: 500,
    });
    assert.ok(result.address, 'expected deployed contract address');
  } finally {
    if (node) await node.stop().catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  }
}
