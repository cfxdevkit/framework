import './globals.css';
import '@cfxdevkit/theme/css';
import '@cfxdevkit/theme/dark';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Conflux Framework Showcase',
  description: 'Interactive examples for the Conflux developer framework — testnet ready.',
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
