import type { ReactNode } from 'react';

export interface PanelProps {
  actions?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  title: string;
}

export interface PanelBodyProps {
  children: ReactNode;
}

export function Panel({ title, icon, actions, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="panel-title">{title}</h2>
        {actions ?? icon}
      </div>
      {children}
    </section>
  );
}

export function PanelBody({ children }: PanelBodyProps) {
  return <div className="panel-body">{children}</div>;
}
