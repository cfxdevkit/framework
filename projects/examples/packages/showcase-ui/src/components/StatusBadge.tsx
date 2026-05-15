import './status-badge.css';

export type BadgeStatus = 'ok' | 'error' | 'pending' | 'info';

export interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
}

const DEFAULT_LABELS: Record<BadgeStatus, string> = {
  ok: 'ok',
  error: 'error',
  pending: '...',
  info: 'info',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`cfx-status-badge cfx-status-badge--${status}`}>
      {label ?? DEFAULT_LABELS[status]}
    </span>
  );
}
