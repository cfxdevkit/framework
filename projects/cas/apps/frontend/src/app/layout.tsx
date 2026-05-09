import type { Metadata } from 'next';
import { ClientRoot } from './client-root';
import './globals.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/layout.css';
import './styles/forms.css';
import './styles/table.css';
import './styles/strategy.css';

export const metadata: Metadata = {
  title: 'CAS Local Dev',
  description: 'Conflux Automation Site local developer console',
};

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default layout export.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
