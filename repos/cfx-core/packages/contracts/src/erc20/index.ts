/**
 * `@cfxdevkit/contracts/erc20` — narrow, typed helpers around ERC-20.
 *
 * These are thin convenience wrappers over {@link readContract} / {@link sendWrite}
 * that pre-bind the ABI and function name. They exist so the typical
 * "fetch metadata + transfer" flow is one import per call instead of four.
 */
import type { Address, Client, Signer } from '@cfxdevkit/core';
import { ERC20_ABI } from '../abis/index.js';
import { readContract } from '../read/index.js';
import { type SendWriteResult, sendWrite } from '../write/index.js';

export interface Erc20Bind {
  client: Client;
  address: Address;
}

export const erc20 = {
  name: ({ client, address }: Erc20Bind): Promise<string> =>
    readContract({ client, address, abi: ERC20_ABI, functionName: 'name' }) as Promise<string>,

  symbol: ({ client, address }: Erc20Bind): Promise<string> =>
    readContract({ client, address, abi: ERC20_ABI, functionName: 'symbol' }) as Promise<string>,

  decimals: ({ client, address }: Erc20Bind): Promise<number> =>
    readContract({ client, address, abi: ERC20_ABI, functionName: 'decimals' }) as Promise<number>,

  totalSupply: ({ client, address }: Erc20Bind): Promise<bigint> =>
    readContract({
      client,
      address,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
    }) as Promise<bigint>,

  balanceOf: ({ client, address }: Erc20Bind, owner: Address): Promise<bigint> =>
    readContract({
      client,
      address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [owner],
    }) as Promise<bigint>,

  allowance: ({ client, address }: Erc20Bind, owner: Address, spender: Address): Promise<bigint> =>
    readContract({
      client,
      address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender],
    }) as Promise<bigint>,

  transfer: (
    bind: Erc20Bind & { signer: Signer },
    to: Address,
    amount: bigint,
    options?: { waitForReceipt?: boolean },
  ): Promise<SendWriteResult> =>
    sendWrite({
      client: bind.client,
      signer: bind.signer,
      address: bind.address,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, amount],
      ...(options?.waitForReceipt ? { waitForReceipt: true } : {}),
    }),

  approve: (
    bind: Erc20Bind & { signer: Signer },
    spender: Address,
    amount: bigint,
    options?: { waitForReceipt?: boolean },
  ): Promise<SendWriteResult> =>
    sendWrite({
      client: bind.client,
      signer: bind.signer,
      address: bind.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
      ...(options?.waitForReceipt ? { waitForReceipt: true } : {}),
    }),
} as const;
