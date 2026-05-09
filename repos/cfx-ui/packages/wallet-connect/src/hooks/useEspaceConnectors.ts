import { useMemo } from 'react';
import type { Connector } from 'wagmi';
import { useConnect, useConnectors } from 'wagmi';

export interface UseEspaceConnectorsReturn {
  connectors: Connector[];
  connect: (connector: Connector, callbacks?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  error: Error | null;
}

/**
 * Returns deduplicated eSpace connectors and a connect handler.
 * Connectors are deduplicated by `${id}:${name}` to prevent the same
 * injected wallet from appearing multiple times.
 */
export function useEspaceConnectors(): UseEspaceConnectorsReturn {
  const allConnectors = useConnectors();
  const { connect, isPending, error } = useConnect();

  const connectors = useMemo(() => {
    const seen = new Set<string>();
    const unique: Connector[] = [];
    for (const connector of allConnectors) {
      const key = `${connector.id}:${connector.name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(connector);
    }
    return unique;
  }, [allConnectors]);

  return {
    connectors,
    connect: (connector, callbacks) =>
      connect(
        { connector },
        ...(callbacks?.onSuccess !== undefined ? [{ onSuccess: callbacks.onSuccess }] : [{}]),
      ),
    isPending,
    error,
  };
}
