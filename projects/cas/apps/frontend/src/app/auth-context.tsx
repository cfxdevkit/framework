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
  useRef,
  useState,
} from 'react';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { readTargetEspaceChain } from '../lib/ethereum';

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

  // Auto-sign guards: fire login() once per connected address, reset on switch.
  const autoSignedForRef = useRef<string | null>(null);
  const prevAddressRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
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

    // Task 2.1: Block SIWE attempt if wallet is on the wrong network
    if (chainId && chainId !== DEFAULT_CHAIN_ID) {
      setError(
        `Wrong network — switch your wallet to ${readTargetEspaceChain().name} (chain ${DEFAULT_CHAIN_ID}) and try again`,
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Task 3.1: Catch network errors on nonce fetch
      let nonce: string;
      try {
        const nonceRes = await client.nonce(normalizedAddress);
        nonce = nonceRes.nonce;
      } catch (err) {
        if (err instanceof TypeError) {
          setError(`Cannot reach CAS backend at ${apiBase} — check NEXT_PUBLIC_CAS_API_URL`);
          return;
        }
        throw err;
      }

      const message = createSiweMessage({
        domain: window.location.host,
        address: normalizedAddress,
        statement: 'Sign in to CAS local dev.',
        uri: window.location.origin,
        chainId: chainId || DEFAULT_CHAIN_ID,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      // Task 3.2: Detect wallet rejection
      let signature: `0x${string}`;
      try {
        signature = await signMessageAsync({ message });
      } catch (err) {
        const name = err instanceof Error ? err.name : '';
        if (name === 'UserRejectedRequestError' || name.includes('UserRejected')) {
          setError('Wallet signature rejected — click Sign In to try again');
          return;
        }
        throw err;
      }

      // Task 3.3: Handle non-200 verify response
      let session: Awaited<ReturnType<typeof client.verify>>;
      try {
        session = await client.verify({ message, signature });
      } catch (err) {
        if (err instanceof Error && err.name === 'CasApiError' && 'status' in err) {
          setError(
            `Sign-in verification failed — the backend returned ${(err as { status: number }).status}`,
          );
          return;
        }
        throw err;
      }

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
  }, [apiBase, chainId, client, normalizedAddress, signMessageAsync]);

  // Detect address switch; clear JWT and reset auto-sign guard when wallet changes.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (address) prevAddressRef.current = address;
      return;
    }
    if (address) {
      if (prevAddressRef.current && prevAddressRef.current !== address) {
        setToken('');
        clearSession();
        autoSignedForRef.current = null;
      }
      prevAddressRef.current = address;
    }
  }, [address]);

  // Auto-sign: fire login() once per connected address when no JWT exists.
  useEffect(() => {
    if (address && !token && !isLoading && autoSignedForRef.current !== address) {
      autoSignedForRef.current = address;
      void login();
    }
  }, [address, token, isLoading, login]);

  const logout = useCallback(() => {
    clearSession();
    setToken('');
    setIsAdmin(false);
    autoSignedForRef.current = null;
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
  return readTargetEspaceChain().chainId;
}
