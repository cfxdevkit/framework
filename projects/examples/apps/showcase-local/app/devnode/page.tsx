'use client';

import { DemoCard, Shell } from '@cfxdevkit/example-showcase-ui';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function DevnodePage() {
  return (
    <Shell title="Conflux Local Showcase">
      <DemoCard
        title="DevNode — Start & Inspect"
        description="Start and stop a local Conflux devnode, view status, and stream logs in real time."
      >
        <p style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-sm)' }}>
          Chapter coming soon — implemented in <code>examples-showcase-local</code>.
        </p>
      </DemoCard>
    </Shell>
  );
}
