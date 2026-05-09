import type { Hash, TxReceipt } from '@cfxdevkit/core/types';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import type { TrackedTx } from '../types.js';
import { TxStatusToast } from './TxStatusToast.js';

// ── Context for tracking tx hashes ────────────────────────────────────────

interface TxListContextValue {
  txs: TrackedTx[];
  track: (hash: Hash, label?: string) => void;
  clear: () => void;
}

const TxListContext = createContext<TxListContextValue | null>(null);

export function TxListProvider({ children }: { children: ReactNode }) {
  const [txs, setTxs] = useState<TrackedTx[]>([]);

  const track = useCallback((hash: Hash, label?: string) => {
    setTxs((prev) => {
      if (prev.some((t) => t.hash === hash)) return prev;
      const entry: TrackedTx = {
        hash,
        status: 'pending',
        submittedAt: Date.now(),
        ...(label !== undefined ? { label } : {}),
      };
      return [entry, ...prev];
    });
  }, []);

  const _updateStatus = useCallback((hash: Hash, status: TrackedTx['status']) => {
    setTxs((prev) => prev.map((t) => (t.hash === hash ? { ...t, status } : t)));
  }, []);

  const clear = useCallback(() => setTxs([]), []);

  return <TxListContext.Provider value={{ txs, track, clear }}>{children}</TxListContext.Provider>;
}

export function useTxList(): TxListContextValue {
  const ctx = useContext(TxListContext);
  if (!ctx) throw new Error('`useTxList` must be inside <TxListProvider>');
  return ctx;
}

// ── TxStatusList component ────────────────────────────────────────────────

export interface TxStatusListProps {
  /** Maximum number of recent txs to show. Default: 5. */
  recent?: number;
  onConfirm?: (hash: Hash, receipt: TxReceipt) => void;
}

const listStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-2)',
  fontFamily: 'var(--cfx-font-sans)',
} as const;

const clearButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-xs)',
  padding: 0,
  fontFamily: 'var(--cfx-font-sans)',
} as const;

/**
 * Renders a list of recently submitted transactions with their live status.
 * Requires `<TxListProvider>` higher in the tree. Use `useTxList().track(hash)`
 * to add transactions.
 */
export function TxStatusList({ recent = 5, onConfirm }: TxStatusListProps) {
  const { txs, clear } = useTxList();
  const visible = txs.slice(0, recent);

  if (visible.length === 0) return null;

  return (
    <div style={listStyle}>
      {visible.map((tx) => (
        <TxStatusToast
          key={tx.hash}
          hash={tx.hash}
          {...(tx.label !== undefined ? { label: tx.label } : {})}
          {...(onConfirm !== undefined ? { onConfirm: (r) => onConfirm(tx.hash, r) } : {})}
        />
      ))}
      <button type="button" onClick={clear} style={clearButtonStyle}>
        Clear all
      </button>
    </div>
  );
}
