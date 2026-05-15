import type { ReactNode } from 'react';

export interface MetricProps {
  className?: string;
  delta?: string;
  deltaClassName?: string;
  label: string;
  labelClassName?: string;
  value: ReactNode;
  valueClassName?: string;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

function deltaToneClassName(delta: string): string {
  if (delta.startsWith('+')) return 'text-emerald-300';
  if (delta.startsWith('-')) return 'text-red-300';
  return 'text-slate-400';
}

export function Metric({
  className,
  delta,
  deltaClassName,
  label,
  labelClassName,
  value,
  valueClassName,
}: MetricProps) {
  return (
    <div
      className={joinClasses(
        'rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3',
        className,
      )}
    >
      <span
        className={joinClasses(
          'text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400',
          labelClassName,
        )}
      >
        {label}
      </span>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className={joinClasses('text-lg font-semibold text-slate-100', valueClassName)}>
          {value}
        </span>
        {delta ? (
          <span
            className={joinClasses(
              'text-xs font-medium',
              deltaToneClassName(delta),
              deltaClassName,
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
