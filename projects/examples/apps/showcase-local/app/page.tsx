'use client';

import { DemoCard, Shell } from '@cfxdevkit/example-showcase-ui';
import Link from 'next/link';

const CHAPTERS = [
  {
    slug: 'devnode',
    title: 'DevNode',
    description: 'Start and stop a local Conflux devnode, inspect status, and tail logs.',
  },
  {
    slug: 'keystore',
    title: 'Keystore',
    description:
      'Create encrypted keystores, import private keys, list and sign with managed accounts.',
  },
  {
    slug: 'session-key',
    title: 'Session Key',
    description:
      'Derive limited-privilege session keys, set allowance, and execute delegated transactions.',
  },
  {
    slug: 'compiler',
    title: 'Compiler',
    description: 'Compile Solidity contracts in-browser via the bundled solc wrapper.',
  },
  {
    slug: 'deploy',
    title: 'Deploy',
    description: 'Deploy compiled contracts to the local devnode and interact with them.',
  },
] as const;

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function LocalIndexPage() {
  return (
    <Shell title="Conflux Local Showcase">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--cfx-space-4)',
          padding: 'var(--cfx-space-4)',
        }}
      >
        {CHAPTERS.map((ch) => (
          <Link key={ch.slug} href={`/${ch.slug}`} style={{ textDecoration: 'none' }}>
            <DemoCard title={ch.title} description={ch.description} />
          </Link>
        ))}
      </div>
      <p
        style={{
          padding: 'var(--cfx-space-4)',
          color: 'var(--cfx-color-feedback-warning)',
          fontSize: 'var(--cfx-text-sm)',
        }}
      >
        Local-only — requires a running Conflux devnode on localhost.
      </p>
    </Shell>
  );
}
