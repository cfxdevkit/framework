import { formatCFX } from '@cfxdevkit/core';

interface BalanceContext {
  eSpace: string;
  core: string;
}

async function requestRpc(space: 'core' | 'espace', method: string, params: unknown[]) {
  const res = await fetch(`/api/rpc/${space}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `${method} failed`);
  if (json.error) throw new Error(json.error.message ?? `${method} failed`);
  return json.result;
}

function formatBalance(value: unknown): string {
  if (typeof value !== 'string') return 'not loaded';
  try {
    return `${formatCFX(BigInt(value))} CFX`;
  } catch {
    return value;
  }
}

export async function readBalances(
  eSpaceAddress: string,
  coreAddress: string,
): Promise<BalanceContext> {
  const [eSpace, core] = await Promise.all([
    requestRpc('espace', 'eth_getBalance', [eSpaceAddress, 'latest']),
    requestRpc('core', 'cfx_getBalance', [coreAddress, 'latest_state']),
  ]);
  return { eSpace: formatBalance(eSpace), core: formatBalance(core) };
}
