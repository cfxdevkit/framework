import type { ReactNode } from 'react';

export interface FieldProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  hint?: ReactNode;
  label: string;
  labelClassName?: string;
  required?: boolean;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function Field({
  children,
  className,
  contentClassName,
  hint,
  label,
  labelClassName,
  required = false,
}: FieldProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Field wraps form controls passed as children.
    <label
      className={joinClasses(
        'flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300',
        className,
      )}
    >
      <span className={joinClasses('font-medium text-slate-100', labelClassName)}>
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </span>
      {hint ? <span className="text-xs leading-5 text-slate-400">{hint}</span> : null}
      {contentClassName ? <div className={contentClassName}>{children}</div> : children}
    </label>
  );
}
