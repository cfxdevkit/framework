import { createContext, useContext } from 'react';
import type { KeystoreSessionState } from './keystore-session-model.js';

export const Ctx = createContext<KeystoreSessionState | null>(null);

export function useKeystoreSession(): KeystoreSessionState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useKeystoreSession must be called inside <KeystoreSessionProvider>');
  return value;
}
