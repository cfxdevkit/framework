/**
 * `@cfxdevkit/contracts/read` — typed contract reads.
 *
 * Encodes the call with viem's pure helpers, dispatches the chain-appropriate
 * RPC through `client.request()`, decodes the return value back into the
 * ABI's declared output types.
 *
 * - **eSpace** (`family: 'espace'`): `eth_call` with a 0x-hex `to` address.
 * - **Core Space** (`family: 'core'`): `cfx_call` with a base32 `to` address
 *   (`cfx:…` / `cfxtest:…` / `net<id>:…`) and an optional `epochTag`.
 */
import type { Client, EpochTag } from '@cfxdevkit/cdk';
import type { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { decodeFunctionResult, encodeFunctionData, isAddress, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';

/** Epoch tags accepted by `cfx_call` (no `latest_confirmed`). */
export type ReadEpochTag = Exclude<EpochTag, 'latest_confirmed'>;

export interface ReadContractInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
> {
  client: Client;
  /**
   * Contract address.
   *
   * - eSpace: `0x`-prefixed 20-byte hex.
   * - Core Space: base32 (`cfx:…` / `cfxtest:…` / `net<id>:…`).
   */
  address: string;
  abi: TAbi;
  functionName: TName;
  args?: ContractFunctionArgs<TAbi, 'pure' | 'view', TName>;
  /** eSpace block selector. Ignored for Core Space (use `epochTag`). */
  blockTag?: 'latest' | 'pending' | 'earliest' | 'finalized' | 'safe' | bigint;
  /** Core Space epoch selector. Ignored for eSpace (use `blockTag`). */
  epochTag?: ReadEpochTag;
  /** Optional caller. eSpace: 0x hex; Core Space: base32. */
  from?: string;
  signal?: AbortSignal;
}

export async function readContract<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
>(
  input: ReadContractInput<TAbi, TName>,
): Promise<ReturnType<typeof decodeFunctionResult<TAbi, TName>>> {
  const data = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]);

  const raw =
    input.client.family === 'core' ? await callCore(input, data) : await callEspace(input, data);

  try {
    return decodeFunctionResult({
      abi: input.abi,
      functionName: input.functionName,
      data: raw,
    } as Parameters<typeof decodeFunctionResult>[0]) as ReturnType<
      typeof decodeFunctionResult<TAbi, TName>
    >;
  } catch (cause) {
    throw new ContractsError({
      code: 'contracts/decode-failure',
      message: `failed to decode result of ${String(input.functionName)} from ${input.address}`,
      cause,
      meta: { address: input.address, functionName: String(input.functionName), raw },
    });
  }
}

async function callEspace(
  input: ReadContractInput<Abi, ContractFunctionName<Abi, 'pure' | 'view'>>,
  data: `0x${string}`,
): Promise<`0x${string}`> {
  if (!isAddress(input.address)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `eSpace addresses must be 0x-prefixed 20-byte hex (got "${input.address}")`,
      meta: { address: input.address, family: 'espace' },
    });
  }
  if (input.from !== undefined && !isAddress(input.from)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `eSpace 'from' must be 0x hex (got "${input.from}")`,
    });
  }
  const blockParam =
    input.blockTag === undefined
      ? 'latest'
      : typeof input.blockTag === 'bigint'
        ? toHex(input.blockTag)
        : input.blockTag;
  const callObject: Record<string, string> = { to: input.address, data };
  if (input.from !== undefined) callObject.from = input.from;
  return input.client.request<`0x${string}`>(
    { method: 'eth_call', params: [callObject, blockParam] },
    input.signal ? { signal: input.signal } : {},
  );
}

async function callCore(
  input: ReadContractInput<Abi, ContractFunctionName<Abi, 'pure' | 'view'>>,
  data: `0x${string}`,
): Promise<`0x${string}`> {
  if (isAddress(input.address)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Core Space addresses must be base32 (got 0x hex "${input.address}")`,
      meta: { address: input.address, family: 'core' },
    });
  }
  if (input.from !== undefined && isAddress(input.from)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Core Space 'from' must be base32 (got 0x hex "${input.from}")`,
    });
  }
  const callObject: Record<string, string> = { to: input.address, data };
  if (input.from !== undefined) callObject.from = input.from;
  const epochParam = input.epochTag ?? 'latest_state';
  return input.client.request<`0x${string}`>(
    { method: 'cfx_call', params: [callObject, epochParam] },
    input.signal ? { signal: input.signal } : {},
  );
}
