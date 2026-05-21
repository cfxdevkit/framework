/**
 * eSpace chain-switching utilities.
 *
 * `switchEspaceChain` — switch an eSpace wallet to a given Conflux eSpace chain.
 *
 * Calls `wallet_switchEthereumChain` first; if the chain is not recognised by
 * the wallet (error code 4902) it falls back to `wallet_addEthereumChain`.
 *
 * Works with any EIP-1193 provider that supports MetaMask-style chain methods
 * (MetaMask, Fluent eSpace mode, any injected wallet).
 */

import type { ChainConfig } from '@cfxdevkit/cdk/chains';
import { type Chain, toHex } from 'viem';

// ── Types ─────────────────────────────────────────────────────────────────

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

export interface SwitchChainOptions {
  /** Override the RPC URL used when adding the chain (useful for local devnodes). */
  rpcUrl?: string;
}

// ── Core implementation (works with any EIP-1193 provider) ────────────────

/**
 * Switch the provider's active chain to the one described by `chain`.
 * `chain` is a viem-style `Chain` object — you can pass any entry from
 * `@cfxdevkit/wallet-connect` (e.g. `espaceMainnet`, `espaceTestnet`, `espaceLocal`)
 * or build one from `@cfxdevkit/cdk/chains` via `toViemChain`.
 *
 * @throws if the user rejects the request or if the wallet does not support
 *         `wallet_switchEthereumChain` / `wallet_addEthereumChain`.
 */
export async function switchEspaceChain(
  provider: Eip1193Provider,
  chain: Chain,
  options: SwitchChainOptions = {},
): Promise<void> {
  const chainIdHex = toHex(chain.id);

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (err: unknown) {
    // 4902 = chain not added yet → fall through to addEthereumChain
    if (!isChainNotFoundError(err)) throw err;

    const rpcUrls = options.rpcUrl ? [options.rpcUrl] : [...(chain.rpcUrls.default.http ?? [])];

    const addParams: AddEthereumChainParameter = {
      chainId: chainIdHex,
      chainName: chain.name,
      nativeCurrency: {
        name: chain.nativeCurrency.name,
        symbol: chain.nativeCurrency.symbol,
        decimals: chain.nativeCurrency.decimals,
      },
      rpcUrls,
      ...(chain.blockExplorers?.default?.url
        ? { blockExplorerUrls: [chain.blockExplorers.default.url] }
        : {}),
    };

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [addParams],
    });
  }
}

// ── Convenience overload for @cfxdevkit/cdk ChainConfig objects ──────────

/**
 * Switch using a `ChainConfig` from `@cfxdevkit/cdk/chains` (e.g. `espaceTestnet`).
 * Avoids having to convert to a viem `Chain` first.
 */
export async function switchEspaceChainFromConfig(
  provider: Eip1193Provider,
  chainConfig: ChainConfig,
  options: SwitchChainOptions = {},
): Promise<void> {
  const rpcUrls = options.rpcUrl ? [options.rpcUrl] : [...chainConfig.rpc.http];
  const chainIdHex = toHex(chainConfig.id);

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (err: unknown) {
    if (!isChainNotFoundError(err)) throw err;

    const addParams: AddEthereumChainParameter = {
      chainId: chainIdHex,
      chainName: chainConfig.displayName,
      nativeCurrency: {
        name: 'Conflux',
        symbol: chainConfig.nativeToken.symbol,
        decimals: chainConfig.nativeToken.decimals,
      },
      rpcUrls,
      ...(chainConfig.explorer?.url ? { blockExplorerUrls: [chainConfig.explorer.url] } : {}),
    };

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [addParams],
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

interface AddEthereumChainParameter {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

function isChainNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: number; data?: { originalError?: { code?: number } } };
  return e.code === 4902 || e.data?.originalError?.code === 4902;
}
