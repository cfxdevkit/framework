import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createSiweMessage } from '../siwe/createMessage.js';
import { generateSiweNonce } from '../siwe/nonce.js';

export interface AuthState {
  /** Whether the current wallet address has been verified via SIWE. */
  isAuthenticated: boolean;
  /** The authenticated address, or null if not authenticated. */
  authenticatedAddress: string | null;
  /** True while a sign-in is in progress. */
  isSigningIn: boolean;
  /** The last sign-in error, if any. */
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  /**
   * Initiates a SIWE sign-in flow. The `onVerify` callback receives the
   * signed message + signature and should call your backend to verify.
   * Return `true` if verification succeeds.
   */
  signIn: (onVerify: (message: string, signature: string) => Promise<boolean>) => Promise<void>;
  /** Clears the authenticated state. */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  /**
   * EIP-55 domain for SIWE messages (default: `window.location.host`).
   * Must be set in SSR or test environments.
   */
  domain?: string;
  /**
   * URI for SIWE messages (default: `window.location.href`).
   * Must be set in SSR or test environments.
   */
  uri?: string;
}

/**
 * Provides SIWE-based authentication state.
 *
 * Wrap your app with `<AuthProvider>` and use `useAuth()` in child components.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children, domain, uri }: AuthProviderProps) {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedAddress, setAuthenticatedAddress] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (onVerify: (message: string, signature: string) => Promise<boolean>) => {
      if (!address || !chainId) {
        setError('No wallet connected');
        return;
      }
      setError(null);
      setIsSigningIn(true);
      try {
        const resolvedDomain =
          domain ?? (typeof window !== 'undefined' ? window.location.host : 'localhost');
        const resolvedUri =
          uri ?? (typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        const nonce = generateSiweNonce();
        const message = createSiweMessage({
          domain: resolvedDomain,
          address,
          uri: resolvedUri,
          chainId,
          nonce,
          issuedAt: new Date(),
        });
        const signature = await signMessageAsync({ message });
        const ok = await onVerify(message, signature);
        if (ok) {
          setIsAuthenticated(true);
          setAuthenticatedAddress(address);
        } else {
          setError('Verification failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      } finally {
        setIsSigningIn(false);
      }
    },
    [address, chainId, domain, signMessageAsync, uri],
  );

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setAuthenticatedAddress(null);
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, authenticatedAddress, isSigningIn, error, signIn, signOut }),
    [isAuthenticated, authenticatedAddress, isSigningIn, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Returns the current SIWE auth state and `signIn`/`signOut` actions.
 * Must be used inside `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
