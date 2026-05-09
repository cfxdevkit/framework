import type { Hash, TxReceipt } from '@cfxdevkit/core/types';
import { useWaitForTransaction } from '@cfxdevkit/react/tx';
import type { TxStatus } from '../types.js';

export interface TxStatusToastProps {
  hash: Hash;
  label?: string;
  onConfirm?: (receipt: TxReceipt) => void;
}

const toastStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--cfx-space-2)',
  padding: '10px 16px',
  borderRadius: 'var(--cfx-radius-md)',
  border: '1px solid var(--cfx-color-border-default)',
  background: 'var(--cfx-color-bg-subtle)',
  fontFamily: 'var(--cfx-font-sans)',
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-default)',
} as const;

const dotStyle = (status: TxStatus): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
  background:
    status === 'pending'
      ? 'var(--cfx-color-feedback-warning)'
      : status === 'success'
        ? 'var(--cfx-color-feedback-success)'
        : 'var(--cfx-color-feedback-danger)',
});

const monoStyle = {
  fontFamily: 'var(--cfx-font-mono)',
  fontSize: 'var(--cfx-text-xs)',
  color: 'var(--cfx-color-fg-muted)',
} as const;

/**
 * Shows the status (pending → success/failed) for a single transaction.
 * Polls the receipt automatically via `useWaitForTransaction`.
 */
export function TxStatusToast({ hash, label, onConfirm }: TxStatusToastProps) {
  const { data: receipt, isLoading, error } = useWaitForTransaction({ hash });

  const status: TxStatus = isLoading
    ? 'pending'
    : error
      ? 'failed'
      : receipt
        ? 'success'
        : 'pending';

  if (receipt && onConfirm) {
    // Fire onConfirm once — use a ref guard in production
    onConfirm(receipt);
  }

  const statusText =
    status === 'pending' ? 'Pending…' : status === 'success' ? 'Confirmed' : 'Failed';

  return (
    <div style={toastStyle}>
      <span style={dotStyle(status)} aria-hidden />
      <span>{label ?? statusText}</span>
      <span style={monoStyle}>
        {hash.slice(0, 8)}…{hash.slice(-6)}
      </span>
    </div>
  );
}
