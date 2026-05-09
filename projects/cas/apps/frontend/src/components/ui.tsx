import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return <main className="app-shell">{children}</main>;
}

export function Topbar({ brand, actions }: { brand: ReactNode; actions: ReactNode }) {
  return (
    <header className="topbar">
      <div className="brand">{brand}</div>
      <div className="toolbar">{actions}</div>
    </header>
  );
}

export function MainGrid({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <section className="main-grid">
      <div className="stack">{sidebar}</div>
      {children}
    </section>
  );
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

export interface PanelProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function PanelBody({ children }: { children: ReactNode }) {
  return <div className="panel-body">{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Field wraps form controls passed as children.
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Notice({ tone = 'neutral', children }: NoticeProps) {
  return <div className={`notice ${tone === 'neutral' ? '' : tone}`}>{children}</div>;
}

export interface NoticeProps {
  tone?: 'neutral' | 'ok' | 'error';
  children: ReactNode;
}

export function IconButton({ title, children, ...props }: IconButtonProps) {
  return (
    <button className="button icon" type="button" title={title} aria-label={title} {...props}>
      {children}
    </button>
  );
}

export type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'type' | 'aria-label'
> & {
  title: string;
};

export function StatusGrid({ children }: { children: ReactNode }) {
  return <div className="status-grid">{children}</div>;
}

export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
