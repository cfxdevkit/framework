/**
 * Tiny shared log helper used by the wallet-probe-style panels.
 * Each entry has a monotonic id, a high-precision timestamp, and an
 * optional level for colour-coding.
 */
import { useCallback, useState } from 'react';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  ts: string;
  msg: string;
  level: LogLevel;
}

let _id = 0;

export function makeEntry(msg: string, level: LogLevel = 'info'): LogEntry {
  return {
    id: ++_id,
    ts: new Date().toISOString().slice(11, 23),
    msg,
    level,
  };
}

/** Bounded log list (most-recent first); cap defaults to 30. */
export function useLogList(cap = 30) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const log = useCallback(
    (msg: string, level: LogLevel = 'info') => {
      setEntries((prev) => [makeEntry(msg, level), ...prev.slice(0, cap - 1)]);
    },
    [cap],
  );
  const clear = useCallback(() => setEntries([]), []);
  return { entries, log, clear };
}
