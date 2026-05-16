import './globals.css';
import '@cfxdevkit/theme/css';
import '@cfxdevkit/theme/dark';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Conflux Backend Showcase',
  description:
    'Single-page backend-driven showcase for keystore, local devnode, session keys, compile, and deploy across local, testnet, and mainnet.',
};

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default layout export.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
