import { describe, expect, it } from 'vitest';
import { ConfluxDevkitClient } from './index.js';
import { mockFetch } from './test-helpers.js';

describe('@cfxdevkit/client contracts flows', () => {
  describe('contracts namespace', () => {
    it('lists contracts', async () => {
      const fetch = mockFetch({
        'GET /contracts': { body: { ok: true, contracts: [] } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.contracts.list();
      expect(result.contracts).toHaveLength(0);
    });

    it('registers a contract', async () => {
      const contract = {
        id: 'c1',
        name: 'Token',
        address: '0x1',
        abi: [],
        network: 'local',
        chainId: 2030,
        space: 'espace',
        deployedAt: 0,
        deployer: '0xabc',
        txHash: '0xdef',
      };
      const fetch = mockFetch({
        'POST /contracts/register': { status: 201, body: { ok: true, contract } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.contracts.register({ name: 'Token', address: '0x1', abi: [] });
      expect(result.contract.name).toBe('Token');
    });

    it('reads contract state', async () => {
      const fetch = mockFetch({
        'POST /contracts/read': { body: { ok: true, result: '42' } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.contracts.read({
        abi: [],
        address: '0x1',
        functionName: 'value',
      });
      expect(result.result).toBe('42');
    });

    it('writes contract state', async () => {
      const fetch = mockFetch({
        'POST /contracts/write': {
          body: { ok: true, hash: '0xabc', receipt: { status: 'success' } },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.contracts.write({
        abi: [],
        address: '0x1',
        functionName: 'increment',
      });
      expect(result.hash).toBe('0xabc');
    });

    it('calls a tracked contract by id', async () => {
      const fetch = mockFetch({
        'POST /contracts/c1/call': {
          body: { ok: true, hash: '0xcall', receipt: { status: 'success' } },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.contracts.call('c1', {
        functionName: 'increment',
      });
      expect('hash' in result && result.hash).toBe('0xcall');
    });
  });

  describe('compiler namespace', () => {
    it('compiles sources', async () => {
      const fetch = mockFetch({
        'POST /compiler/sources': {
          body: {
            ok: true,
            abi: [],
            bytecode: '0x60006000',
            contractName: 'Counter',
            deployedBytecode: '0x60006000',
            inputHash: 'hash',
            warnings: [],
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.compiler.compileSources({
        contractName: 'Counter',
        source: 'pragma solidity ^0.8.26; contract Counter {}',
      });
      expect(result.contractName).toBe('Counter');
    });
  });

  describe('session keys namespace', () => {
    it('issues a session key', async () => {
      const fetch = mockFetch({
        'POST /session-key/issue': {
          body: {
            ok: true,
            attestation: { digest: 'd', message: 'm', signature: '0xsig' },
            capability: {
              chains: [2030],
              contracts: null,
              maxValuePerTx: '0',
              notAfter: 1,
              selectors: null,
            },
            parent: '0xparent',
            session: '0xsession',
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.sessionKeys.issue({ capability: { chains: [2030] } });
      expect(result.session).toBe('0xsession');
    });

    it('verifies a session key', async () => {
      const fetch = mockFetch({
        'POST /session-key/verify': {
          body: { ok: true, message: 'msg', valid: true },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.sessionKeys.verify({
        parent: '0xparent',
        session: '0xsession',
        signature: '0xsig',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('deploy namespace', () => {
    it('runs a deployment', async () => {
      const fetch = mockFetch({
        'POST /deploy/run': {
          body: {
            ok: true,
            address: '0x1',
            contractId: 'contract-1',
            hash: '0xabc',
            mode: 'local',
            network: 'local',
            receipt: null,
            space: 'espace',
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.deploy.run({ abi: [], bytecode: '0x60006000' });
      expect(result.hash).toBe('0xabc');
      expect(result.contractId).toBe('contract-1');
    });
  });
});
