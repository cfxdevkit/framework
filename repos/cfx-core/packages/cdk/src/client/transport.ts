import {
  type Transport as CiveTransport,
  fallback as civeFallback,
  http as civeHttp,
  webSocket as civeWebSocket,
} from 'cive';
import {
  type Transport as ViemTransport,
  fallback as viemFallback,
  http as viemHttp,
  webSocket as viemWebSocket,
} from 'viem';
import { CfxError } from '../errors/index.js';

export interface Transport {
  readonly kind: 'http' | 'ws' | 'fallback';
  readonly _viem: ViemTransport;
  readonly _cive: CiveTransport;
}

export interface HttpTransportOptions {
  url?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

export function http(opts: HttpTransportOptions = {}): Transport {
  const { url, headers, timeoutMs, retries } = opts;
  const viemOpts: Parameters<typeof viemHttp>[1] = {};
  if (headers !== undefined) viemOpts.fetchOptions = { headers };
  if (timeoutMs !== undefined) viemOpts.timeout = timeoutMs;
  if (retries !== undefined) viemOpts.retryCount = retries;
  return { kind: 'http', _viem: viemHttp(url, viemOpts), _cive: civeHttp(url, viemOpts) };
}

export interface WsTransportOptions {
  url?: string;
  reconnect?: boolean;
  timeoutMs?: number;
}

export function ws(opts: WsTransportOptions = {}): Transport {
  const { url, reconnect, timeoutMs } = opts;
  const viemOpts: Parameters<typeof viemWebSocket>[1] = {};
  if (reconnect !== undefined) viemOpts.reconnect = reconnect;
  if (timeoutMs !== undefined) viemOpts.timeout = timeoutMs;
  return { kind: 'ws', _viem: viemWebSocket(url, viemOpts), _cive: civeWebSocket(url, viemOpts) };
}

export function fallback(transports: readonly Transport[]): Transport {
  if (transports.length === 0) {
    throw new CfxError({
      code: 'core/client/invalid-transport',
      message: 'fallback() requires at least one transport',
    });
  }
  return {
    kind: 'fallback',
    _viem: viemFallback(transports.map((transport) => transport._viem)),
    _cive: civeFallback(transports.map((transport) => transport._cive)),
  };
}
