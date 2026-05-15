import type { ReactNode } from 'react';

export interface StatusGridProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

const COLUMN_CLASS_NAMES: Record<NonNullable<StatusGridProps['columns']>, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 xl:grid-cols-3',
  4: 'md:grid-cols-2 xl:grid-cols-4',
};

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function StatusGrid({ children, className, columns = 3 }: StatusGridProps) {
  return (
    <div className={joinClasses('grid grid-cols-1 gap-3', COLUMN_CLASS_NAMES[columns], className)}>
      {children}
    </div>
  );
}
