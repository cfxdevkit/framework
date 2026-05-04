import type { KeystoreProvider } from '@cfxdevkit/services/keystore';
import { useEffect, useState } from 'react';
import type { KeystoreSessionStatus } from './keystore-session-model.js';

export function useMemoryKeystore() {
  const [keystore, setKeystore] = useState<KeystoreProvider | null>(null);
  const [status, setStatus] = useState<KeystoreSessionStatus>('unconfigured');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('unlocking');
    void import('@cfxdevkit/services/keystore-memory')
      .then((mod) => {
        if (cancelled) return;
        setKeystore(mod.createMemoryKeystore());
        setStatus('ready');
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { keystore, status, error, setError };
}
