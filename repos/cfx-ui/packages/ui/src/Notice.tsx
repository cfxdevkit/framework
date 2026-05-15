import type { ReactNode } from 'react';

export type NoticeTone = 'neutral' | 'info' | 'ok' | 'success' | 'warning' | 'error';

export interface NoticeProps {
  children: ReactNode;
  className?: string;
  tone?: NoticeTone;
}

const TONE_CLASS_NAMES: Record<NoticeTone, string> = {
  neutral: 'border-slate-800 bg-slate-950/70 text-slate-200',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
  ok: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  error: 'border-red-500/20 bg-red-500/10 text-red-100',
};

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function Notice({ children, className, tone = 'neutral' }: NoticeProps) {
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={joinClasses(
        'rounded-2xl border px-4 py-3 text-sm leading-6',
        TONE_CLASS_NAMES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
