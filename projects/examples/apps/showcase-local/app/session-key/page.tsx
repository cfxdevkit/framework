'use client';

import { DemoCard, Shell } from '@cfxdevkit/example-showcase-ui';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function SessionKeyPage() {
  return (
    <Shell title="Conflux Local Showcase">
      <DemoCard
        title="Session Key — Delegated Transactions"
        description="Derive limited-privilege session keys, configure allowances, and execute delegated transactions."
      >
        <p style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-sm)' }}>
          Chapter coming soon — implemented in <code>examples-showcase-local</code>.
        </p>
      </DemoCard>
    </Shell>
  );
}
