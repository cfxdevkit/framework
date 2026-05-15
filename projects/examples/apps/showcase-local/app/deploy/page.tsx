'use client';

import { DemoCard, Shell } from '@cfxdevkit/example-showcase-ui';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function DeployPage() {
  return (
    <Shell title="Conflux Local Showcase">
      <DemoCard
        title="Deploy — Contracts to DevNode"
        description="Deploy compiled contracts to the local devnode, inspect receipts, and call contract methods."
      >
        <p style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-sm)' }}>
          Chapter coming soon — implemented in <code>examples-showcase-local</code>.
        </p>
      </DemoCard>
    </Shell>
  );
}
