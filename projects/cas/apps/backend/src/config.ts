import { fileURLToPath } from 'node:url';
import { AUTOMATION_MANAGER_ADDRESSES } from '@cfxdevkit/automation';
import { ZERO_ADDRESS } from '@cfxdevkit/cdk';
import { permitHandlerAddress, swappiPriceAdapterAddress } from '@cfxdevkit/protocol';

const DEFAULT_SQLITE_PATH = fileURLToPath(
  new URL('../../../.data/cas-dev.sqlite', import.meta.url),
);

export interface CasBackendConfig {
  port: number;
  host: string;
  sqlitePath: string;
  authSecret: string;
  corsOrigins: string[];
  network: 'testnet' | 'mainnet';
  rpcUrl: string;
  automationManagerAddress: `0x${string}`;
  priceAdapterAddress: `0x${string}`;
  permitHandlerAddress: `0x${string}`;
  adminAddresses: string[];
  poolsCacheTtlMs: number;
  sessionTtlMs: number;
  nonceTtlMs: number;
  keeperEnabled: boolean;
  keeperIntervalMs: number;
  keeperConcurrency: number;
  signerPrivateKey?: `0x${string}`;
  priceSource: 'gecko_terminal' | 'swappi';
  swappiRouterAddress?: `0x${string}`;
  maxGasPriceGwei: number;
}

const DEFAULT_TESTNET_RPC = 'https://evmtestnet.confluxrpc.com';
const DEFAULT_MAINNET_RPC = 'https://evm.confluxrpc.com';

// Helpers to map network name to eSpace chain ID for protocol address lookups
function espaceChainId(network: 'mainnet' | 'testnet'): 1030 | 71 {
  return network === 'mainnet' ? 1030 : 71;
}

export function resolveCasBackendConfig(env: NodeJS.ProcessEnv = process.env): CasBackendConfig {
  const port = Number(env.PORT ?? env.CAS_BACKEND_PORT ?? 3011);
  const network = readNetwork(env.NETWORK ?? env.CAS_NETWORK);
  const signerPrivateKey = readPrivateKey(env.SIGNER_PRIVATE_KEY);
  const swappiRouterAddress = readHexAddressOptional(env.SWAPPI_ROUTER_ADDRESS);
  return {
    port: Number.isInteger(port) && port > 0 ? port : 3011,
    host: env.CAS_BACKEND_HOST ?? '0.0.0.0',
    sqlitePath: env.CAS_SQLITE_PATH ?? DEFAULT_SQLITE_PATH,
    authSecret: env.CAS_AUTH_SECRET ?? 'cas-local-dev-secret',
    corsOrigins: splitList(env.CAS_CORS_ORIGINS ?? env.CAS_CORS_ORIGIN),
    network,
    rpcUrl:
      env.CONFLUX_ESPACE_RPC ??
      (network === 'mainnet'
        ? (env.CONFLUX_ESPACE_MAINNET_RPC ?? DEFAULT_MAINNET_RPC)
        : (env.CONFLUX_ESPACE_TESTNET_RPC ?? DEFAULT_TESTNET_RPC)),
    automationManagerAddress: readHexAddress(
      env.AUTOMATION_MANAGER_ADDRESS,
      AUTOMATION_MANAGER_ADDRESSES[network],
    ),
    priceAdapterAddress: readHexAddress(
      env.PRICE_ADAPTER_ADDRESS,
      swappiPriceAdapterAddress[espaceChainId(network)] ?? ZERO_ADDRESS,
    ),
    permitHandlerAddress: readHexAddress(
      env.PERMIT_HANDLER_ADDRESS,
      permitHandlerAddress[espaceChainId(network)] ?? ZERO_ADDRESS,
    ),
    adminAddresses: splitList(env.ADMIN_ADDRESSES).map((address) => address.toLowerCase()),
    poolsCacheTtlMs: readPositiveNumber(env.POOLS_CACHE_TTL_MS, 30 * 60 * 1000),
    sessionTtlMs: readPositiveNumber(env.CAS_SESSION_TTL_MS, 24 * 60 * 60 * 1000),
    nonceTtlMs: readPositiveNumber(env.CAS_NONCE_TTL_MS, 5 * 60 * 1000),
    keeperEnabled: readBoolean(env.KEEPER_ENABLED),
    keeperIntervalMs: readPositiveNumber(env.KEEPER_INTERVAL_MS, 15_000),
    keeperConcurrency: readPositiveNumber(env.KEEPER_CONCURRENCY, 1),
    ...(signerPrivateKey ? { signerPrivateKey } : {}),
    priceSource: env.PRICE_SOURCE === 'gecko_terminal' ? 'gecko_terminal' : 'swappi',
    ...(swappiRouterAddress ? { swappiRouterAddress } : {}),
    maxGasPriceGwei: readPositiveNumber(env.MAX_GAS_PRICE_GWEI, 500),
  };
}

function readNetwork(value: string | undefined): CasBackendConfig['network'] {
  return value === 'testnet' ? 'testnet' : 'mainnet';
}

function readBoolean(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function splitList(value: string | undefined): string[] {
  return value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readHexAddress(
  value: string | undefined,
  fallback: `0x${string}` = ZERO_ADDRESS,
): `0x${string}` {
  return value?.startsWith('0x') ? (value as `0x${string}`) : fallback;
}

function readHexAddressOptional(value: string | undefined): `0x${string}` | undefined {
  return value?.startsWith('0x') ? (value as `0x${string}`) : undefined;
}

function readPrivateKey(value: string | undefined): `0x${string}` | undefined {
  return /^0x[0-9a-fA-F]{64}$/.test(value ?? '') ? (value as `0x${string}`) : undefined;
}
