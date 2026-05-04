import { base32ToHex, isBase32Address } from '@cfxdevkit/core';
import type { AbiFunction } from 'viem';
import { isAddress as isEspaceAddress } from 'viem';
import type { DeployNetworkId } from '../contexts/CompilerSession.js';

export const NETWORK_LABEL: Record<DeployNetworkId, string> = {
  mainnet: 'Mainnet',
  testnet: 'Testnet',
  local: 'Local devnode',
  custom: 'Custom',
};

export const NETWORK_ORDER: DeployNetworkId[] = ['mainnet', 'testnet', 'local', 'custom'];

export function validateAddress(addr: string, family: 'core' | 'espace'): string | null {
  const trimmed = addr.trim();
  if (!trimmed) return 'Enter an address.';
  if (family === 'espace') return isEspaceAddress(trimmed) ? null : 'Not a valid eSpace address.';
  return isBase32Address(trimmed) ? null : 'Not a valid Core base32 address.';
}

export function coerceAddressArgs(value: unknown, type: string, isCore: boolean): unknown {
  if (!isCore) return value;
  if (type === 'address' && typeof value === 'string' && isBase32Address(value))
    return base32ToHex(value);
  if (type.startsWith('address[') && Array.isArray(value))
    return value.map((item) => coerceAddressArgs(item, 'address', isCore));
  return value;
}

export function parseArgs(
  raw: string,
  fn: AbiFunction,
): { ok: true; args: unknown[] } | { error: string } {
  if (fn.inputs.length === 0) return { ok: true, args: [] };
  const trimmed = raw.trim();
  if (trimmed === '') return { error: 'Expected a JSON array of arguments.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    return { error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!Array.isArray(parsed)) return { error: 'Args must be a JSON array.' };
  if (parsed.length !== fn.inputs.length)
    return { error: `Expected ${fn.inputs.length} args, got ${parsed.length}.` };
  return { ok: true, args: parsed };
}

export function placeholderFor(fn: AbiFunction): string {
  if (fn.inputs.length === 0) return 'no args';
  const sample = fn.inputs.map((input) => {
    if (input.type === 'address') return '"0x..."';
    if (input.type === 'string') return '"..."';
    if (input.type === 'bool') return 'true';
    if (input.type.startsWith('uint') || input.type.startsWith('int')) return '"100"';
    if (input.type.endsWith('[]')) return '[]';
    return '"..."';
  });
  return `[${sample.join(', ')}]`;
}

export function stringifyResult(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, item) => (typeof item === 'bigint' ? `${item.toString()}n` : item),
    2,
  );
}
