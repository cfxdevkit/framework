import { describe, expect, it } from 'vitest';
import { BASIC_ERC721_PATH, BASIC_ERC721_SOURCE } from './source.js';

describe('templates/erc721/source', () => {
  it('exposes a self-contained BasicErc721 source', () => {
    expect(BASIC_ERC721_PATH).toBe('cfxdevkit/BasicErc721.sol');
    expect(BASIC_ERC721_SOURCE).toContain('contract BasicErc721');
    expect(BASIC_ERC721_SOURCE).toContain('function safeMint(address to, uint256 tokenId)');
    expect(BASIC_ERC721_SOURCE).toContain('function ownerOf(uint256 tokenId)');
    expect(BASIC_ERC721_SOURCE).toContain('function balanceOf(address account)');
  });
});
