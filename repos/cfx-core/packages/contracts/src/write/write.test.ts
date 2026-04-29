import { encodeAbiParameters, toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import { ERC20_ABI } from '../abis/index.js';
import { getRecordedCalls, makeMockClient, makeMockSigner } from '../test/mocks.js';
import { prepareWrite, sendWrite } from './index.js';

const TOKEN: `0x${string}` = '0x000000000000000000000000000000000000bbbb';
const RECIPIENT: `0x${string}` = '0x0000000000000000000000000000000000000002';

describe('prepareWrite', () => {
  it('returns a SignableTx with the encoded call data', () => {
    const tx = prepareWrite({
      address: TOKEN,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [RECIPIENT, 100n],
      chainId: 71,
    });
    expect(tx.to).toBe(TOKEN);
    expect(tx.chainId).toBe(71);
    // transfer(address,uint256) selector
    expect(tx.data?.startsWith('0xa9059cbb')).toBe(true);
  });

  it('omits optional fields that were not supplied', () => {
    const tx = prepareWrite({
      address: TOKEN,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [RECIPIENT, 1n],
      chainId: 1,
    });
    expect(tx.value).toBeUndefined();
    expect(tx.gas).toBeUndefined();
    expect(tx.maxFeePerGas).toBeUndefined();
  });
});

describe('sendWrite', () => {
  it('fills nonce/gas/fees, signs, and broadcasts', async () => {
    const client = makeMockClient({
      gas: 50_000n,
      baseFeePerGas: 2_000_000_000n,
      rpc: {
        eth_getTransactionCount: '0x05',
        eth_sendRawTransaction: '0xabc',
      },
    });
    const signer = makeMockSigner({ rawTx: '0xfeedface' });

    const result = await sendWrite({
      client,
      signer,
      address: TOKEN,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [RECIPIENT, 1n],
    });

    expect(result.hash).toBe('0xabc');
    expect(result.rawTransaction).toBe('0xfeedface');
    expect(signer.history).toHaveLength(1);
    const signed = signer.history[0];
    expect(signed?.chainId).toBe(71);
    expect(signed?.nonce).toBe(5);
    expect(signed?.gas).toBe(50_000n);
    expect(signed?.maxPriorityFeePerGas).toBe(1_000_000_000n);
    expect(signed?.maxFeePerGas).toBe(2_000_000_000n * 2n + 1_000_000_000n);

    const methods = getRecordedCalls(client).map((c) => c.method);
    expect(methods).toContain('eth_getTransactionCount');
    expect(methods).toContain('eth_sendRawTransaction');
  });

  it('waits for receipt when requested', async () => {
    const receipt = {
      status: 'success' as const,
      blockNumber: 1n,
      contractAddress: null,
    } as never;
    const client = makeMockClient({
      gas: 21_000n,
      receipt,
      rpc: {
        eth_getTransactionCount: '0x0',
        eth_sendRawTransaction: '0xhash',
      },
    });
    const signer = makeMockSigner();

    const result = await sendWrite({
      client,
      signer,
      address: TOKEN,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [RECIPIENT, 1n],
      waitForReceipt: true,
      pollIntervalMs: 1,
      receiptTimeoutMs: 100,
    });
    expect(result.receipt).toBeDefined();
  });

  it('throws contracts/reverted on a reverted receipt', async () => {
    const receipt = { status: 'reverted', blockNumber: 2n } as never;
    const client = makeMockClient({
      gas: 21_000n,
      receipt,
      rpc: { eth_getTransactionCount: '0x0', eth_sendRawTransaction: '0xhash' },
    });
    const signer = makeMockSigner();

    await expect(
      sendWrite({
        client,
        signer,
        address: TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [RECIPIENT, 1n],
        waitForReceipt: true,
        pollIntervalMs: 1,
        receiptTimeoutMs: 100,
      }),
    ).rejects.toMatchObject({ code: 'contracts/reverted' });
  });

  it('throws contracts/unsupported-family on Core Space', async () => {
    const client = makeMockClient({ family: 'core' });
    const signer = makeMockSigner();
    await expect(
      sendWrite({
        client,
        signer,
        address: TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [RECIPIENT, 1n],
      }),
    ).rejects.toMatchObject({ code: 'contracts/unsupported-family' });
  });

  // Sanity: ensure encodeAbiParameters/toHex remain importable for downstream tests.
  it('helpers still available', () => {
    expect(typeof encodeAbiParameters).toBe('function');
    expect(typeof toHex).toBe('function');
  });
});
