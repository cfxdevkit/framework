/**
 * `@cfxdevkit/contracts/erc20` — narrow, typed helpers around ERC-20.
 *
 * These are thin convenience wrappers over {@link readContract} / {@link sendWrite}
 * that pre-bind the ABI and function name. They exist so the typical
 * "fetch metadata + transfer" flow is one import per call instead of four.
 *
 * Reads work on both eSpace and Core Space (use the address shape that
 * matches the bound `client.family`). Writes (`transfer`, `approve`) are
 * eSpace-only in this revision.
 */
import type { Client, Signer } from '@cfxdevkit/core';
import { ERC20_ABI } from '../abis/index.js';
import { readContract } from '../read/index.js';
import { type SendWriteResult, sendWrite } from '../write/index.js';

export interface Erc20Bind {
  client: Client;
  /** eSpace: `0x…` 20-byte hex; Core Space: `cfx:…` / `cfxtest:…` base32. */
  address: string;
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

  balanceOf: ({ client, address }: Erc20Bind, owner: string): Promise<bigint> =>
    readContract({
      client,
      address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [owner as `0x${string}`],
    }) as Promise<bigint>,

  allowance: ({ client, address }: Erc20Bind, owner: string, spender: string): Promise<bigint> =>
    readContract({
      client,
      address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner as `0x${string}`, spender as `0x${string}`],
    }) as Promise<bigint>,

  /** eSpace only in this revision. */
  transfer: (
    bind: Erc20Bind & { signer: Signer },
    to: string,
    amount: bigint,
    options?: { waitForReceipt?: boolean },
  ): Promise<SendWriteResult> =>
    sendWrite({
      client: bind.client,
      signer: bind.signer,
      address: bind.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, amount],
      ...(options?.waitForReceipt ? { waitForReceipt: true } : {}),
    }),

  /** eSpace only in this revision. */
  approve: (
    bind: Erc20Bind & { signer: Signer },
    spender: string,
    amount: bigint,
    options?: { waitForReceipt?: boolean },
  ): Promise<SendWriteResult> =>
    sendWrite({
      client: bind.client,
      signer: bind.signer,
      address: bind.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, amount],
      ...(options?.waitForReceipt ? { waitForReceipt: true } : {}),
    }),
} as const;
