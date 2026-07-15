import {
  RpcError,
  ContractError,
  WalletError,
  KeystoreError,
  isCfxError,
} from '@cfxdevkit/cdk/errors';

export async function demoErrors(): Promise<void> {
  console.log('\n  Both spaces share the same error hierarchy.');

  console.log('\n  ── eSpace RPC error ──────────────────────────────────────');
  const espaceErr = new RpcError({
    code: 'rpc/timeout',
    message: 'eth_blockNumber timed out',
    meta: { endpoint: 'https://evmtestnet.confluxrpc.com', method: 'eth_blockNumber' },
  });
  console.log(`    name:    ${espaceErr.name}`);
  console.log(`    code:    ${espaceErr.code}`);
  console.log(`    message: ${espaceErr.message}`);
  console.log(`    toJSON:  ${JSON.stringify(espaceErr.toJSON())}`);

  console.log('\n  ── Core Space RPC error ──────────────────────────────────');
  const coreErr = new RpcError({
    code: 'rpc/network',
    message: 'cfx_getEpochNumber connection refused',
    meta: { endpoint: 'https://test.confluxrpc.com', method: 'cfx_getEpochNumber' },
  });
  console.log(`    name:    ${coreErr.name}`);
  console.log(`    code:    ${coreErr.code}`);
  console.log(`    message: ${coreErr.message}`);
  console.log(`    toJSON:  ${JSON.stringify(coreErr.toJSON())}`);

  console.log('\n  ── Error hierarchy ──────────────────────────────────────');
  const errors = [
    new RpcError({ code: 'rpc/x', message: '' }),
    new ContractError({ code: 'contract/revert', message: '' }),
    new WalletError({ code: 'wallet/rejected', message: '' }),
    new KeystoreError({ code: 'keystore/locked', message: '' }),
  ];
  for (const err of errors) {
    console.log(`    ${err.name.padEnd(15)} → isCfxError: ${isCfxError(err)}  code: ${err.code}`);
  }

  console.log('\n  ── Guard ────────────────────────────────────────────────');
  console.log(`    isCfxError(new Error()) = ${isCfxError(new Error())}`);
  console.log(`    isCfxError(null) = ${isCfxError(null)}`);

  console.log('\n  ── Cause chaining ───────────────────────────────────────');
  const cause = new TypeError('ECONNREFUSED');
  const wrapped = new RpcError({ code: 'rpc/network', message: 'connection failed', cause });
  console.log(
    `    wrapped.cause → ${(wrapped.cause as Error).constructor.name}: ${(wrapped.cause as Error).message}`,
  );
}
