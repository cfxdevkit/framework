import { parseUnits } from '@cfxdevkit/core';
import type { Hex } from 'viem';

export function coerceArg(type: string, raw: string): unknown {
  if (type === 'string') return raw;
  if (type === 'bool') return raw === 'true' || raw === '1';
  if (type === 'address') return raw as Hex;
  if (type.startsWith('uint') || type.startsWith('int')) return BigInt(raw);
  return raw;
}

export function constructorValue(
  name: string,
  type: string,
  raw: string,
  values: Record<string, string>,
) {
  if (name === 'initialSupply') return parseUnits(raw || '0', Number(values.decimals_ ?? '18'));
  return coerceArg(type, raw);
}
