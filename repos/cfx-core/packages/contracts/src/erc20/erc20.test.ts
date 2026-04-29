import { encodeAbiParameters, stringToHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { makeMockClient, makeMockSigner } from '../test/mocks.js';
import { erc20 } from './index.js';

const TOKEN: `0x${string}` = '0x000000000000000000000000000000000000cccc';

describe('erc20 typed helpers', () => {
  it('decodes balanceOf', async () => {
    const client = makeMockClient({
      rpc: { eth_call: encodeAbiParameters([{ type: 'uint256' }], [42n]) },
    });
    const balance = await erc20.balanceOf(
      { client, address: TOKEN },
      '0x0000000000000000000000000000000000000001',
    );
    expect(balance).toBe(42n);
  });

  it('decodes string symbol', async () => {
    // Encode a proper ABI string return.
    const data = encodeAbiParameters([{ type: 'string' }], ['CFX']);
    void stringToHex; // keep import warm
    const client = makeMockClient({ rpc: { eth_call: data } });
    const symbol = await erc20.symbol({ client, address: TOKEN });
    expect(symbol).toBe('CFX');
  });

  it('transfer returns a tx hash', async () => {
    const client = makeMockClient({
      gas: 21_000n,
      rpc: { eth_getTransactionCount: '0x0', eth_sendRawTransaction: '0xhash' },
    });
    const signer = makeMockSigner();
    const result = await erc20.transfer(
      { client, address: TOKEN, signer },
      '0x0000000000000000000000000000000000000003',
      1n,
    );
    expect(result.hash).toBe('0xhash');
  });
});
