'use client';

import { CasApiClient, type CasHexAddress } from '@cfxdevkit/cas-shared';
import { createSiweMessage } from '@cfxdevkit/wallet-connect/siwe';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAccount, useChainId, useSignMessage } from 'wagmi';

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_CAS_API_URL ?? 'http://127.0.0.1:3011';
const DEFAULT_CHAIN_ID = readDefaultChainId();

interface AuthContextValue {
  address: CasHexAddress | null;
  apiBase: string;
  client: CasApiClient;
  error: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  setApiBase: (value: string) => void;
  token: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [apiBase, setApiBaseState] = useState(DEFAULT_API_BASE);
  const [token, setToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => new CasApiClient({ baseUrl: apiBase, token }), [apiBase, token]);
  const normalizedAddress = address ? (address.toLowerCase() as CasHexAddress) : null;

  useEffect(() => {
    const savedBase = window.localStorage.getItem('cas.apiBase');
    const savedToken = window.localStorage.getItem('cas.token');
    const savedIsAdmin = window.localStorage.getItem('cas.isAdmin');
    if (savedBase) setApiBaseState(savedBase);
    if (savedToken) setToken(savedToken);
    if (savedIsAdmin) setIsAdmin(savedIsAdmin === 'true');
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void client
      .me()
      .then((session) => {
        if (cancelled) return;
        const sessionAddress = session.address.toLowerCase();
        if (normalizedAddress && sessionAddress !== normalizedAddress) {
          clearSession();
          return;
        }
        setIsAdmin(session.isAdmin === true);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [client, normalizedAddress, token]);

  const setApiBase = useCallback((value: string) => {
    setApiBaseState(value);
    window.localStorage.setItem('cas.apiBase', value);
  }, []);

  const login = useCallback(async () => {
    if (!normalizedAddress) throw new Error('Connect an eSpace wallet before signing in.');
    setIsLoading(true);
    setError(null);
    try {
      const { nonce } = await client.nonce(normalizedAddress);
      const message = createSiweMessage({
        domain: window.location.host,
        address: normalizedAddress,
        statement: 'Sign in to CAS local dev.',
        uri: window.location.origin,
        chainId: chainId || DEFAULT_CHAIN_ID,
        nonce,
        issuedAt: new Date().toISOString(),
      });
      const signature = await signMessageAsync({ message });
      const session = await client.verify({ message, signature });
      setToken(session.token);
      setIsAdmin(session.isAdmin === true);
      window.localStorage.setItem('cas.token', session.token);
      window.localStorage.setItem('cas.isAdmin', String(session.isAdmin === true));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chainId, client, normalizedAddress, signMessageAsync]);

  const logout = useCallback(() => {
    clearSession();
    setToken('');
    setIsAdmin(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      address: normalizedAddress,
      apiBase,
      client,
      error,
      isAdmin,
      isLoading,
      login,
      logout,
      setApiBase,
      token,
    }),
    [
      apiBase,
      client,
      error,
      isAdmin,
      isLoading,
      login,
      logout,
      normalizedAddress,
      setApiBase,
      token,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuthContext must be used inside AuthProvider');
  return value;
}

function clearSession() {
  window.localStorage.removeItem('cas.token');
  window.localStorage.removeItem('cas.isAdmin');
}

function readDefaultChainId(): number {
  if (process.env.NEXT_PUBLIC_CAS_NETWORK === 'mainnet') return 1030;
  if (process.env.NEXT_PUBLIC_CAS_NETWORK === 'local') return 2030;
  return 71;
}
