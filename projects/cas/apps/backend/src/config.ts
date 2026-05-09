import { fileURLToPath } from 'node:url';

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
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const DEFAULT_TESTNET_RPC = 'https://evmtestnet.confluxrpc.com';
const DEFAULT_MAINNET_RPC = 'https://evm.confluxrpc.com';

export function resolveCasBackendConfig(env: NodeJS.ProcessEnv = process.env): CasBackendConfig {
  const port = Number(env.PORT ?? env.CAS_BACKEND_PORT ?? 3011);
  const network = env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
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
    automationManagerAddress: readHexAddress(env.AUTOMATION_MANAGER_ADDRESS),
    priceAdapterAddress: readHexAddress(env.PRICE_ADAPTER_ADDRESS),
    permitHandlerAddress: readHexAddress(env.PERMIT_HANDLER_ADDRESS),
    adminAddresses: splitList(env.ADMIN_ADDRESSES).map((address) => address.toLowerCase()),
    poolsCacheTtlMs: readPositiveNumber(env.POOLS_CACHE_TTL_MS, 30 * 60 * 1000),
    sessionTtlMs: readPositiveNumber(env.CAS_SESSION_TTL_MS, 24 * 60 * 60 * 1000),
    nonceTtlMs: readPositiveNumber(env.CAS_NONCE_TTL_MS, 5 * 60 * 1000),
  };
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

function readHexAddress(value: string | undefined): `0x${string}` {
  return value?.startsWith('0x') ? (value as `0x${string}`) : ZERO_ADDRESS;
}
