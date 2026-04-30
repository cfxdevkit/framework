/**
 * `@cfxdevkit/contracts/bridge` — typed helpers around the Conflux
 * **CrossSpaceCall** internal contract.
 *
 * The bridge is rooted on **Core Space** at the well-known internal address
 * {@link CROSS_SPACE_CALL_HEX}. Calling its methods from a Core signer lets
 * you move CFX or invoke contracts on **eSpace** without leaving the Core
 * client / signer pair.
 *
 * Directions:
 *
 * - **Core → eSpace.** {@link transferToEspace} pays CFX from a Core account
 *   to an arbitrary eSpace `0x…` address (typically the user's own mapped
 *   account). {@link callEspace} additionally calldata-invokes an eSpace
 *   contract while attaching value.
 * - **eSpace → Core.** Once CFX lands in the *mapped* eSpace account of a
 *   Core address, that Core address can recall it via
 *   {@link withdrawFromMapped}. The mapped balance / nonce can be inspected
 *   with {@link getMappedBalance} / {@link getMappedNonce}, and the mapped
 *   eSpace address derived deterministically with {@link mappedEspaceAddress}.
 *
 * All helpers require `client.family === 'core'` and a signer whose
 * `account.coreAddress` is set; pre-flight checks throw
 * `contracts/unsupported-family` or `contracts/invalid-argument` otherwise.
 */
import type { Client, CoreSpaceClient, Hex, Signer } from '@cfxdevkit/core';
import { hexToBase32 } from '@cfxdevkit/core/address';
import { hexToBigInt, keccak256, padHex, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';
import { readContract } from '../read/index.js';
import { type SendWriteResult, sendWrite } from '../write/index.js';

/** Hex address of the CrossSpaceCall internal contract on Core Space. */
export const CROSS_SPACE_CALL_HEX = '0x0888000000000000000000000000000000000006' as const;

/** Minimal CrossSpaceCall ABI — the methods this module wraps. */
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

/**
 * Derive the eSpace `0x…` address that mirrors a Core Space account.
 * Conflux defines this mapping as `keccak256(coreHexAddr20)[12:32]`.
 *
 * @param coreHexAddress 20-byte hex form of the Core address (the form
 *   stored as `account.address` on a `DualAddressAccount` / `Signer`).
 */
export function mappedEspaceAddress(coreHexAddress: Hex): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(coreHexAddress)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 20-byte hex Core address, got: ${coreHexAddress}`,
      meta: { coreHexAddress },
    });
  }
  const hash = keccak256(coreHexAddress);
  return `0x${hash.slice(-40)}` as `0x${string}`;
}

interface BridgeBaseOptions {
  client: Client;
  signer: Signer;
  /** Wait for receipt before resolving (default: false). */
  waitForReceipt?: boolean;
  /** Override gas / fees if you don't want the auto-estimate. */
  gas?: bigint;
  storageLimit?: bigint;
  gasPrice?: bigint;
  epochHeight?: bigint;
}

function assertCoreClient(client: Client): asserts client is CoreSpaceClient {
  if (client.family !== 'core') {
    throw new ContractsError({
      code: 'contracts/unsupported-family',
      message: `bridge helpers require a Core Space client (got family="${client.family}")`,
      meta: { family: client.family },
    });
  }
}

function crossSpaceCallAddress(client: CoreSpaceClient): string {
  // For Conflux Core, the EIP-155 `chain.id` equals the Conflux networkId
  // used by the base32 codec (1029 mainnet, 1 testnet, …).
  return hexToBase32(CROSS_SPACE_CALL_HEX, client.chain.id);
}

function ensureEspaceAddress(addr: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 0x-prefixed 20-byte eSpace address, got: ${addr}`,
      meta: { address: addr },
    });
  }
  return addr as `0x${string}`;
}

/**
 * Move CFX from the Core signer to an eSpace address (often the signer's own
 * mapped account, see {@link mappedEspaceAddress}). Encodes a call to
 * `CrossSpaceCall.transferEVM(bytes20 to)` with `value` attached.
 */
export async function transferToEspace(
  opts: BridgeBaseOptions & { to: string; value: bigint },
): Promise<SendWriteResult> {
  assertCoreClient(opts.client);
  const to = ensureEspaceAddress(opts.to);
  return sendWrite({
    client: opts.client,
    signer: opts.signer,
    address: crossSpaceCallAddress(opts.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName: 'transferEVM',
    args: [to],
    value: opts.value,
    ...(opts.gas !== undefined ? { gas: opts.gas } : {}),
    ...(opts.storageLimit !== undefined ? { storageLimit: opts.storageLimit } : {}),
    ...(opts.gasPrice !== undefined ? { gasPrice: opts.gasPrice } : {}),
    ...(opts.epochHeight !== undefined ? { epochHeight: opts.epochHeight } : {}),
    ...(opts.waitForReceipt ? { waitForReceipt: true } : {}),
  });
}

/**
 * Call an arbitrary eSpace contract from a Core signer, optionally attaching
 * CFX. Encodes `CrossSpaceCall.callEVM(bytes20 to, bytes data)`.
 */
export async function callEspace(
  opts: BridgeBaseOptions & { to: string; data: Hex; value?: bigint },
): Promise<SendWriteResult> {
  assertCoreClient(opts.client);
  const to = ensureEspaceAddress(opts.to);
  return sendWrite({
    client: opts.client,
    signer: opts.signer,
    address: crossSpaceCallAddress(opts.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName: 'callEVM',
    args: [to, opts.data],
    ...(opts.value !== undefined ? { value: opts.value } : {}),
    ...(opts.gas !== undefined ? { gas: opts.gas } : {}),
    ...(opts.storageLimit !== undefined ? { storageLimit: opts.storageLimit } : {}),
    ...(opts.gasPrice !== undefined ? { gasPrice: opts.gasPrice } : {}),
    ...(opts.epochHeight !== undefined ? { epochHeight: opts.epochHeight } : {}),
    ...(opts.waitForReceipt ? { waitForReceipt: true } : {}),
  });
}

/**
 * Recall CFX from the Core signer's *mapped* eSpace account back to that Core
 * address. The amount must already exist in the mapped account (top up via
 * {@link transferToEspace} or any external eSpace transfer to the address
 * returned by {@link mappedEspaceAddress}).
 */
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
    ...(opts.gas !== undefined ? { gas: opts.gas } : {}),
    ...(opts.storageLimit !== undefined ? { storageLimit: opts.storageLimit } : {}),
    ...(opts.gasPrice !== undefined ? { gasPrice: opts.gasPrice } : {}),
    ...(opts.epochHeight !== undefined ? { epochHeight: opts.epochHeight } : {}),
    ...(opts.waitForReceipt ? { waitForReceipt: true } : {}),
  });
}

/**
 * Read the balance held in `coreAddress`'s mapped eSpace account. Note: the
 * argument is the **Core hex** address (20 bytes), not its base32 form.
 */
export async function getMappedBalance(input: {
  client: Client;
  coreHexAddress: Hex;
}): Promise<bigint> {
  assertCoreClient(input.client);
  if (!/^0x[0-9a-fA-F]{40}$/.test(input.coreHexAddress)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 20-byte hex Core address, got: ${input.coreHexAddress}`,
    });
  }
  return (await readContract({
    client: input.client,
    address: crossSpaceCallAddress(input.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName: 'mappedBalance',
    args: [padHex(input.coreHexAddress, { size: 20 }) as `0x${string}`],
  })) as bigint;
}

/**
 * Read the nonce of `coreAddress`'s mapped eSpace account. Useful for
 * verifying that a previous {@link callEspace} actually advanced the nonce.
 */
export async function getMappedNonce(input: {
  client: Client;
  coreHexAddress: Hex;
}): Promise<bigint> {
  assertCoreClient(input.client);
  if (!/^0x[0-9a-fA-F]{40}$/.test(input.coreHexAddress)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 20-byte hex Core address, got: ${input.coreHexAddress}`,
    });
  }
  return (await readContract({
    client: input.client,
    address: crossSpaceCallAddress(input.client),
    abi: CROSS_SPACE_CALL_ABI,
    functionName: 'mappedNonce',
    args: [padHex(input.coreHexAddress, { size: 20 }) as `0x${string}`],
  })) as bigint;
}

/**
 * Hex-encode a uint256 as a 32-byte word. Re-exported so consumers building
 * raw `data` payloads for {@link callEspace} don't need to pull viem just for
 * this.
 */
export function uint256Hex(n: bigint): Hex {
  return toHex(n, { size: 32 }) as Hex;
}

/**
 * Inverse of {@link uint256Hex}. Tiny convenience for parsing CrossSpaceCall
 * `staticCallEVM` outputs.
 */
export function hexToUint256(hex: Hex): bigint {
  return hexToBigInt(hex);
}
