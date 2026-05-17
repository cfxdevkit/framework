import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, listTemplates } from '@cfxdevkit/compiler';
import { createConfluxDevkitClient } from '@cfxdevkit/client';
import { deriveAccount } from '@cfxdevkit/core/wallet';
import { createDevnodeServerApp } from '@cfxdevkit/devnode-server';
import {
  createFileKeystore,
  initFileKeystore,
  readFileKeystoreMnemonic,
} from '@cfxdevkit/services/keystore-file';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const deployEnabled = process.argv.includes('--deploy');

function createSmokeControlPlane(dir) {
  const app = createDevnodeServerApp({
    keystorePath: join(dir, 'devnode-server-keystore.json'),
    nodeProfileDataRoot: join(dir, 'node-profiles'),
  });
  return createConfluxDevkitClient({
    baseUrl: 'http://cfxdevkit-extension-smoke.local',
    fetch: async (input, init) => {
      if (input instanceof Request) return app.request(input);
      const url = new URL(String(input), 'http://cfxdevkit-extension-smoke.local');
      return app.request(`${url.pathname}${url.search}`, init);
    },
  });
}

await checkManifest();
await checkKeystoreToControlPlaneDerivation();
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

async function checkKeystoreToControlPlaneDerivation() {
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
    const client = createSmokeControlPlane(dir);
    const { node } = await client.node.start({
      config: { mnemonic: restored, accounts: 2, dataDir: join(dir, 'node') },
    });
    const first = deriveAccount({ mnemonic, path: "m/44'/60'/0'/0/0" });
    assert.equal(node.accounts[0].evmAddress, first.account.address);
    await client.node.stop();
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
  const mnemonic = 'test test test test test test test test test test test junk';
  const passphrase = 'correct horse battery staple';
  const dir = await mkdtemp(join(tmpdir(), 'cfx-extension-deploy-'));
  let client;
  try {
    const path = join(dir, 'keystore.json');
    const ref = { service: 'cfxdevkit', account: 'mnemonic-default' };
    await initFileKeystore({ path, passphrase });
    const keystore = createFileKeystore({ path, unlock: async () => ({ passphrase }) });
    await keystore.put({ ref, kind: 'mnemonic', secret: mnemonic, meta: { accountCount: '2' } });
    const restored = await readFileKeystoreMnemonic({ path, passphrase, ref });
    client = createSmokeControlPlane(dir);
    await client.keystore.setup({ passphrase });
    await client.keystore.wallets.add({ mnemonic: restored, name: 'Primary' });
    await client.node.start({
      config: {
        mnemonic: restored,
        accounts: 2,
        dataDir: join(dir, 'node'),
        coreRpcPort: Number(process.env.CFX_SMOKE_CORE_RPC_PORT ?? '22537'),
        evmRpcPort: Number(process.env.CFX_SMOKE_EVM_RPC_PORT ?? '28545'),
        coreWsPort: Number(process.env.CFX_SMOKE_CORE_WS_PORT ?? '22536'),
        evmWsPort: Number(process.env.CFX_SMOKE_EVM_WS_PORT ?? '28546'),
        logging: process.env.CFX_SMOKE_NODE_LOGGING === '1',
      },
    });

    const result = await client.deploy.run({
      accountIndex: 0,
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      contractName: artifact.contractName,
      args: ['Smoke Token', 'SMK', 18, 1000],
      space: 'espace',
    });
    assert.ok(result.address, 'expected deployed contract address');
  } finally {
    if (client) await client.node.stop().catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  }
}
