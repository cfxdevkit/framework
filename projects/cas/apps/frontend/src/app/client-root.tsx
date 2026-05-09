'use client';

import type { ReactNode } from 'react';
import { CasNavBar } from '../components/CasNavBar';
import { Providers } from './providers';

export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <CasNavBar />
      <main>{children}</main>
    </Providers>
  );
}
