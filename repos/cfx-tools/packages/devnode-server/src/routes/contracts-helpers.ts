import type { ContractNetwork } from '@cfxdevkit/devnode-core';

export interface ContractReadRequest {
  abi?: unknown[];
  address?: string;
  args?: unknown[];
  blockTag?: 'latest' | 'pending' | 'earliest' | 'finalized' | 'safe' | string | number;
  epochTag?: string;
  from?: string;
  functionName?: string;
  network?: ContractNetwork;
  space?: 'core' | 'espace';
}

export interface ContractWriteRequest {
  accountIndex?: number;
  abi?: unknown[];
  address?: string;
  args?: unknown[];
  functionName?: string;
  network?: ContractNetwork;
  privateKey?: string;
  space?: 'core' | 'espace';
  value?: number | string;
  waitForReceipt?: boolean;
}

export async function readBody<T>(c: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await c.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}

export function normalizeNetwork(value: unknown): ContractNetwork | undefined {
  return value === 'local' || value === 'testnet' || value === 'mainnet' ? value : undefined;
}

export function normalizeSpace(value: unknown): 'core' | 'espace' | undefined {
  return value === 'core' || value === 'espace' ? value : undefined;
}

export function normalizeChainId(value: string | null): number | undefined {
  if (value == null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function functionMutability(abi: unknown[], functionName: string): 'read' | 'write' | null {
  const entry = (abi as Array<{ name?: string; stateMutability?: string; type?: string }>).find(
    (item) => item.type === 'function' && item.name === functionName,
  );
  if (!entry) return null;
  return entry.stateMutability === 'view' || entry.stateMutability === 'pure' ? 'read' : 'write';
}

export function normalizeBlockTag(
  value: ContractReadRequest['blockTag'],
): 'latest' | 'pending' | 'earliest' | 'finalized' | 'safe' | bigint {
  if (typeof value === 'number') {
    return BigInt(value);
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return BigInt(value);
  }

  return (value ?? 'latest') as 'latest' | 'pending' | 'earliest' | 'finalized' | 'safe';
}

export function toJsonValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)]),
    );
  }

  return value;
}
