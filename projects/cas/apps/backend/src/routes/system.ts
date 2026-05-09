import type { CasSystemStatusResponse } from '@cfxdevkit/cas-shared';
import type { Router } from 'express';
import express from 'express';
import { createPublicClient, http } from 'viem';
import type { CasBackendState } from '../types.js';

const STARTED_AT = Date.now();
const TEN_MINUTES_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function createSystemRouter(state: CasBackendState): Router {
  const router = express.Router();

  router.get('/status', async (_req, res) => {
    const started = Date.now();
    const database = readDatabaseHealth(state);
    const rpc = await readRpcHealth(state);
    const contracts = await readContractsHealth(state);
    const lastSeenAt = database.workerLastSeenAt;
    const lastExecutionAt = database.lastExecutionAt;
    const response: CasSystemStatusResponse = {
      ts: new Date(started).toISOString(),
      network: state.config.network,
      backend: {
        ok: true,
        uptimeSeconds: Math.floor((started - STARTED_AT) / 1000),
        uptimeHuman: formatDuration(started - STARTED_AT),
      },
      database,
      rpc,
      contracts,
      worker: {
        status: readWorkerStatus(started, lastSeenAt, lastExecutionAt),
        lastSeenAt,
        lastExecutionAt,
      },
      paused: state.db.settings.isPaused(),
      checkedInMs: Date.now() - started,
    };
    res.json(response);
  });

  return router;
}

function readDatabaseHealth(state: CasBackendState): CasSystemStatusResponse['database'] {
  const row = state.db.sqlite
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM jobs) AS jobCount,
        (SELECT COUNT(*) FROM executions) AS executionCount,
        (SELECT COUNT(*) FROM jobs WHERE status = 'pending') AS pending,
        (SELECT COUNT(*) FROM jobs WHERE status = 'active') AS active,
        (SELECT COUNT(*) FROM jobs WHERE status = 'failed') AS failed,
        (SELECT MAX(timestamp) FROM executions) AS lastExecutionAt
      `,
    )
    .get() as {
    jobCount: number;
    executionCount: number;
    pending: number;
    active: number;
    failed: number;
    lastExecutionAt: number | null;
  };
  return {
    ok: true,
    jobCount: row.jobCount,
    executionCount: row.executionCount,
    pending: row.pending,
    active: row.active,
    failed: row.failed,
    lastExecutionAt: row.lastExecutionAt,
    workerLastSeenAt: state.db.heartbeat.get()?.lastSeenAt ?? null,
  };
}

async function readRpcHealth(state: CasBackendState): Promise<CasSystemStatusResponse['rpc']> {
  const started = Date.now();
  try {
    const client = createPublicClient({ transport: http(state.config.rpcUrl) });
    const blockNumber = await client.getBlockNumber();
    return {
      ok: true,
      url: state.config.rpcUrl,
      blockNumber: blockNumber.toString(),
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      url: state.config.rpcUrl,
      latencyMs: Date.now() - started,
      error: readError(error),
    };
  }
}

async function readContractsHealth(
  state: CasBackendState,
): Promise<CasSystemStatusResponse['contracts']> {
  const client = createPublicClient({ transport: http(state.config.rpcUrl) });
  const [automationManager, priceAdapter, permitHandler] = await Promise.all([
    readContractHealth(client, state.config.automationManagerAddress),
    readContractHealth(client, state.config.priceAdapterAddress),
    readContractHealth(client, state.config.permitHandlerAddress),
  ]);
  return { automationManager, priceAdapter, permitHandler };
}

async function readContractHealth(
  client: ReturnType<typeof createPublicClient>,
  address: `0x${string}`,
): Promise<CasSystemStatusResponse['contracts']['automationManager']> {
  try {
    const bytecode = await client.getBytecode({ address });
    return { ok: Boolean(bytecode && bytecode !== '0x'), address };
  } catch (error) {
    return { ok: false, address, error: readError(error) };
  }
}

function readWorkerStatus(now: number, lastSeenAt: number | null, lastExecutionAt: number | null) {
  const marker = Math.max(lastSeenAt ?? 0, lastExecutionAt ?? 0);
  if (marker === 0) return 'unknown';
  if (now - marker < TEN_MINUTES_MS) return 'active';
  if (now - marker < DAY_MS) return 'idle';
  return 'unknown';
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function readError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
