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

  it('uses cfx_call with epoch tag for Core Space clients', async () => {
    const client = makeMockClient({
      family: 'core',
      rpc: { cfx_call: encodeAbiParameters([{ type: 'uint256' }], [7n]) },
    });

    const result = await readContract({
      client,
      address: 'cfxtest:acg158kvr8zanb1bs048ryb6rtrhr283ma70vz70tx',
      abi: ERC20_ABI,
      functionName: 'totalSupply',
      epochTag: 'latest_state',
    });
    expect(result).toBe(7n);

    const [call] = getRecordedCalls(client);
    expect(call?.method).toBe('cfx_call');
    const [, epoch] = call?.params as [unknown, string];
    expect(epoch).toBe('latest_state');
  });

  it('rejects 0x addresses on Core Space and base32 on eSpace', async () => {
    const core = makeMockClient({ family: 'core' });
    await expect(
      readContract({
        client: core,
        address: TOKEN,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
    ).rejects.toMatchObject({ code: 'contracts/invalid-argument' });

    const espace = makeMockClient();
    await expect(
      readContract({
        client: espace,
        address: 'cfxtest:acg158kvr8zanb1bs048ryb6rtrhr283ma70vz70tx',
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
    ).rejects.toMatchObject({ code: 'contracts/invalid-argument' });
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
