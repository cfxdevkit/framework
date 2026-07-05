import { createClient, http } from '@cfxdevkit/cdk/client';
import { espaceTestnet, coreSpaceTestnet } from '@cfxdevkit/cdk/chains';
import type { EspaceClient, CoreSpaceClient } from '@cfxdevkit/cdk/client';
import { formatCFX, formatGDrip } from '@cfxdevkit/cdk/units';

export async function demoClientLive(): Promise<void> {
  // ── eSpace testnet ──────────────────────────────────────────────────
  const espace = createClient({
    chain: espaceTestnet,
    transport: http({ url: 'https://evmtestnet.confluxrpc.com' }),
  }) as EspaceClient;

  console.log('\n  ── eSpace Testnet ──────────────────────────────────────');
  console.log(`    endpoint:  ${espaceTestnet.rpc.http[0]}`);
  console.log(`    chain id:  ${espace.chain.id}  (${espace.family})`);

  const eBlock = await espace.getBlockNumber();
  console.log(`    block #:   ${eBlock}`);

  const eGas = await espace.getGasPrice();
  console.log(`    gas price: ${formatCFX(eGas)} CFX  (${formatGDrip(eGas)} Gdrip)`);

  const eNonce = await espace.getTransactionCount('0x08f1d158019e76d6e0c26609c384301331204377' as never);
  console.log(`    nonce of  0x08f1...04377: ${eNonce}`);

  // ── Core Space testnet ─────────────────────────────────────────────
  const core = createClient({
    chain: coreSpaceTestnet,
    transport: http({ url: 'https://test.confluxrpc.com' }),
  }) as CoreSpaceClient;

  console.log('\n  ── Core Space Testnet ─────────────────────────────────');
  console.log(`    endpoint:  ${coreSpaceTestnet.rpc.http[0]}`);
  console.log(`    chain id:  ${core.chain.id}  (${core.family})`);

  const cEpoch = await core.getEpochNumber();
  console.log(`    epoch #:   ${cEpoch}`);

  const cGas = await core.getGasPrice();
  console.log(`    gas price: ${formatCFX(cGas)} CFX  (${formatGDrip(cGas)} Gdrip)`);

  const cStatus = await core.getStatus();
  console.log(`    chain id:  ${cStatus.chainId}`);
  console.log(`    network:   ${cStatus.networkId}`);
  console.log(`    best epoch: ${cStatus.epochNumber}`);
  console.log(`    latest state: ${cStatus.latestState}`);
  console.log(`    checkpoint:  ${cStatus.latestCheckpoint}`);
  console.log(`    pending txs: ${cStatus.pendingTxNumber}`);

  // ── Raw RPC ─────────────────────────────────────────────────────────
  console.log('\n  ── Raw RPC ────────────────────────────────────────────');
  const eChainId = await espace.request({ method: 'eth_chainId' } as never);
  console.log(`    eSpace  eth_chainId → ${eChainId}`);

  const cEpochRaw = await core.request({ method: 'cfx_epochNumber' } as never);
  console.log(`    Core    cfx_epochNumber → ${cEpochRaw}`);
}
