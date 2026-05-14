import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '../components/shared/NavBar';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Conflux Automation Site',
  description: 'Non-custodial limit orders & DCA on Conflux eSpace',
};

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default layout export.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

