'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type WalletSessionKind = 'browser' | 'hardware' | 'keystore';

export interface WalletSession {
  id: string;
  label: string;
  kind: WalletSessionKind;
  addresses: {
    eSpace?: `0x${string}`;
    core?: string;
  };
  source?: string;
  connectedAt: number;
}

interface RegisterWalletSessionInput {
  id: string;
  label: string;
  kind: WalletSessionKind;
  addresses: {
    eSpace?: `0x${string}`;
    core?: string;
  };
  source?: string;
}

interface WalletSessionContextValue {
  sessions: WalletSession[];
  activeSession: WalletSession | null;
  activeSessionId: string | null;
  registerSession: (input: RegisterWalletSessionInput) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  clearSessions: () => void;
}

const WalletSessionContext = createContext<WalletSessionContextValue | null>(null);

export function WalletSessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<WalletSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const registerSession = useCallback((input: RegisterWalletSessionInput) => {
    setSessions((prev) => {
      const nextSession: WalletSession = {
        ...input,
        connectedAt: Date.now(),
      };
      const existingIndex = prev.findIndex((session) => session.id === input.id);
      if (existingIndex === -1) return [...prev, nextSession];
      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...nextSession,
        connectedAt: updated[existingIndex]?.connectedAt ?? nextSession.connectedAt,
      };
      return updated;
    });
    setActiveSessionId(input.id);
  }, []);

  const removeSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
    setActiveSessionId((prev) => (prev === id ? null : prev));
  }, []);

  const setActiveSession = useCallback((id: string | null) => {
    setActiveSessionId(id);
  }, []);

  const clearSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const value = useMemo<WalletSessionContextValue>(
    () => ({
      sessions,
      activeSession,
      activeSessionId,
      registerSession,
      removeSession,
      setActiveSession,
      clearSessions,
    }),
    [
      activeSession,
      activeSessionId,
      clearSessions,
      registerSession,
      removeSession,
      sessions,
      setActiveSession,
    ],
  );

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
}

export function useWalletSessions(): WalletSessionContextValue {
  const context = useContext(WalletSessionContext);
  if (!context) {
    throw new Error('useWalletSessions must be used within WalletSessionProvider');
  }
  return context;
}
