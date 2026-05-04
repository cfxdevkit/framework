import type { Client, CoreSpaceClient } from '@cfxdevkit/core';
import { hexToBase32 } from '@cfxdevkit/core/address';
import { ContractsError } from '../errors/index.js';

export const CROSS_SPACE_CALL_HEX = '0x0888000000000000000000000000000000000006' as const;

export const CROSS_SPACE_CALL_ABI = [
  {
    type: 'function',
    name: 'transferEVM',
    stateMutability: 'payable',
    inputs: [{ name: 'to', type: 'bytes20' }],
    outputs: [{ name: 'output', type: 'bytes' }],
  },
  {
    type: 'function',
    name: 'callEVM',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'bytes20' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [{ name: 'output', type: 'bytes' }],
  },
  {
    type: 'function',
    name: 'staticCallEVM',
    stateMutability: 'view',
    inputs: [
      { name: 'to', type: 'bytes20' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [{ name: 'output', type: 'bytes' }],
  },
  {
    type: 'function',
    name: 'deployEVM',
    stateMutability: 'payable',
    inputs: [{ name: 'init', type: 'bytes' }],
    outputs: [{ name: 'contractCreated', type: 'bytes20' }],
  },
  {
    type: 'function',
    name: 'withdrawFromMapped',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'value', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'mappedBalance',
    stateMutability: 'view',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'mappedNonce',
    stateMutability: 'view',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: 'nonce', type: 'uint256' }],
  },
] as const;

export interface BridgeBaseOptions {
  client: Client;
  signer: import('@cfxdevkit/core').Signer;
  waitForReceipt?: boolean;
  gas?: bigint;
  storageLimit?: bigint;
  gasPrice?: bigint;
  epochHeight?: bigint;
}

export function assertCoreClient(client: Client): asserts client is CoreSpaceClient {
  if (client.family !== 'core') {
    throw new ContractsError({
      code: 'contracts/unsupported-family',
      message: `bridge helpers require a Core Space client (got family="${client.family}")`,
      meta: { family: client.family },
    });
  }
}

export function crossSpaceCallAddress(client: CoreSpaceClient): string {
  return hexToBase32(CROSS_SPACE_CALL_HEX, client.chain.id);
}

export function ensureEspaceAddress(addr: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 0x-prefixed 20-byte eSpace address, got: ${addr}`,
      meta: { address: addr },
    });
  }
  return addr as `0x${string}`;
}

export function assertCoreHexAddress(
  coreHexAddress: string,
): asserts coreHexAddress is `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(coreHexAddress)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 20-byte hex Core address, got: ${coreHexAddress}`,
      meta: { coreHexAddress },
    });
  }
}

export function bridgeWriteOptions(opts: BridgeBaseOptions) {
  return {
    ...(opts.gas !== undefined ? { gas: opts.gas } : {}),
    ...(opts.storageLimit !== undefined ? { storageLimit: opts.storageLimit } : {}),
    ...(opts.gasPrice !== undefined ? { gasPrice: opts.gasPrice } : {}),
    ...(opts.epochHeight !== undefined ? { epochHeight: opts.epochHeight } : {}),
    ...(opts.waitForReceipt ? { waitForReceipt: true } : {}),
  };
}
