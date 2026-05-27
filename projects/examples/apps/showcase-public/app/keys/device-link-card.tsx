'use client';

import Link from 'next/link';
import { PANEL_STYLE } from './panel-styles';

interface DeviceLinkCardProps {
  href: string;
  title: string;
  subtitle: string;
  features: { label: string; supported: boolean; exclusive?: boolean }[];
}

export function DeviceLinkCard({ href, title, subtitle, features }: DeviceLinkCardProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          ...PANEL_STYLE,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
      >
        <p style={{ fontWeight: 700, fontSize: 'var(--cfx-text-base)', margin: 0 }}>{title}</p>
        <p
          style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-sm)', margin: 0 }}
        >
          {subtitle}
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '2px' }}>
          {features.map((f) => (
            <li
              key={f.label}
              style={{
                fontSize: 'var(--cfx-text-xs)',
                color: f.supported ? 'var(--cfx-color-fg-subtle)' : 'var(--cfx-color-fg-muted)',
              }}
            >
              {f.supported ? '✅' : '❌'} {f.label}
              {f.exclusive && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    background:
                      'color-mix(in srgb, var(--cfx-color-brand-primary) 15%, transparent)',
                    color: 'var(--cfx-color-brand-primary)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  exclusive
                </span>
              )}
            </li>
          ))}
        </ul>
        <span
          style={{
            fontSize: 'var(--cfx-text-sm)',
            color: 'var(--cfx-color-brand-primary)',
            fontWeight: 500,
          }}
        >
          Open demo →
        </span>
      </div>
    </Link>
  );
}
