import type { Address } from '@cfxdevkit/core/types';
import { useSigner } from './context.js';

export interface UseAccountReturn {
  address: Address | null;
  isConnected: boolean;
}

/**
 * Returns the address of the current signer (if any).
 * When no signer is present the session is read-only: `address` is `null`
 * and `isConnected` is `false`.
 */
export function useAccount(): UseAccountReturn {
  const signer = useSigner();
  return {
    address: signer?.address ?? null,
    isConnected: signer !== null,
  };
}
