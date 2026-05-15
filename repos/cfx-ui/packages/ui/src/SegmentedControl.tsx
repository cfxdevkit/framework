import type { ReactNode } from 'react';

export interface SegmentedControlOption<TValue extends string = string> {
  description?: string;
  disabled?: boolean;
  label: ReactNode;
  title?: string;
  value: TValue;
}

export interface SegmentedControlProps<TValue extends string = string> {
  activeOptionClassName?: string;
  className?: string;
  inactiveOptionClassName?: string;
  onChange: (value: TValue) => void;
  optionClassName?: string;
  options: readonly SegmentedControlOption<TValue>[];
  value: TValue;
}

function joinClasses(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(' ');
}

export function SegmentedControl<TValue extends string = string>({
  activeOptionClassName,
  className,
  inactiveOptionClassName,
  onChange,
  optionClassName,
  options,
  value,
}: SegmentedControlProps<TValue>) {
  return (
    <div
      className={joinClasses(
        'inline-flex w-full flex-wrap rounded-2xl border border-slate-800 bg-slate-950 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            disabled={option.disabled}
            title={option.title ?? option.description}
            onClick={() => onChange(option.value)}
            className={joinClasses(
              'min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200',
              option.disabled &&
                'cursor-not-allowed bg-transparent text-slate-600 hover:bg-transparent hover:text-slate-600',
              optionClassName,
              isActive ? activeOptionClassName : inactiveOptionClassName,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
