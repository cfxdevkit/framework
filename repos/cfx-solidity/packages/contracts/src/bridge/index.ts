import type { Client, Hex } from '@cfxdevkit/cdk';
import { hexToBigInt, keccak256, padHex, toHex } from 'viem';
import { readContract } from '../read/index.js';
import { type SendWriteResult, sendWrite } from '../write/index.js';
import {
  assertCoreClient,
  assertCoreHexAddress,
  type BridgeBaseOptions,
  bridgeWriteOptions,
  CROSS_SPACE_CALL_ABI,
  crossSpaceCallAddress,
  ensureEspaceAddress,
} from './internals.js';

export { CROSS_SPACE_CALL_ABI, CROSS_SPACE_CALL_HEX } from './internals.js';

export function mappedEspaceAddress(coreHexAddress: Hex): `0x${string}` {
  assertCoreHexAddress(coreHexAddress);
  const hash = keccak256(coreHexAddress);
  return `0x${hash.slice(-40)}` as `0x${string}`;
}

export async function transferToEspace(
  opts: BridgeBaseOptions & { to: string; value: bigint },
): Promise<SendWriteResult> {
  assertCoreClient(opts.client);
  return sendWrite({
    client: opts.client,
    signer: opts.signer,
    address: crossSpaceCallAddress(opts.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName: 'transferEVM',
    args: [ensureEspaceAddress(opts.to)],
    value: opts.value,
    ...bridgeWriteOptions(opts),
  });
}

export async function callEspace(
  opts: BridgeBaseOptions & { to: string; data: Hex; value?: bigint },
): Promise<SendWriteResult> {
  assertCoreClient(opts.client);
  return sendWrite({
    client: opts.client,
    signer: opts.signer,
    address: crossSpaceCallAddress(opts.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName: 'callEVM',
    args: [ensureEspaceAddress(opts.to), opts.data],
    ...(opts.value !== undefined ? { value: opts.value } : {}),
    ...bridgeWriteOptions(opts),
  });
}

export async function withdrawFromMapped(
  opts: BridgeBaseOptions & { value: bigint },
): Promise<SendWriteResult> {
  assertCoreClient(opts.client);
  return sendWrite({
    client: opts.client,
    signer: opts.signer,
    address: crossSpaceCallAddress(opts.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName: 'withdrawFromMapped',
    args: [opts.value],
    ...bridgeWriteOptions(opts),
  });
}

export async function getMappedBalance(input: {
  client: Client;
  coreHexAddress: Hex;
}): Promise<bigint> {
  return readMappedValue(input, 'mappedBalance');
}

export async function getMappedNonce(input: {
  client: Client;
  coreHexAddress: Hex;
}): Promise<bigint> {
  return readMappedValue(input, 'mappedNonce');
}

async function readMappedValue(
  input: { client: Client; coreHexAddress: Hex },
  functionName: 'mappedBalance' | 'mappedNonce',
): Promise<bigint> {
  assertCoreClient(input.client);
  assertCoreHexAddress(input.coreHexAddress);
  return (await readContract({
    client: input.client,
    address: crossSpaceCallAddress(input.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName,
    args: [padHex(input.coreHexAddress, { size: 20 }) as `0x${string}`],
  })) as bigint;
}

export function uint256Hex(n: bigint): Hex {
  return toHex(n, { size: 32 }) as Hex;
}

export function hexToUint256(hex: Hex): bigint {
  return hexToBigInt(hex);
}
