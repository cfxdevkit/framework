import { describe, expect, it } from 'vitest';
import {
  ERC20_ABI,
  ERC20_EXTENDED_ABI,
  ERC165_ABI,
  ERC721_ABI,
  ERC721_ENUMERABLE_ABI,
  ERC721_EXTENDED_ABI,
  ERC1155_ABI,
  ERC2612_ABI,
  ERC2981_ABI,
  ERC4626_ABI,
  erc20Abi,
  erc20ExtendedAbi,
  erc165Abi,
  erc721Abi,
  erc721EnumerableAbi,
  erc721ExtendedAbi,
  erc1155Abi,
  erc2612Abi,
  erc2981Abi,
  erc4626Abi,
  MULTICALL3_ABI,
  MULTICALL3_ADDRESS,
} from './index.js';

type AbiEntry = { type: string; name?: string; inputs?: readonly { type: string }[] };

function functionNames(abi: readonly AbiEntry[]): string[] {
  return abi.filter((entry) => entry.type === 'function').map((entry) => entry.name ?? '');
}

function expectFunctions(abi: readonly AbiEntry[], names: readonly string[]) {
  expect(functionNames(abi)).toEqual(expect.arrayContaining(names));
}

describe('@cfxdevkit/abis', () => {
  it('exposes the standard ABI shapes', () => {
    expect(Array.isArray(ERC20_ABI)).toBe(true);
    expect(Array.isArray(ERC20_EXTENDED_ABI)).toBe(true);
    expect(Array.isArray(ERC165_ABI)).toBe(true);
    expect(Array.isArray(ERC721_ABI)).toBe(true);
    expect(Array.isArray(ERC721_ENUMERABLE_ABI)).toBe(true);
    expect(Array.isArray(ERC721_EXTENDED_ABI)).toBe(true);
    expect(Array.isArray(ERC1155_ABI)).toBe(true);
    expect(Array.isArray(ERC2612_ABI)).toBe(true);
    expect(Array.isArray(ERC2981_ABI)).toBe(true);
    expect(Array.isArray(ERC4626_ABI)).toBe(true);
    expect(Array.isArray(MULTICALL3_ABI)).toBe(true);
  });

  it('camelCase aliases point to uppercase constants', () => {
    expect(erc20Abi).toBe(ERC20_ABI);
    expect(erc20ExtendedAbi).toBe(ERC20_EXTENDED_ABI);
    expect(erc165Abi).toBe(ERC165_ABI);
    expect(erc721Abi).toBe(ERC721_ABI);
    expect(erc721EnumerableAbi).toBe(ERC721_ENUMERABLE_ABI);
    expect(erc721ExtendedAbi).toBe(ERC721_EXTENDED_ABI);
    expect(erc1155Abi).toBe(ERC1155_ABI);
    expect(erc2612Abi).toBe(ERC2612_ABI);
    expect(erc2981Abi).toBe(ERC2981_ABI);
    expect(erc4626Abi).toBe(ERC4626_ABI);
  });

  it('ERC20 ABI contains the canonical functions', () => {
    expectFunctions(ERC20_ABI, [
      'name',
      'symbol',
      'decimals',
      'totalSupply',
      'balanceOf',
      'allowance',
      'approve',
      'transfer',
      'transferFrom',
    ]);
  });

  it('ERC2612 ABI contains permit with canonical signature', () => {
    expectFunctions(ERC2612_ABI, ['permit', 'nonces', 'DOMAIN_SEPARATOR']);
    const permit = ERC2612_ABI.find(
      (entry) => entry.type === 'function' && entry.name === 'permit',
    );
    expect(permit?.inputs?.map((input) => input.type)).toEqual([
      'address',
      'address',
      'uint256',
      'uint256',
      'uint8',
      'bytes32',
      'bytes32',
    ]);
  });

  it('extended ERC20 ABI includes permit, role, and pause helpers', () => {
    expectFunctions(ERC20_EXTENDED_ABI, [
      'permit',
      'mint',
      'burn',
      'burnFrom',
      'pause',
      'unpause',
      'hasRole',
      'grantRole',
      'revokeRole',
      'MINTER_ROLE',
      'PAUSER_ROLE',
    ]);
  });

  it('ERC721 extension ABIs cover enumerable, royalty, and role helpers', () => {
    expectFunctions(ERC721_ENUMERABLE_ABI, ['totalSupply', 'tokenByIndex', 'tokenOfOwnerByIndex']);
    expectFunctions(ERC2981_ABI, ['supportsInterface', 'royaltyInfo']);
    expectFunctions(ERC721_EXTENDED_ABI, [
      'totalSupply',
      'tokenByIndex',
      'tokenOfOwnerByIndex',
      'royaltyInfo',
      'safeMint',
      'burn',
      'pause',
      'unpause',
      'hasRole',
    ]);
  });

  it('ERC4626 ABI contains vault conversion, limit, preview, and action methods', () => {
    expectFunctions(ERC4626_ABI, [
      'asset',
      'totalAssets',
      'convertToShares',
      'convertToAssets',
      'maxDeposit',
      'maxWithdraw',
      'previewDeposit',
      'previewRedeem',
      'deposit',
      'mint',
      'withdraw',
      'redeem',
    ]);
  });

  it('Multicall3 deployment address is the canonical one', () => {
    expect(MULTICALL3_ADDRESS).toBe('0xcA11bde05977b3631167028862bE2a173976CA11');
  });
});
