import type { Address } from '@cfxdevkit/cdk/types';
import type { PortfolioRow, TokenInfo } from '../types.js';
import { usePortfolio } from './usePortfolio.js';

export interface PortfolioTableProps {
  tokens: TokenInfo[];
  address?: Address | null;
  renderRow?: (row: PortfolioRow) => React.ReactNode;
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontFamily: 'var(--cfx-font-sans)',
  color: 'var(--cfx-color-fg-default)',
  fontSize: 'var(--cfx-text-sm)',
} as const;

const thStyle = {
  textAlign: 'left' as const,
  padding: '8px 12px',
  borderBottom: '1px solid var(--cfx-color-border-default)',
  color: 'var(--cfx-color-fg-muted)',
  fontWeight: 500,
} as const;

const tdStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--cfx-color-border-subtle)',
} as const;

const tokenCellStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
} as const;

const tokenMetaStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '2px',
} as const;

const tokenNameStyle = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-xs)',
} as const;

const tokenIconFallbackStyle = {
  width: 28,
  height: 28,
  borderRadius: '999px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--cfx-color-bg-emphasis)',
  color: 'var(--cfx-color-fg-default)',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  flexShrink: 0,
} as const;

const monoStyle = {
  fontFamily: 'var(--cfx-font-mono)',
} as const;

function tokenInitials(symbol: string): string {
  return symbol.slice(0, 2) || '?';
}

const defaultRenderRow = (row: PortfolioRow) => (
  <tr key={row.token.address}>
    <td style={tdStyle}>
      <div style={tokenCellStyle}>
        {row.token.logoURI ? (
          <img
            src={row.token.logoURI}
            alt={row.token.symbol}
            width={28}
            height={28}
            style={{ borderRadius: '999px', flexShrink: 0 }}
          />
        ) : (
          <span style={tokenIconFallbackStyle}>{tokenInitials(row.token.symbol)}</span>
        )}
        <span style={tokenMetaStyle}>
          <span>{row.token.symbol}</span>
          <span style={tokenNameStyle}>{row.token.name}</span>
        </span>
      </div>
    </td>
    <td style={{ ...tdStyle, ...monoStyle }}>{row.formatted}</td>
    <td style={{ ...tdStyle, color: 'var(--cfx-color-fg-muted)', ...monoStyle }}>
      {row.token.address.slice(0, 6)}…{row.token.address.slice(-4)}
    </td>
  </tr>
);

/**
 * Displays a sorted list of token balances for the given address.
 * Requires `@cfxdevkit/theme/css` to be imported for CSS variables to resolve.
 */
export function PortfolioTable({ tokens, address, renderRow }: PortfolioTableProps) {
  const { rows, isLoading, error } = usePortfolio({
    tokens,
    ...(address !== undefined ? { address } : {}),
  });

  if (!address) {
    return (
      <p style={{ fontFamily: 'var(--cfx-font-sans)', color: 'var(--cfx-color-fg-muted)' }}>
        Connect a wallet to view balances.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p style={{ fontFamily: 'var(--cfx-font-sans)', color: 'var(--cfx-color-fg-muted)' }}>
        Loading balances…
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ fontFamily: 'var(--cfx-font-sans)', color: 'var(--cfx-color-feedback-danger)' }}>
        {error.message}
      </p>
    );
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Token</th>
          <th style={thStyle}>Balance</th>
          <th style={thStyle}>Address</th>
        </tr>
      </thead>
      <tbody>{rows.map((row) => (renderRow ? renderRow(row) : defaultRenderRow(row)))}</tbody>
    </table>
  );
}
