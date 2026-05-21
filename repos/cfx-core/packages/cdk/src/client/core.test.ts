import { beforeEach, describe, expect, it, vi } from 'vitest';
import { coreSpaceLocal, coreSpaceTestnet } from '../chains/index.js';
import { RpcError } from '../errors/index.js';
import { createCoreClient } from './core.js';
import { http } from './transport.js';

const {
  mockCiveClient,
  mockGetEpochNumber,
  mockGetStatus,
  mockGetBalance,
  mockGetTransactionReceipt,
  mockGetTransaction,
  mockGetLogs,
  mockGetSponsorInfo,
  mockGetAdmin,
  mockGetGasPrice,
  mockGetNextNonce,
  mockSendRawTransaction,
} = vi.hoisted(() => ({
  mockCiveClient: { request: vi.fn() },
  mockGetEpochNumber: vi.fn(),
  mockGetStatus: vi.fn(),
  mockGetBalance: vi.fn(),
  mockGetTransactionReceipt: vi.fn(),
  mockGetTransaction: vi.fn(),
  mockGetLogs: vi.fn(),
  mockGetSponsorInfo: vi.fn(),
  mockGetAdmin: vi.fn(),
  mockGetGasPrice: vi.fn(),
  mockGetNextNonce: vi.fn(),
  mockSendRawTransaction: vi.fn(),
}));

vi.mock('cive', async (importOriginal) => {
  const mod = await importOriginal<typeof import('cive')>();
  return { ...mod, createPublicClient: () => mockCiveClient };
});

vi.mock('cive/actions', () => ({
  getEpochNumber: mockGetEpochNumber,
  getStatus: mockGetStatus,
  getBalance: mockGetBalance,
  getTransactionReceipt: mockGetTransactionReceipt,
  getTransaction: mockGetTransaction,
  getLogs: mockGetLogs,
  GetSponsorInfo: mockGetSponsorInfo,
  getAdmin: mockGetAdmin,
  getGasPrice: mockGetGasPrice,
  getNextNonce: mockGetNextNonce,
  sendRawTransaction: mockSendRawTransaction,
}));

vi.mock('cive/utils', () => ({
  defineChain: (chain: unknown) => chain,
}));

const HASH = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as `0x${string}`;
const ADDR = 'cfxtest:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6f0vrcsw';

describe('createCoreClient', () => {
  const client = createCoreClient(coreSpaceTestnet, http());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('family is core', () => {
    expect(client.family).toBe('core');
  });

  it('chain is the provided chain', () => {
    expect(client.chain).toBe(coreSpaceTestnet);
  });

  it('getEpochNumber without epochTag', async () => {
    mockGetEpochNumber.mockResolvedValue(1000n);
    expect(await client.getEpochNumber()).toBe(1000n);
    expect(mockGetEpochNumber).toHaveBeenCalledWith(mockCiveClient, {});
  });

  it('getEpochNumber with epochTag', async () => {
    mockGetEpochNumber.mockResolvedValue(999n);
    await client.getEpochNumber({ epochTag: 'latest_finalized' });
    expect(mockGetEpochNumber).toHaveBeenCalledWith(mockCiveClient, {
      epochTag: 'latest_finalized',
    });
  });

  it('getEpochNumber wraps errors in RpcError', async () => {
    mockGetEpochNumber.mockRejectedValue(new Error('network'));
    await expect(client.getEpochNumber()).rejects.toBeInstanceOf(RpcError);
  });

  it('getStatus returns node status', async () => {
    const status = { chainId: 1, epochNumber: 100n, bestHash: HASH };
    mockGetStatus.mockResolvedValue(status);
    expect(await client.getStatus()).toBe(status);
  });

  it('getStatus wraps errors in RpcError', async () => {
    mockGetStatus.mockRejectedValue(new Error('timeout'));
    await expect(client.getStatus()).rejects.toBeInstanceOf(RpcError);
  });

  it('getBalance without epochTag', async () => {
    mockGetBalance.mockResolvedValue(500n);
    expect(await client.getBalance(ADDR)).toBe(500n);
    expect(mockGetBalance).toHaveBeenCalledWith(
      mockCiveClient,
      expect.objectContaining({ address: ADDR }),
    );
  });

  it('getBalance with epochTag', async () => {
    mockGetBalance.mockResolvedValue(500n);
    await client.getBalance(ADDR, { epochTag: 'latest_state' });
    expect(mockGetBalance).toHaveBeenCalledWith(
      mockCiveClient,
      expect.objectContaining({ epochTag: 'latest_state' }),
    );
  });

  it('getTransactionReceipt returns receipt when found', async () => {
    const receipt = { transactionHash: HASH };
    mockGetTransactionReceipt.mockResolvedValue(receipt);
    expect(await client.getTransactionReceipt(HASH)).toBe(receipt);
  });

  it('getTransactionReceipt returns null for TransactionReceiptNotFoundError', async () => {
    const err = Object.assign(new Error('not found'), {
      name: 'TransactionReceiptNotFoundError',
    });
    mockGetTransactionReceipt.mockRejectedValue(err);
    expect(await client.getTransactionReceipt(HASH)).toBeNull();
  });

  it('getTransactionReceipt wraps other errors in RpcError', async () => {
    mockGetTransactionReceipt.mockRejectedValue(new Error('rpc error'));
    await expect(client.getTransactionReceipt(HASH)).rejects.toBeInstanceOf(RpcError);
  });

  it('getTransaction returns the transaction when found', async () => {
    const tx = { hash: HASH, nonce: 0n };
    mockGetTransaction.mockResolvedValue(tx);
    expect(await client.getTransaction(HASH)).toBe(tx);
  });

  it('getTransaction returns null for TransactionNotFoundError', async () => {
    const err = Object.assign(new Error('not found'), { name: 'TransactionNotFoundError' });
    mockGetTransaction.mockRejectedValue(err);
    expect(await client.getTransaction(HASH)).toBeNull();
  });

  it('getTransaction wraps other errors in RpcError', async () => {
    mockGetTransaction.mockRejectedValue(new Error('bad hash'));
    await expect(client.getTransaction(HASH)).rejects.toBeInstanceOf(RpcError);
  });

  it('getLogs returns a list of logs', async () => {
    const logs = [{ address: ADDR, topics: [], data: '0x', transactionHash: HASH }];
    mockGetLogs.mockResolvedValue(logs);
    const result = await client.getLogs({ fromEpoch: 'latest_finalized' });
    expect(result).toBe(logs);
  });

  it('getLogs wraps errors in RpcError', async () => {
    mockGetLogs.mockRejectedValue(new Error('filter too wide'));
    await expect(client.getLogs({})).rejects.toBeInstanceOf(RpcError);
  });

  it('getSponsorInfo without epochTag', async () => {
    const info = { sponsorForGas: ADDR, sponsorForCollateral: ADDR };
    mockGetSponsorInfo.mockResolvedValue(info);
    expect(await client.getSponsorInfo(ADDR)).toBe(info);
    expect(mockGetSponsorInfo).toHaveBeenCalledWith(
      mockCiveClient,
      expect.objectContaining({ address: ADDR }),
    );
  });

  it('getSponsorInfo with epochTag', async () => {
    mockGetSponsorInfo.mockResolvedValue({});
    await client.getSponsorInfo(ADDR, { epochTag: 'latest_state' });
    expect(mockGetSponsorInfo).toHaveBeenCalledWith(
      mockCiveClient,
      expect.objectContaining({ epochTag: 'latest_state' }),
    );
  });

  it('getSponsorInfo wraps errors in RpcError', async () => {
    mockGetSponsorInfo.mockRejectedValue(new Error('not a contract'));
    await expect(client.getSponsorInfo(ADDR)).rejects.toBeInstanceOf(RpcError);
  });

  it('getAdmin returns an address when one is set', async () => {
    mockGetAdmin.mockResolvedValue(ADDR);
    expect(await client.getAdmin(ADDR)).toBe(ADDR);
  });

  it('getAdmin returns null when no admin is set', async () => {
    mockGetAdmin.mockResolvedValue(null);
    expect(await client.getAdmin(ADDR)).toBeNull();
  });

  it('getAdmin with epochTag', async () => {
    mockGetAdmin.mockResolvedValue(null);
    await client.getAdmin(ADDR, { epochTag: 'latest_state' });
    expect(mockGetAdmin).toHaveBeenCalledWith(
      mockCiveClient,
      expect.objectContaining({ epochTag: 'latest_state' }),
    );
  });

  it('getAdmin wraps errors in RpcError', async () => {
    mockGetAdmin.mockRejectedValue(new Error('bad address'));
    await expect(client.getAdmin(ADDR)).rejects.toBeInstanceOf(RpcError);
  });

  it('request delegates to the cive client', async () => {
    mockCiveClient.request.mockResolvedValue({ chainId: 1029 });
    const result = await client.request({ method: 'cfx_getStatus' });
    expect(result).toEqual({ chainId: 1029 });
  });

  it('request wraps errors in RpcError', async () => {
    mockCiveClient.request.mockRejectedValue(new Error('timeout'));
    await expect(client.request({ method: 'cfx_getStatus' })).rejects.toBeInstanceOf(RpcError);
  });

  it('getGasPrice returns the current gas price', async () => {
    mockGetGasPrice.mockResolvedValue(1_000_000_000n);
    expect(await client.getGasPrice()).toBe(1_000_000_000n);
  });

  it('getGasPrice wraps errors in RpcError', async () => {
    mockGetGasPrice.mockRejectedValue(new Error('bad'));
    await expect(client.getGasPrice()).rejects.toBeInstanceOf(RpcError);
  });

  it('getTransactionCount returns the nonce as a number', async () => {
    mockGetNextNonce.mockResolvedValue(3n);
    const count = await client.getTransactionCount(ADDR);
    expect(count).toBe(3);
  });

  it('getTransactionCount passes epochTag when provided', async () => {
    mockGetNextNonce.mockResolvedValue(0n);
    await client.getTransactionCount(ADDR, { epochTag: 'latest_state' });
    expect(mockGetNextNonce).toHaveBeenCalledWith(
      mockCiveClient,
      expect.objectContaining({ epochTag: 'latest_state' }),
    );
  });

  it('getTransactionCount wraps errors in RpcError', async () => {
    mockGetNextNonce.mockRejectedValue(new Error('bad'));
    await expect(client.getTransactionCount(ADDR)).rejects.toBeInstanceOf(RpcError);
  });

  it('sendRawTransaction returns the tx hash', async () => {
    mockSendRawTransaction.mockResolvedValue(HASH);
    const hash = await client.sendRawTransaction('0xdeadbeef' as `0x${string}`);
    expect(hash).toBe(HASH);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(
      mockCiveClient,
      expect.objectContaining({ serializedTransaction: '0xdeadbeef' }),
    );
  });

  it('sendRawTransaction wraps errors in RpcError', async () => {
    mockSendRawTransaction.mockRejectedValue(new Error('nonce too low'));
    await expect(client.sendRawTransaction('0xdeadbeef' as `0x${string}`)).rejects.toBeInstanceOf(
      RpcError,
    );
  });
});

describe('createCoreClient / toCiveChain branch coverage', () => {
  it('builds a client from a chain with no explorer and no ws rpc (coreSpaceLocal)', () => {
    // coreSpaceLocal has no explorer and no ws — exercises the false branches in toCiveChain
    const client = createCoreClient(coreSpaceLocal, http());
    expect(client.family).toBe('core');
    expect(client.chain).toBe(coreSpaceLocal);
  });
});
