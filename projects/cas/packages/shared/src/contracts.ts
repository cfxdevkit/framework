import type { CasHexAddress } from './jobs.js';
import { ZERO_ADDRESS as _ZERO_ADDRESS } from '@cfxdevkit/core';

// ── Re-exports from framework packages ───────────────────────────────────────

export { ZERO_ADDRESS, MAX_UINT256 } from '@cfxdevkit/core';
export { WCFX_ABI, AUTOMATION_MANAGER_ABI } from '@cfxdevkit/protocol';

const ZERO_ADDRESS = _ZERO_ADDRESS as CasHexAddress;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function readAutomationManagerAddress(value?: string): CasHexAddress {
  return value?.startsWith('0x') ? (value as CasHexAddress) : ZERO_ADDRESS;
}
