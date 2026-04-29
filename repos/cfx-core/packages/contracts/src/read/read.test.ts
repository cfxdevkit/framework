import { encodeAbiParameters, pad, toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { ERC20_ABI } from '../abis/index.js';
import { ContractsError } from '../errors/index.js';
import { getRecordedCalls, makeMockClient } from '../test/mocks.js';
import { readContract } from './index.js';

const TOKEN: `0x${string}` = '0x000000000000000000000000000000000000aaaa';

describe('readContract', () => {
  it('encodes the call, sends eth_call, decodes the result', async () => {
    const client = makeMockClient({
      rpc: {
        eth_call: encodeAbiParameters([{ type: 'uint256' }], [123_456n]),
      },
    });

    const result = await readContract({
      client,
      address: TOKEN,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: ['0x0000000000000000000000000000000000000001'],
    });

    expect(result).toBe(123_456n);

    const [call] = getRecordedCalls(client);
    expect(call?.method).toBe('eth_call');
    const [callObj, blockTag] = call?.params as [{ to: string; data: string }, string];
    expect(callObj.to).toBe(TOKEN);
    // balanceOf(address) selector = 0x70a08231
    expect(callObj.data.startsWith('0x70a08231')).toBe(true);
    expect(blockTag).toBe('latest');
  });

  it('passes a numeric blockTag as hex', async () => {
    const client = makeMockClient({
      rpc: { eth_call: pad(toHex(0n)) },
    });

    await readContract({
      client,
      address: TOKEN,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
      blockTag: 123n,
    });

    const [call] = getRecordedCalls(client);
    const [, blockTag] = call?.params as [unknown, string];
    expect(blockTag).toBe('0x7b');
  });

  it('throws contracts/unsupported-family on a Core Space client', async () => {
    const client = makeMockClient({ family: 'core' });
    await expect(
      readContract({
        client,
        address: TOKEN,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
    ).rejects.toMatchObject({
      name: 'ContractsError',
      code: 'contracts/unsupported-family',
    });
  });

  it('wraps decode errors', async () => {
    const client = makeMockClient({ rpc: { eth_call: '0xdead' } });
    await expect(
      readContract({
        client,
        address: TOKEN,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
    ).rejects.toBeInstanceOf(ContractsError);
  });
});
