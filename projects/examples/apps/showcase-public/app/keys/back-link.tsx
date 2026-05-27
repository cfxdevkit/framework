'use client';

import Link from 'next/link';

export function BackLink() {
  return (
    <Link
      href="/keys"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--cfx-text-sm)',
        color: 'var(--cfx-color-fg-muted)',
        textDecoration: 'none',
        marginBottom: 'var(--cfx-space-4)',
      }}
    >
      ← Keys &amp; Signers
    </Link>
  );
}
