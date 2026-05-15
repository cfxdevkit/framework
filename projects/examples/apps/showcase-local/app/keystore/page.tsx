'use client';

import { DemoCard, Shell } from '@cfxdevkit/example-showcase-ui';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function KeystorePage() {
  return (
    <Shell title="Conflux Local Showcase">
      <DemoCard
        title="Keystore — Encrypted Accounts"
        description="Create keystores, import private keys, list managed accounts, and sign messages with password-protected keys."
      >
        <p style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-sm)' }}>
          Chapter coming soon — implemented in <code>examples-showcase-local</code>.
        </p>
      </DemoCard>
    </Shell>
  );
}
