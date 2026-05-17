'use client';

import { KeystoreProvider } from '@cfxdevkit/react/keystore';
import type { ReactNode } from 'react';
import { showcaseRuntimeClient } from './runtime/devkit-client';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <KeystoreProvider keystore={showcaseRuntimeClient.keystore} pollIntervalMs={4000}>
      {children}
    </KeystoreProvider>
  );
}
