/** Minimal ERC-165 interface detection ABI. */
export const ERC165_ABI = [
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;
export const erc165Abi = ERC165_ABI;
export type ERC165_ABI = typeof ERC165_ABI;
