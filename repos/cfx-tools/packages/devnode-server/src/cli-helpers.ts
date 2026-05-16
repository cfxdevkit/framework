export interface StatusSnapshot {
  health: { ok: boolean };
  node: unknown;
  keystore: unknown;
}

export function renderHelp(defaults: { baseUrl: string; host: string; port: number }): string {
  return `cfxdevkit-devnode-server - local Conflux runtime control plane

Usage:
  cfxdevkit-devnode-server serve [--host <host>] [--port <port>] [--keystore-path <path>]
  cfxdevkit-devnode-server status [--base-url <url>] [--json]
  cfxdevkit-devnode-server start [--base-url <url>] [--accounts <n>] [--data-dir <path>] [--mnemonic <words>] [--mining-interval <ms>] [--logging] [--json]
  cfxdevkit-devnode-server stop [--base-url <url>] [--json]
  cfxdevkit-devnode-server restart [--base-url <url>] [--accounts <n>] [--data-dir <path>] [--mnemonic <words>] [--mining-interval <ms>] [--logging] [--json]
  cfxdevkit-devnode-server wipe [--base-url <url>] [--restart] [--accounts <n>] [--data-dir <path>] [--mnemonic <words>] [--mining-interval <ms>] [--logging] [--json]
  cfxdevkit-devnode-server mine [--base-url <url>] [--blocks <n> | --pack] [--json]

Defaults:
  --host ${defaults.host}
  --port ${defaults.port}
  --base-url ${defaults.baseUrl}
`;
}

export async function requestJson(
  fetchImpl: typeof fetch,
  baseUrl: string,
  path: string,
  method: 'GET' | 'POST',
  body?: unknown,
): Promise<unknown> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  const response = await fetchImpl(new URL(path, ensureTrailingSlash(baseUrl)), init);
  const payload = (await response.json().catch(() => undefined)) as
    | { ok?: boolean; error?: string }
    | undefined;

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error ?? `request failed with status ${response.status}`);
  }
  return payload ?? { ok: response.ok };
}

export function renderCliResult(command: string, result: unknown, asJson: boolean): string {
  if (asJson) return `${JSON.stringify(result, null, 2)}\n`;
  if (command === 'status') {
    return `${renderStatus(result as StatusSnapshot)}\n`;
  }
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function formatBaseUrl(host: string, port: number): string {
  return `http://${host}:${port}`;
}

export function parseInteger(raw: string, flag: string, minimum: number): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`${flag} must be an integer >= ${minimum}`);
  }
  return parsed;
}

function renderStatus(snapshot: StatusSnapshot): string {
  const node = readRecord(snapshot.node);
  const nodeInfo = readRecord(node.node);
  const urls = readRecord(nodeInfo.urls);
  const keystore = readRecord(snapshot.keystore);
  return [
    `Health   : ${snapshot.health.ok ? 'ok' : 'down'}`,
    `Node     : ${String(nodeInfo.status ?? 'unknown')}`,
    `Running  : ${String(nodeInfo.running ?? false)}`,
    `RPC core : ${String(urls.core ?? 'n/a')}`,
    `RPC evm  : ${String(urls.espace ?? 'n/a')}`,
    `Keystore : initialized=${String(keystore.initialized ?? false)} locked=${String(keystore.locked ?? true)} wallets=${String(keystore.walletCount ?? 0)}`,
  ].join('\n');
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}
