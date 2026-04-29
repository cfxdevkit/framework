import { type ChainConfig, createClient, getChain, http, listChains } from '@cfxdevkit/core';
import { getBool, getNumber, getString } from '../args.js';

export interface StatusReport {
  chain: string;
  chainId: number;
  family: 'core' | 'espace';
  network: string;
  rpc: string;
  ok: boolean;
  /** Block number (eSpace) or epoch number (Core Space). */
  head?: string;
  latencyMs?: number;
  error?: string;
}

export interface RunStatusOptions {
  chain?: string;
  rpc?: string;
  timeoutMs?: number;
}

export async function runStatus(opts: RunStatusOptions): Promise<StatusReport[]> {
  const targets: ChainConfig[] = opts.chain ? [resolveChain(opts.chain)] : [...listChains()];
  const reports: StatusReport[] = [];
  for (const chain of targets) {
    reports.push(await pingChain(chain, opts));
  }
  return reports;
}

function resolveChain(idOrName: string): ChainConfig {
  const numeric = Number(idOrName);
  return getChain(Number.isFinite(numeric) && idOrName.trim() !== '' ? numeric : idOrName);
}

async function pingChain(chain: ChainConfig, opts: RunStatusOptions): Promise<StatusReport> {
  const rpcUrl = opts.rpc ?? chain.rpc.http[0] ?? '';
  const transportOpts: Parameters<typeof http>[0] = {};
  if (opts.rpc !== undefined) transportOpts.url = opts.rpc;
  if (opts.timeoutMs !== undefined) transportOpts.timeoutMs = opts.timeoutMs;
  const transport = http(transportOpts);
  const client = createClient({ chain, transport });

  const base: StatusReport = {
    chain: chain.name,
    chainId: chain.id,
    family: chain.family,
    network: chain.network,
    rpc: rpcUrl,
    ok: false,
  };

  const start = Date.now();
  try {
    const head =
      client.family === 'core' ? await client.getEpochNumber() : await client.getBlockNumber();
    return {
      ...base,
      ok: true,
      head: head.toString(),
      latencyMs: Date.now() - start,
    };
  } catch (cause) {
    return {
      ...base,
      ok: false,
      latencyMs: Date.now() - start,
      error: cause instanceof Error ? cause.message : String(cause),
    };
  }
}

export async function statusFromFlags(
  flags: Record<string, string | boolean>,
  out: NodeJS.WritableStream,
): Promise<number> {
  const opts: RunStatusOptions = {};
  const chain = getString(flags, 'chain');
  if (chain !== undefined) opts.chain = chain;
  const rpc = getString(flags, 'rpc');
  if (rpc !== undefined) opts.rpc = rpc;
  const timeoutMs = getNumber(flags, 'timeout-ms');
  if (timeoutMs !== undefined) opts.timeoutMs = timeoutMs;

  const reports = await runStatus(opts);
  if (getBool(flags, 'json')) {
    out.write(`${JSON.stringify(reports, null, 2)}\n`);
  } else {
    for (const r of reports) {
      const tag = r.ok ? 'OK ' : 'ERR';
      const head = r.head ? `head=${r.head}` : '';
      const lat = r.latencyMs !== undefined ? `${r.latencyMs}ms` : '';
      out.write(
        `${tag} ${r.chain.padEnd(18)} id=${r.chainId.toString().padStart(5)} ${head.padEnd(18)} ${lat.padStart(7)}  ${r.rpc}${r.error ? `  (${r.error})` : ''}\n`,
      );
    }
  }
  return reports.every((r) => r.ok) ? 0 : 1;
}
