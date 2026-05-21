import type { Address } from '@cfxdevkit/cdk/types';
import { useMemo, useState } from 'react';
import type { ChainId, TokenInfo, TokenRegistry } from '../types.js';

export interface TokenPickerProps {
  registry: TokenRegistry;
  chainId: ChainId;
  selected?: Address;
  onSelect: (token: TokenInfo) => void;
  /** Placeholder for the search input. Default: "Search tokens…" */
  placeholder?: string;
}

const containerStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-2)',
  fontFamily: 'var(--cfx-font-sans)',
  color: 'var(--cfx-color-fg-default)',
} as const;

const searchStyle = {
  width: '100%',
  background: 'var(--cfx-color-bg-default)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '8px 12px',
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-default)',
  outline: 'none',
  boxSizing: 'border-box' as const,
} as const;

const listStyle = {
  maxHeight: 320,
  overflowY: 'auto' as const,
  display: 'grid',
  gap: 'var(--cfx-space-1)',
} as const;

const itemBaseStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--cfx-space-2)',
  padding: '10px 12px',
  borderRadius: 'var(--cfx-radius-md)',
  cursor: 'pointer',
  border: '1px solid transparent',
  background: 'transparent',
  width: '100%',
  textAlign: 'left' as const,
  fontFamily: 'var(--cfx-font-sans)',
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-default)',
} as const;

const symbolStyle = {
  fontWeight: 600,
} as const;

const nameStyle = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-xs)',
} as const;

const emptyStyle = {
  textAlign: 'center' as const,
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  padding: 'var(--cfx-space-4)',
} as const;

/**
 * Headless token search + picker. Purely data-driven; no protocol calls.
 * Consumers pass a `registry` created with `createTokenRegistry(tokens)`.
 */
export function TokenPicker({
  registry,
  chainId,
  selected,
  onSelect,
  placeholder = 'Search tokens…',
}: TokenPickerProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => (query.trim() ? registry.search(query, chainId) : registry.list(chainId)),
    [registry, chainId, query],
  );

  return (
    <div style={containerStyle}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={searchStyle}
        // biome-ignore lint/a11y/noAutofocus: token picker search must focus on open for keyboard UX
        autoFocus
      />
      <div style={listStyle}>
        {results.length === 0 ? (
          <p style={emptyStyle}>No tokens found.</p>
        ) : (
          results.map((token) => {
            const isSelected = token.address.toLowerCase() === selected?.toLowerCase();
            return (
              <button
                key={`${token.chainId}:${token.address}`}
                type="button"
                onClick={() => onSelect(token)}
                style={{
                  ...itemBaseStyle,
                  background: isSelected
                    ? 'var(--cfx-color-bg-emphasis)'
                    : 'var(--cfx-color-bg-subtle)',
                  borderColor: isSelected ? 'var(--cfx-color-brand-primary)' : 'transparent',
                }}
              >
                {token.logoURI && (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    width={24}
                    height={24}
                    style={{ borderRadius: '50%', flexShrink: 0 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span>
                  <span style={symbolStyle}>{token.symbol}</span>{' '}
                  <span style={nameStyle}>{token.name}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
