// biome-ignore-all format: legacy ABI constants
import { CONFLUX_PRECOMPILE_ADDRESSES } from './addresses.js';

/**
 * AdminControl — Core Space internal contract.
 * Allows an admin to manage the admin relationship of a contract or destroy it.
 *
 * Address: 0x0888000000000000000000000000000000000000
 * Access: Core Space only (use `cive` client).
 */
export const adminControlAbi = [
  {
    type: 'function',
    name: 'getAdmin',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setAdmin',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
      { name: 'newAdmin', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'destroy',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export const ADMIN_CONTROL_ABI = adminControlAbi;
export const adminControlAddress = CONFLUX_PRECOMPILE_ADDRESSES.AdminControl;
