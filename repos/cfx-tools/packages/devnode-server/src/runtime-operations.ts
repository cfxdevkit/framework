import {
  type ChainConfig,
  type Client,
  coreSpaceLocal,
  createClient,
  defineChain,
  deriveAccount,
  espaceLocal,
  http,
  type Signer,
  signerFromPrivateKey,
} from '@cfxdevkit/core';
import type { DevnodeServerController } from './controller.js';
import type { KeystoreService } from './keystore.js';
import {
  defaultNetworkChainIds,
  defaultNetworkConfig,
  type Network,
  type NetworkChainIds,
  type NetworkConfig,
  type NetworkMode,
  type NetworkState,
} from './network.js';

export type RuntimeSpace = 'core' | 'espace';

export interface ResolvedNetworkContext {
  chainIds: NetworkChainIds;
  config: NetworkConfig;
  mode: NetworkMode;
  network: Network;
}

export interface ResolvedRouteSigner {
  accountIndex: number;
  signer: Signer;
  source: 'env' | 'request' | 'keystore';
}

export function resolveNetworkContext(
  state: NetworkState,
  requestedNetwork?: string,
): ResolvedNetworkContext {
  const requested = normalizeNetwork(requestedNetwork);
  if (requested && requested !== state.current()) {
    return {
      network: requested,
      mode: requested === 'local' ? 'local' : 'public',
      config: defaultNetworkConfig(requested),
      chainIds: defaultNetworkChainIds(requested),
    };
  }

  const profile = state.profile();
  return {
    network: profile.network,
    mode: profile.mode,
    config: profile.config,
    chainIds: profile.chainIds,
  };
}

export function createRuntimeClient(
  controller: DevnodeServerController,
  context: ResolvedNetworkContext,
  space: RuntimeSpace,
): Client {
  if (context.mode === 'local') {
    const status = controller.status();
    const rpcUrl = space === 'core' ? status.urls?.core : status.urls?.espace;
    if (!status.running || !rpcUrl) {
      throw new Error('Local devnode is not running');
    }

    return createClient({
      chain: space === 'core' ? coreSpaceLocal : espaceLocal,
      transport: http({ timeoutMs: 15_000, url: rpcUrl }),
    });
  }

  const rpcUrl = space === 'core' ? context.config.coreRpc : context.config.espaceRpc;
  if (!rpcUrl) {
    throw new Error(
      space === 'core'
        ? 'Core Space RPC URL is not configured for the active public network profile'
        : 'eSpace RPC URL is not configured for the active public network profile',
    );
  }

  const chain = buildPublicChainConfig(context, space, rpcUrl);
  return createClient({
    chain,
    transport: http({ timeoutMs: 15_000, url: rpcUrl }),
  });
}

export async function resolveRouteSigner(input: {
  accountIndex?: number;
  context: ResolvedNetworkContext;
  keystore: KeystoreService;
  requestPrivateKey?: string;
  space: RuntimeSpace;
}): Promise<ResolvedRouteSigner> {
  const { accountIndex, context, keystore, requestPrivateKey, space } = input;
  if (context.mode === 'public') {
    return resolvePublicSigner({
      coreNetworkId: context.chainIds.core,
      keystore,
      space,
      ...(accountIndex === undefined ? {} : { accountIndex }),
      ...(requestPrivateKey === undefined ? {} : { requestPrivateKey }),
    });
  }

  if (requestPrivateKey) {
    return {
      accountIndex: accountIndex ?? 0,
      signer: signerFromPrivateKey(normalizePrivateKey(requestPrivateKey), context.chainIds.core),
      source: 'request',
    };
  }

  return resolveKeystoreSigner({
    coreNetworkId: context.chainIds.core,
    keystore,
    ...(accountIndex === undefined ? {} : { accountIndex }),
  });
}

export function signerAddress(signer: Signer, space: RuntimeSpace): string {
  return space === 'core'
    ? (signer.account.coreAddress ?? signer.account.address)
    : signer.account.address;
}

function buildPublicChainConfig(
  context: ResolvedNetworkContext,
  space: RuntimeSpace,
  rpcUrl: string,
): ChainConfig {
  const fallback = space === 'core' ? coreSpaceLocal : espaceLocal;
  const chainId = space === 'core' ? context.chainIds.core : context.chainIds.espace;

  return defineChain({
    ...fallback,
    id: chainId,
    name: `${space}-${context.network}-runtime`,
    displayName:
      space === 'core'
        ? `Conflux Core Space ${context.network}`
        : `Conflux eSpace ${context.network}`,
    network: context.network,
    rpc: { http: [rpcUrl] },
  });
}

function envOverrideFor(space: RuntimeSpace): string | undefined {
  return space === 'core'
    ? (process.env.CFXDEVKIT_PUBLIC_CORE_PRIVATE_KEY ?? process.env.CFXDEVKIT_PUBLIC_PRIVATE_KEY)
    : (process.env.CFXDEVKIT_PUBLIC_EVM_PRIVATE_KEY ?? process.env.CFXDEVKIT_PUBLIC_PRIVATE_KEY);
}

function normalizeNetwork(value?: string): Network | undefined {
  return value === 'local' || value === 'testnet' || value === 'mainnet' ? value : undefined;
}

function normalizePrivateKey(value: string): `0x${string}` {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('privateKey must be a 0x-prefixed 32-byte hex string');
  }
  return normalized as `0x${string}`;
}

async function resolveKeystoreSigner(input: {
  accountIndex?: number;
  coreNetworkId: number;
  keystore: KeystoreService;
}): Promise<ResolvedRouteSigner> {
  const { accountIndex, coreNetworkId, keystore } = input;
  const wallet = keystore.listWallets().find((entry) => entry.active);
  if (!wallet) throw new Error('no active wallet is available');

  const resolvedAccountIndex = accountIndex ?? wallet.activeAccountIndex;
  if (
    !Number.isInteger(resolvedAccountIndex) ||
    resolvedAccountIndex < 0 ||
    resolvedAccountIndex >= wallet.accountCount
  ) {
    throw new Error(`account index out of range: ${String(resolvedAccountIndex)}`);
  }

  const mnemonic = await keystore.readWalletMnemonic(wallet.id);
  const segment = wallet.accountType === 'mining' ? 1 : 0;
  const espaceDerivationPath = `m/44'/60'/${segment}'/0/${resolvedAccountIndex}`;
  const derived = deriveAccount({
    mnemonic,
    path: espaceDerivationPath,
  });

  return {
    accountIndex: resolvedAccountIndex,
    signer: signerFromPrivateKey(derived.privateKey, coreNetworkId),
    source: 'keystore',
  };
}

async function resolvePublicSigner(input: {
  accountIndex?: number;
  coreNetworkId: number;
  keystore: KeystoreService;
  requestPrivateKey?: string;
  space: RuntimeSpace;
}): Promise<ResolvedRouteSigner> {
  const { accountIndex, coreNetworkId, keystore, requestPrivateKey, space } = input;
  const envOverride = envOverrideFor(space);
  if (envOverride) {
    return {
      accountIndex: accountIndex ?? 0,
      signer: signerFromPrivateKey(normalizePrivateKey(envOverride), coreNetworkId),
      source: 'env',
    };
  }

  if (requestPrivateKey) {
    return {
      accountIndex: accountIndex ?? 0,
      signer: signerFromPrivateKey(normalizePrivateKey(requestPrivateKey), coreNetworkId),
      source: 'request',
    };
  }

  return resolveKeystoreSigner({
    coreNetworkId,
    keystore,
    ...(accountIndex === undefined ? {} : { accountIndex }),
  });
}
