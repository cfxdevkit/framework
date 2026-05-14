import type {
  CasAdminJobsResponse,
  CasAdminStatusResponse,
  CasSafetyConfigPatchRequest,
  CasSafetyConfigResponse,
} from './admin.js';
import type {
  CasCreateJobRequest,
  CasExecutionDto,
  CasJobDto,
  CasJobStatus,
  CasJobType,
} from './jobs.js';
import type { CasPoolsResponse } from './pools.js';
import type { CasSystemStatusResponse } from './system.js';

export interface CasHealthResponse {
  ok: boolean;
  backend: 'cas';
  storage: {
    kind: 'sqlite';
    path: string;
  };
  auth: {
    nonceStore: 'sqlite';
    sessionMode: 'hmac';
  };
}

export interface CasAuthNonceResponse {
  nonce: string;
}

export interface CasAuthVerifyRequest {
  message: string;
  signature: `0x${string}`;
}

export interface CasAuthVerifyResponse {
  token: string;
  address: string;
  isAdmin?: boolean;
}

export interface CasSessionResponse {
  address: string;
  issuedAt: number;
  expiresAt: number;
  isAdmin?: boolean;
  claims?: Record<string, unknown>;
}

export interface CasJobListFilters {
  status?: CasJobStatus;
  type?: CasJobType;
}

export interface CasJobsResponse {
  jobs: CasJobDto[];
}

export interface CasJobResponse {
  job: CasJobDto;
}

export interface CasExecutionsResponse {
  executions: CasExecutionDto[];
}

export interface CasApiClientOptions {
  baseUrl?: string;
  token?: string | null;
  fetch?: typeof fetch;
}

export class CasApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(readErrorMessage(body) ?? `CAS API request failed with status ${status}`);
    this.name = 'CasApiError';
    this.status = status;
    this.body = body;
  }
}

export class CasApiClient {
  readonly baseUrl: string;
  readonly token: string | null;
  readonly #fetch: typeof fetch;

  constructor(options: CasApiClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? 'http://127.0.0.1:3011');
    this.token = options.token ?? null;
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  withToken(token: string | null): CasApiClient {
    return new CasApiClient({ baseUrl: this.baseUrl, token, fetch: this.#fetch });
  }

  health(): Promise<CasHealthResponse> {
    return this.#request('/health');
  }

  nonce(address: string): Promise<CasAuthNonceResponse> {
    return this.#request(`/auth/nonce?address=${encodeURIComponent(address)}`);
  }

  verify(body: CasAuthVerifyRequest): Promise<CasAuthVerifyResponse> {
    return this.#request('/auth/verify', { method: 'POST', body });
  }

  me(): Promise<CasSessionResponse> {
    return this.#request('/auth/me', { auth: true });
  }

  jobs(filters: CasJobListFilters = {}): Promise<CasJobsResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    const suffix = params.size ? `?${params.toString()}` : '';
    return this.#request(`/jobs${suffix}`, { auth: true });
  }

  job(id: string): Promise<CasJobResponse> {
    return this.#request(`/jobs/${encodeURIComponent(id)}`, { auth: true });
  }

  createJob(body: CasCreateJobRequest): Promise<CasJobResponse> {
    return this.#request('/jobs', { method: 'POST', auth: true, body });
  }

  cancelJob(id: string): Promise<CasJobResponse> {
    return this.#request(`/jobs/${encodeURIComponent(id)}/cancel`, { method: 'POST', auth: true });
  }

  deleteJob(id: string): Promise<CasJobResponse> {
    return this.#request(`/jobs/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
  }

  executions(id: string): Promise<CasExecutionsResponse> {
    return this.#request(`/jobs/${encodeURIComponent(id)}/executions`, { auth: true });
  }

  adminStatus(): Promise<CasAdminStatusResponse> {
    return this.#request('/admin/status', { auth: true });
  }

  adminPause(): Promise<CasAdminStatusResponse> {
    return this.#request('/admin/pause', { method: 'POST', auth: true });
  }

  adminResume(): Promise<CasAdminStatusResponse> {
    return this.#request('/admin/resume', { method: 'POST', auth: true });
  }

  adminJobs(status?: CasJobStatus): Promise<CasAdminJobsResponse> {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.#request(`/admin/jobs${suffix}`, { auth: true });
  }

  adminSafetyConfig(): Promise<CasSafetyConfigResponse> {
    return this.#request('/admin/safety', { auth: true });
  }

  adminPatchSafetyConfig(body: CasSafetyConfigPatchRequest): Promise<CasSafetyConfigResponse> {
    return this.#request('/admin/safety', { method: 'PATCH', auth: true, body });
  }

  pools(): Promise<CasPoolsResponse> {
    return this.#request('/pools');
  }

  poolsRefresh(): Promise<CasPoolsResponse> {
    return this.#request('/pools/refresh', { method: 'POST' });
  }

  systemStatus(): Promise<CasSystemStatusResponse> {
    return this.#request('/system/status');
  }

  sseUrl(token = this.token): string {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${this.baseUrl}/sse/jobs${query}`;
  }

  async #request<T>(path: string, options: CasRequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('accept', 'application/json');
    if (options.body !== undefined) headers.set('content-type', 'application/json');
    if (options.auth && this.token) headers.set('authorization', `Bearer ${this.token}`);

    const requestInit: RequestInit = {
      method: options.method ?? 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    };

    const response = await this.#fetch(`${this.baseUrl}${path}`, requestInit);
    const body = await readJson(response);
    if (!response.ok) throw new CasApiError(response.status, body);
    return body as T;
  }
}

interface CasRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readErrorMessage(body: unknown): string | null {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const error = (body as { error?: unknown }).error;
    return typeof error === 'string' ? error : null;
  }
  return null;
}
