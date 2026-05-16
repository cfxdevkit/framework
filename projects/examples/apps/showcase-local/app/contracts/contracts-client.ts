import type {
  ContractNetworkId,
  ContractSpaceId,
  ShowcaseContractsResponse,
} from '../../lib/contracts-types';

interface FetchContractsOptions {
  chainId?: number;
  network?: ContractNetworkId;
  space?: ContractSpaceId;
}

export async function fetchContracts(
  options: FetchContractsOptions,
): Promise<ShowcaseContractsResponse> {
  const searchParams = new URLSearchParams();
  if (options.network) {
    searchParams.set('network', options.network);
  }
  if (options.space) {
    searchParams.set('space', options.space);
  }
  if (options.chainId !== undefined) {
    searchParams.set('chainId', String(options.chainId));
  }

  const query = searchParams.toString();
  return requestContracts<ShowcaseContractsResponse>(`/api/contracts${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

async function requestContracts<T extends { error?: string }>(
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
