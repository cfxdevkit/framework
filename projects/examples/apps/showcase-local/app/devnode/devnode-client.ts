import type {
  DevnodeMineRequest,
  DevnodeProfileSelectionResponse,
  DevnodeProfileStateResponse,
  DevnodeStatusResponse,
} from '../../lib/devnode-types';

interface ErrorWithPayload extends Error {
  payload?: DevnodeStatusResponse;
}

export async function fetchDevnodeStatus(): Promise<DevnodeStatusResponse> {
  return requestDevnode('/api/devnode/status', { method: 'GET' });
}

export async function fetchDevnodeProfiles(): Promise<DevnodeProfileStateResponse> {
  return requestJson<DevnodeProfileStateResponse>('/api/devnode/profile', { method: 'GET' });
}

export async function selectDevnodeProfile(id: string): Promise<DevnodeProfileSelectionResponse> {
  return requestJson<DevnodeProfileSelectionResponse>(`/api/devnode/profile/${id}/select`, {
    method: 'PUT',
  });
}

export async function startDevnode(): Promise<DevnodeStatusResponse> {
  return requestDevnode('/api/devnode/start', { method: 'POST' });
}

export async function restartDevnode(): Promise<DevnodeStatusResponse> {
  return requestDevnode('/api/devnode/restart', { method: 'POST' });
}

export async function stopDevnode(): Promise<DevnodeStatusResponse> {
  return requestDevnode('/api/devnode/stop', { method: 'POST' });
}

export async function mineDevnode(input: DevnodeMineRequest): Promise<DevnodeStatusResponse> {
  return requestDevnode('/api/devnode/mine', {
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
}

export function isErrorWithPayload(error: unknown): error is ErrorWithPayload {
  return error instanceof Error && 'payload' in error;
}

async function requestDevnode(path: string, init: RequestInit): Promise<DevnodeStatusResponse> {
  const response = await fetch(path, { ...init, cache: 'no-store' });
  const payload = (await response.json()) as DevnodeStatusResponse & { error?: string };

  if (!response.ok) {
    const error = new Error(payload.error ?? `${init.method ?? 'GET'} ${path} failed`);
    (error as ErrorWithPayload).payload = payload;
    throw error;
  }

  return payload;
}

async function requestJson<T extends { error?: string }>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(path, { ...init, cache: 'no-store' });
  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(payload.error ?? `${init.method ?? 'GET'} ${path} failed`);
  }

  return payload;
}
