import type { Address, Hex, RawLog } from '@cfxdevkit/core/types';
import { useEffect, useRef } from 'react';
import type { Abi } from 'viem';
import { decodeEventLog, encodeEventTopics } from 'viem';
import { useClient } from './context.js';

// ── useWatchEvent ─────────────────────────────────────────────────────────────

export interface WatchEventLog {
  eventName: string;
  args: Record<string, unknown>;
}

export interface UseWatchEventInput {
  address: Address;
  abi: Abi;
  eventName: string;
  args?: Record<string, unknown>;
  /** Poll interval in ms. Default: 4000. */
  pollIntervalMs?: number;
  /** Set to false to pause the subscription. Default: true. */
  enabled?: boolean;
  onLogs: (logs: WatchEventLog[]) => void;
  onError?: (error: unknown) => void;
}

/**
 * Polls `eth_getLogs` on an interval and calls `onLogs` with newly decoded entries.
 *
 * - The effect cleans up automatically when the component unmounts or when
 *   any of the key inputs change.
 * - `onLogs` is intentionally not in the dependency array — pass a stable
 *   callback (e.g. wrapped in `useCallback`) to avoid restarting the loop.
 */
export function useWatchEvent(input: UseWatchEventInput): void {
  const client = useClient();
  const {
    address,
    abi,
    eventName,
    args,
    pollIntervalMs = 4_000,
    enabled = true,
    onLogs,
    onError,
  } = input;

  // Keep callback refs to avoid restarting the poll on every render
  const onLogsRef = useRef(onLogs);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onLogsRef.current = onLogs;
  }, [onLogs]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let fromBlock: `0x${string}` = '0x0';

    // Build topic filter for the specific event — use inferred parameter type
    type EncodeArgs = Parameters<typeof encodeEventTopics>[0];
    const topics = encodeEventTopics({ abi, eventName, args } as EncodeArgs) as Hex[];

    const poll = async () => {
      if (stopped) return;
      try {
        const blockHex = await client.request<`0x${string}`>({
          method: 'eth_blockNumber',
          params: [],
        });

        const rawLogs = await client.request<RawLog[]>({
          method: 'eth_getLogs',
          params: [{ address, topics, fromBlock, toBlock: blockHex }],
        });

        fromBlock = `0x${(BigInt(blockHex) + 1n).toString(16)}`;

        if (!stopped && rawLogs.length > 0) {
          const decoded = rawLogs.map((log) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = decodeEventLog({
              abi,
              data: log.data as Hex,
              topics: log.topics as [Hex, ...Hex[]],
            }) as unknown as { eventName: string; args: Record<string, unknown> };
            return result;
          });
          onLogsRef.current(decoded);
        }
      } catch (err) {
        if (!stopped) {
          onErrorRef.current?.(err);
        }
      }

      if (!stopped) {
        setTimeout(poll, pollIntervalMs);
      }
    };

    const timer = setTimeout(poll, 0);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [client, address, abi, eventName, args, pollIntervalMs, enabled]);
}
