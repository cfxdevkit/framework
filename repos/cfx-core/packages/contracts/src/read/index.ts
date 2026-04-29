/**
 * `@cfxdevkit/contracts/read` — typed contract reads via `eth_call`.
 *
 * The function takes a {@link Client} (no signer required), encodes the
 * function call with viem's pure helpers, dispatches `eth_call` through
 * `client.request()`, and decodes the return value back into the ABI's
 * declared output types.
 *
 * eSpace only in this revision; passing a Core Space client raises
 * `contracts/unsupported-family`.
 *
 * ```ts
 * const balance = await readContract({
 *   client,                         // espace client
 *   address: '0xToken…',
 *   abi: ERC20_ABI,
 *   functionName: 'balanceOf',
 *   args: ['0xUser…'],
 * });
 * ```
 */
import type { Client } from '@cfxdevkit/core';
import type { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { decodeFunctionResult, encodeFunctionData, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';

export interface ReadContractInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
> {
  client: Client;
  address: `0x${string}`;
  abi: TAbi;
  functionName: TName;
  args?: ContractFunctionArgs<TAbi, 'pure' | 'view', TName>;
  /** Block number (bigint) or tag (`'latest'` default). */
  blockTag?: 'latest' | 'pending' | 'earliest' | 'finalized' | 'safe' | bigint;
  /** Optional `from` address (some calls are sender-aware). */
  from?: `0x${string}`;
  signal?: AbortSignal;
}

export async function readContract<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
>(
  input: ReadContractInput<TAbi, TName>,
): Promise<ReturnType<typeof decodeFunctionResult<TAbi, TName>>> {
  if (input.client.family !== 'espace') {
    throw new ContractsError({
      code: 'contracts/unsupported-family',
      message: `readContract currently supports eSpace only (got family="${input.client.family}")`,
      meta: { family: input.client.family },
    });
  }

  const data = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]);

  const blockParam =
    input.blockTag === undefined
      ? 'latest'
      : typeof input.blockTag === 'bigint'
        ? toHex(input.blockTag)
        : input.blockTag;

  const callObject: Record<string, string> = { to: input.address, data };
  if (input.from !== undefined) callObject.from = input.from;

  const raw = await input.client.request<`0x${string}`>(
    {
      method: 'eth_call',
      params: [callObject, blockParam],
    },
    input.signal ? { signal: input.signal } : {},
  );

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
