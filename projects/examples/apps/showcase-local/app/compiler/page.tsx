'use client';

import { DemoCard, Shell } from '@cfxdevkit/example-showcase-ui';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function CompilerPage() {
  return (
    <Shell title="Conflux Local Showcase">
      <DemoCard
        title="Compiler — Solidity → ABI + Bytecode"
        description="Compile Solidity source in the browser via the bundled solc wrapper and inspect the resulting ABI and bytecode."
      >
        <p style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-sm)' }}>
          Chapter coming soon — implemented in <code>examples-showcase-local</code>.
        </p>
      </DemoCard>
    </Shell>
  );
}
