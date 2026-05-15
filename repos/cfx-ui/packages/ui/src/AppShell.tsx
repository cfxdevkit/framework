import type { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
}

export interface TopbarProps {
  actions: ReactNode;
  brand: ReactNode;
}

export interface MainGridProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return <main className="app-shell">{children}</main>;
}

export function Topbar({ brand, actions }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand">{brand}</div>
      <div className="toolbar">{actions}</div>
    </header>
  );
}

export function MainGrid({ sidebar, children }: MainGridProps) {
  return (
    <section className="main-grid">
      <div className="stack">{sidebar}</div>
      {children}
    </section>
  );
}
