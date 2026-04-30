/**
 * Frontend client for `@cfxdevkit/example-showcase-backend`.
 * Base URL is taken from `VITE_BACKEND_URL` (defaults to localhost:5174).
 */
const BASE = (import.meta.env?.VITE_BACKEND_URL as string | undefined) ?? 'http://127.0.0.1:5174';

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

async function call<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    signal: signal ?? init.signal ?? null,
  });
  let body: unknown = null;
  const text = await res.text();
  try {
    body = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error(
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`,
    ) as ApiError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}

export const api = {
  baseUrl: BASE,
  health: (signal?: AbortSignal) => call<{ ok: boolean; name: string }>('/health', {}, signal),

  authNonce: (address: string, signal?: AbortSignal) =>
    call<{ nonce: string }>(`/auth/nonce?address=${encodeURIComponent(address)}`, {}, signal),
  authVerify: (payload: { message: string; signature: string }, signal?: AbortSignal) =>
    call<{ token: string; address: string }>(
      '/auth/verify',
      { method: 'POST', body: JSON.stringify(payload) },
      signal,
    ),
  authMe: (token: string, signal?: AbortSignal) =>
    call<{ address: string; issuedAt: number; expiresAt: number }>(
      '/auth/me',
      { headers: { Authorization: `Bearer ${token}` } },
      signal,
    ),

  sessionKeyIssue: (
    payload: {
      parentPrivateKey: string;
      capability: {
        chains?: number[];
        contracts?: string[];
        selectors?: string[];
        maxValuePerTx?: string;
        notAfter?: number;
      };
    },
    signal?: AbortSignal,
  ) =>
    call<{
      parent: string;
      session: string;
      attestation: { message: string; signature: string; digest: string };
      capability: Record<string, unknown>;
    }>('/session-key/issue', { method: 'POST', body: JSON.stringify(payload) }, signal),
  sessionKeyVerify: (
    payload: {
      parent: string;
      session: string;
      capability: {
        chains?: number[];
        contracts?: string[];
        selectors?: string[];
        maxValuePerTx?: string;
        notAfter?: number;
      };
      signature: string;
    },
    signal?: AbortSignal,
  ) =>
    call<{ valid: boolean; message: string }>(
      '/session-key/verify',
      { method: 'POST', body: JSON.stringify(payload) },
      signal,
    ),

  devnodeStatus: (signal?: AbortSignal) =>
    call<DevNodeStatusResponse>('/devnode/status', {}, signal),
  devnodeStart: (
    body: {
      mnemonic?: string;
      accounts?: number;
      miningIntervalMs?: number;
      logging?: boolean;
    } = {},
    signal?: AbortSignal,
  ) =>
    call<DevNodeStatusResponse>(
      '/devnode/start',
      { method: 'POST', body: JSON.stringify(body) },
      signal,
    ),
  devnodeStop: (signal?: AbortSignal) =>
    call<DevNodeStatusResponse>('/devnode/stop', { method: 'POST' }, signal),
  devnodeRestart: (signal?: AbortSignal) =>
    call<DevNodeStatusResponse>('/devnode/restart', { method: 'POST' }, signal),
  devnodeWipe: (signal?: AbortSignal) =>
    call<DevNodeStatusResponse>('/devnode/wipe', { method: 'POST' }, signal),
  devnodeMine: (body: { blocks?: number; pack?: boolean } = {}, signal?: AbortSignal) =>
    call<DevNodeStatusResponse>(
      '/devnode/mine',
      { method: 'POST', body: JSON.stringify(body) },
      signal,
    ),

  compileTemplates: (signal?: AbortSignal) =>
    call<{ templates: TemplateMetaResponse[] }>('/compile/templates', {}, signal),
  compile: (body: { templateId: string }, signal?: AbortSignal) =>
    call<CompileTemplateResponse>(
      '/compile',
      { method: 'POST', body: JSON.stringify(body) },
      signal,
    ),
  compileSources: (
    body: {
      sources: { path: string; content: string }[];
      contractName: string;
      solcVersion: string;
      evmVersion?: string;
    },
    signal?: AbortSignal,
  ) =>
    call<CompileTemplateResponse>(
      '/compile/sources',
      { method: 'POST', body: JSON.stringify(body) },
      signal,
    ),
  compileCatalog: (signal?: AbortSignal) =>
    call<{ entries: CatalogEntry[] }>('/compile/catalog', {}, signal),
};

export interface DevNodeAccountResponse {
  index: number;
  evmAddress: string;
  coreAddress: string;
  privateKey: string;
  initialBalanceCfx: string;
}

export interface DevNodeStatusResponse {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  running: boolean;
  urls?: { core: string; espace: string; coreWs: string; espaceWs: string };
  config?: {
    chainId: number;
    evmChainId: number;
    coreRpcPort: number;
    evmRpcPort: number;
    accounts: number;
    balanceCfx: string;
    miningIntervalMs: number;
    dataDir: string;
    mnemonic: string;
  };
  mining?: { enabled: boolean; intervalMs: number; ticks: number; startedAt?: string };
  accounts?: DevNodeAccountResponse[];
  faucet?: DevNodeAccountResponse;
}

export interface TemplateSourceResponse {
  path: string;
  content: string;
}

export interface TemplateMetaResponse {
  id: string;
  name: string;
  description: string;
  contractName: string;
  solcVersion: string;
  constructorArgs: { name: string; type: string }[];
  sources: TemplateSourceResponse[];
}

export interface CompileTemplateResponse {
  templateId: string;
  contractName: string;
  abi: unknown[];
  bytecode: string;
  deployedBytecode: string;
  inputHash: string;
  warnings: { message: string; severity: 'warning' | 'info' }[];
  cached: boolean;
}

export interface CatalogEntry {
  templateId: string;
  name: string;
  description: string;
  contractName: string;
  solcVersion: string;
  constructorArgs: { name: string; type: string }[];
  sources: TemplateSourceResponse[];
  abi: unknown[];
  bytecode: string;
  deployedBytecode: string;
  inputHash: string;
}
