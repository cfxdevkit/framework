import type { ReactNode } from 'react';
import './demo-card.css';

export interface DemoCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function DemoCard({ title, description, children }: DemoCardProps) {
  return (
    <section className="cfx-demo-card">
      <div className="cfx-demo-card-header">
        <h3 className="cfx-demo-card-title">{title}</h3>
        {description && <p className="cfx-demo-card-desc">{description}</p>}
      </div>
      {children && <div className="cfx-demo-card-body">{children}</div>}
    </section>
  );
}
