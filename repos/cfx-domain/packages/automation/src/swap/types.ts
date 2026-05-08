import type { Hex } from '@cfxdevkit/core';
import type { HexAddress, HexHash } from '../types.js';

export interface SwapRouterAddresses {
  factory: HexAddress;
  router: HexAddress;
}

export const SWAPPI_ADDRESSES = {
  testnet: {
    factory: '0x8d0d1c7c32d8a395c817B22Ff3BD6fFa2A7eBe08',
    router: '0x62B0873055Bf896Dd869e172119871ac24aeA305',
  },
  mainnet: {
    factory: '0x36B83F9d614a06abF5388F4d14cC64E5FF96892f',
    router: '0x62B0873055Bf896Dd869e172119871ac24aeA305',
  },
} as const satisfies Record<string, SwapRouterAddresses>;

export interface SwapQuoteInput {
  tokenIn: HexAddress;
  tokenOut: HexAddress;
  amountIn: bigint;
}

export interface SwapExecuteInput extends SwapQuoteInput {
  recipient: HexAddress;
  amountOutMin?: bigint;
  deadline?: bigint;
}

export interface SwapExecuteResult {
  txHash: HexHash;
  amountOut?: bigint;
  calldata: Hex;
}

export interface SwapReceiptLog {
  topics: readonly Hex[];
  data: Hex;
}

export interface SwapReceipt {
  status?: 'success' | 'reverted';
  logs: readonly SwapReceiptLog[];
}
